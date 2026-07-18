from datetime import datetime

from sqlalchemy import select, func
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.queries.models import EmployeeORM, TicketORM, TicketStatusEnum
from src.queries.dependencies import get_db

router = APIRouter(prefix="/stats", tags=["Tickets Stats"])


from src.schemas import PagedResponse, AssigneeStatsSchema, GeneralStatsResponseSchema

@router.get("/assignees", response_model=PagedResponse[AssigneeStatsSchema])
async def get_tickets_assignees_status(
    limit: int = Query(5, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    # Общее кол-во уникальных исполнителей
    count_query = select(func.count(func.distinct(TicketORM.assignee_id)))\
        .where(TicketORM.status == TicketStatusEnum.COMPLETED)
    total_count = (await db.execute(count_query)).scalar_one()

    # Запрос данных
    query = (
        select(
            TicketORM.assignee_id,
            EmployeeORM.fullname,
            func.count(TicketORM.id).label("count")
        )
        .join(EmployeeORM, TicketORM.assignee_id == EmployeeORM.id)
        .where(TicketORM.status == TicketStatusEnum.COMPLETED)
        .group_by(TicketORM.assignee_id, EmployeeORM.fullname)
        .limit(limit)
        .offset(offset)
    )
    
    result = await db.execute(query)
    stats = result.mappings().all()
    
    return PagedResponse(
        total=total_count,
        limit=limit,
        offset=offset,
        results=stats
    )

@router.get("/general", response_model=GeneralStatsResponseSchema)
async def get_tickets_general_stats(db: AsyncSession = Depends(get_db)):
    # Статистика по статусам
    query = select(TicketORM.status.label("status"), func.count(TicketORM.id).label("count")).group_by(TicketORM.status)
    by_status = (await db.execute(query)).mappings().all()

    # Просроченные
    overdue_count = (await db.execute(
        select(func.count(TicketORM.id))
        .where(TicketORM.deadline < datetime.now(), TicketORM.status != TicketStatusEnum.COMPLETED)
    )).scalar_one()

    return GeneralStatsResponseSchema(
        by_status=by_status,
        overdue_count=overdue_count
    )