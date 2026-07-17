from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel # Добавили импорт BaseModel

from src.dependencies import get_db
from src.models import EmployeeORM, TicketORM, TicketStatusEnum
from src.schemas import PagedTicketResponseSchema, TicketResponseSchema

router = APIRouter(prefix="/tickets", tags=["Tickets"])



from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.models import TicketStatusEnum

# Схема для создания (то, что присылает клиент)
class TicketCreateSchema(BaseModel):
    author_id: int
    assignee_id: Optional[int] = None
    description: str = Field(..., max_length=1000, description="Описание проблемы")
    deadline: datetime
    status: TicketStatusEnum = TicketStatusEnum.NEW  # По умолчанию статус "NEW"

# Схема для ответа (то, что возвращает сервер после успешного создания)
class TicketResponseSingleSchema(BaseModel):
    id: int
    created_at: datetime
    author_id: int
    assignee_id: Optional[int]
    description: str
    deadline: datetime
    status: TicketStatusEnum

    class Config:
        from_attributes = True


@router.get("/", response_model=PagedTicketResponseSchema)
async def get_tickets(
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(TicketORM.id))
    total_result = await db.execute(count_query)
    total_count = total_result.scalar_one()

    query = select(TicketORM).offset(offset).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "results": tickets
    }

@router.get("/filtered", response_model=PagedTicketResponseSchema)
async def get_sorted_tickets(
    limit: int = Query(24, ge=1, le=10_000),
    offset: int = Query(0, ge=0),

    status: str = Query(None),
    assignee_id: int = Query(None),
    department_id: int = Query(None),
    is_overdue: bool = Query(None),
    
    # НОВЫЕ ПАРАМЕТРЫ:
    deadline_from: date = Query(None, description="Начало диапазона срока исполнения"),
    deadline_to: date = Query(None, description="Конец диапазона срока исполнения"),

    sorted_by: str = Query("deadline"),
    sorted_order: str = Query("asc"),

    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(TicketORM.id))
    query = select(TicketORM)

    # 1. Существующие фильтры
    if status is not None:
        count_query = count_query.where(TicketORM.status == status)
        query = query.where(TicketORM.status == status)
    
    if assignee_id is not None:
        count_query = count_query.where(TicketORM.assignee_id == assignee_id)
        query = query.where(TicketORM.assignee_id == assignee_id)

    # 2. Фильтрация по датам (НОВАЯ ЛОГИКА)
    if deadline_from is not None:
        # Приводим date к datetime, если в БД поле timestamp
        count_query = count_query.where(TicketORM.deadline >= deadline_from)
        query = query.where(TicketORM.deadline >= deadline_from)
    
    if deadline_to is not None:
        # deadline_to считаем до конца дня
        count_query = count_query.where(TicketORM.deadline <= deadline_to)
        query = query.where(TicketORM.deadline <= deadline_to)

    # 3. Динамический JOIN для департамента
    if department_id is not None:
        count_query = count_query.join(EmployeeORM, TicketORM.author_id == EmployeeORM.id) \
                                 .where(EmployeeORM.department_id == department_id)
        query = query.join(EmployeeORM, TicketORM.author_id == EmployeeORM.id) \
                     .where(EmployeeORM.department_id == department_id)

    # 4. Фильтр просрочки
    if is_overdue is not None:
        now = datetime.now()
        if is_overdue:
            cond = (TicketORM.deadline < now) & (TicketORM.status != TicketStatusEnum.COMPLETED)
        else:
            cond = (TicketORM.deadline >= now) | (TicketORM.status == TicketStatusEnum.COMPLETED)
        count_query = count_query.where(cond)
        query = query.where(cond)

    # Исполнение запросов...
    total_result = await db.execute(count_query)
    total_count = total_result.scalar_one()

    sort_column = getattr(TicketORM, sorted_by, TicketORM.status)
    query = query.order_by(asc(sort_column) if sorted_order == "asc" else desc(sort_column))

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "results": result.scalars().all()
    }


@router.post("/", response_model=TicketResponseSingleSchema, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreateSchema,
    db: AsyncSession = Depends(get_db)
):
    
    
    # 1. Проверяем, существует ли автор заявки
    author_exists = await db.execute(
        select(EmployeeORM.id).where(EmployeeORM.id == ticket_data.author_id)
    )
    if not author_exists.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Автор с id {ticket_data.author_id} не найден."
        )

    # 2. Проверяем исполнителя (если он передан)
    if ticket_data.assignee_id is not None:
        assignee_exists = await db.execute(
            select(EmployeeORM.id).where(EmployeeORM.id == ticket_data.assignee_id)
        )
        if not assignee_exists.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Исполнитель с id {ticket_data.assignee_id} не найден."
            )

    # 3. Создаем объект модели SQLAlchemy
    # Использование **ticket_data.model_dump() автоматически развернет Pydantic-схему в параметры конструктора
    new_ticket = TicketORM(**ticket_data.model_dump())

    # 4. Добавляем в сессию и сохраняем в БД
    db.add(new_ticket)
    await db.commit()
    
    # 5. Свежие системные поля (id, created_at) подгрузятся из БД обратно в объект
    await db.refresh(new_ticket)

    return new_ticket












# В начало файла к остальным Pydantic-схемам добавь:
class TicketStatusUpdateSchema(BaseModel):
    status: TicketStatusEnum

class TicketAssigneeUpdateSchema(BaseModel):
    assignee_id: Optional[int] = None # None, если нужно снять исполнителя


# --- ДОБАВЛЯЕМ В КОНЕЦ ФАЙЛА РОУТЕРА ЗАЯВОК ---
@router.patch("/{ticket_id}/status", response_model=TicketResponseSingleSchema)
async def update_ticket_status(
    ticket_id: int,
    status_data: TicketStatusUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    # 1. Ищем существующую заявку
    result = await db.execute(select(TicketORM).where(TicketORM.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    current_status = ticket.status
    new_status = status_data.status

    # 2. Если статус не меняется, возвращаем как есть
    if current_status == new_status:
        return ticket

    # 3. Чистая матрица переходов без CANCELLED
    allowed_transitions = {
        TicketStatusEnum.NEW: [TicketStatusEnum.IN_PROGRESS],
        TicketStatusEnum.IN_PROGRESS: [TicketStatusEnum.COMPLETED],  # Теперь отсюда только в COMPLETED
        TicketStatusEnum.COMPLETED: []
    }

    if new_status not in allowed_transitions.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимый перевод статуса из {current_status.value} в {new_status.value}"
        )

    # 4. Обновляем и сохраняем
    ticket.status = new_status
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/assignee", response_model=TicketResponseSingleSchema)
async def update_ticket_assignee(
    ticket_id: int,
    assignee_data: TicketAssigneeUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    # 1. Ищем заявку
    result = await db.execute(select(TicketORM).where(TicketORM.id == ticket_id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    # 2. Если исполнителя передали, проверяем, что такой сотрудник реально существует
    if assignee_data.assignee_id is not None:
        emp_result = await db.execute(
            select(EmployeeORM.id).where(EmployeeORM.id == assignee_data.assignee_id)
        )
        if not emp_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Указанный исполнитель не найден")

    # 3. Меняем исполнителя
    ticket.assignee_id = assignee_data.assignee_id
    await db.commit()
    await db.refresh(ticket)
    return ticket