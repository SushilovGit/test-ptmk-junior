from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.queries.dependencies import get_db
from src.queries.models import EmployeeORM, TicketORM, TicketStatusEnum
from datetime import datetime
from src.queries.models import TicketStatusEnum
from src.schemas import (
    PagedResponse, 
    TicketResponseSchema, 
    TicketCreateSchema, 
    TicketStatusUpdateSchema, 
    TicketAssigneeUpdateSchema
)

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.get("/", response_model=PagedResponse[TicketResponseSchema])
async def get_tickets(
    limit: int = Query(24, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(TicketORM.id))
    total_count = (await db.execute(count_query)).scalar_one()

    query = select(TicketORM).offset(offset).limit(limit)
    tickets = (await db.execute(query)).scalars().all()
    
    return PagedResponse(total=total_count, limit=limit, offset=offset, results=tickets)


@router.get("/filtered", response_model=PagedResponse[TicketResponseSchema])
async def get_sorted_tickets(
    limit: int = Query(24, ge=1),
    offset: int = Query(0, ge=0),
    status: TicketStatusEnum = Query(None),
    assignee_id: int = Query(None),
    department_id: int = Query(None),
    is_overdue: bool = Query(None),
    deadline_from: date = Query(None),
    deadline_to: date = Query(None),
    sorted_by: str = Query("deadline"),
    sorted_order: str = Query("asc"),
    db: AsyncSession = Depends(get_db)
):
    query = select(TicketORM)
    count_query = select(func.count(TicketORM.id))

    # Применение фильтров
    def apply_filters(q):
        if status: q = q.where(TicketORM.status == status)
        if assignee_id: q = q.where(TicketORM.assignee_id == assignee_id)
        if deadline_from: q = q.where(TicketORM.deadline >= deadline_from)
        if deadline_to: q = q.where(TicketORM.deadline <= deadline_to)
        if department_id:
            q = q.join(EmployeeORM).where(EmployeeORM.department_id == department_id)
        if is_overdue is not None:
            now = datetime.now()
            cond = (TicketORM.deadline < now) & (TicketORM.status != TicketStatusEnum.COMPLETED)
            q = q.where(cond if is_overdue else ~cond)
        return q

    query = apply_filters(query)
    count_query = apply_filters(count_query)

    total_count = (await db.execute(count_query)).scalar_one()

    # Сортировка
    sort_column = getattr(TicketORM, sorted_by, TicketORM.deadline)
    query = query.order_by(asc(sort_column)
                           if sorted_order == "asc" 
                           else desc(sort_column))

    result = await db.execute(query.offset(offset).limit(limit))
    return PagedResponse(total=total_count, limit=limit, offset=offset, results=result.scalars().all())



@router.post("/", response_model=TicketResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket_data: TicketCreateSchema, db: AsyncSession = Depends(get_db)):
    data = ticket_data.model_dump()
    if data.get("deadline") and hasattr(data["deadline"], "replace"):
        data["deadline"] = data["deadline"].replace(tzinfo=None)

    # проверяем исполнителя
    if data.get("assignee_id") is not None:
        assignee_exists = await db.execute(
            select(EmployeeORM.id).where(EmployeeORM.id == data["assignee_id"])
        )
        if not assignee_exists.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Исполнитель с id {data['assignee_id']} не найден."
            )

    new_ticket = TicketORM(**data)
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    return new_ticket



@router.patch("/{ticket_id}/status", response_model=TicketResponseSchema)
async def update_ticket_status(ticket_id: int, status_data: TicketStatusUpdateSchema, db: AsyncSession = Depends(get_db)):
    """смена статуса заявки"""
    result = await db.execute(select(TicketORM).where(TicketORM.id == ticket_id))
    ticket = result.scalar_one_or_none()

    current_status = ticket.status
    new_status = status_data.status

    if current_status == new_status:
        return ticket

    allowed_transitions = {
        TicketStatusEnum.NEW: [TicketStatusEnum.IN_PROGRESS],
        TicketStatusEnum.IN_PROGRESS: [TicketStatusEnum.COMPLETED],
        TicketStatusEnum.COMPLETED: []
    }

    if new_status not in allowed_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый перевод статуса из {current_status.value} в {new_status.value}"
        )

    ticket.status = new_status
    await db.commit()
    await db.refresh(ticket)
    return ticket

@router.patch("/{ticket_id}/assignee", response_model=TicketResponseSchema)
async def update_ticket_assignee(
    ticket_id: int,
    assignee_data: TicketAssigneeUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    """"""
    result = await db.execute(select(TicketORM).where(TicketORM.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if assignee_data.assignee_id is not None:
        emp_result = await db.execute(select(EmployeeORM.id).where(EmployeeORM.id == assignee_data.assignee_id))
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Указанный исполнитель не найден")

    ticket.assignee_id = assignee_data.assignee_id
    await db.commit()
    await db.refresh(ticket)
    return ticket