from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import select, func
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import EmployeeORM, TicketORM, TicketStatusEnum
from src.dependencies import get_db

router = APIRouter(prefix="/stats", tags=["Tickets Stats"])


class AssigneeStatsSchema(BaseModel):
    assignee_id: int
    fullname: str
    count: int


class AssigneesCompletedResponseSchema(BaseModel):
    total: int
    results: list[AssigneeStatsSchema]



class StatusCountSchema(BaseModel):
    status: str
    count: int

class GeneralStatsResponseSchema(BaseModel):
    by_status: list[StatusCountSchema]
    overdue_count: int

@router.get("/assignees", response_model=AssigneesCompletedResponseSchema)
async def get_tickets_assignees_status(
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(
            TicketORM.assignee_id,
            EmployeeORM.fullname,
            func.count(TicketORM.id)
        )
        .join(EmployeeORM, TicketORM.assignee_id == EmployeeORM.id)
        .where(TicketORM.status == TicketStatusEnum.COMPLETED)
        .group_by(TicketORM.assignee_id, EmployeeORM.fullname)
        .order_by(func.count(TicketORM.id).desc())
    )
    
    result = await db.execute(query)
    stats = result.mappings().all()
    
    return {
        "total": len(stats),
        "results": stats
    }

@router.get("/general", response_model=GeneralStatsResponseSchema)
async def get_tickets_general_stats(
    db: AsyncSession = Depends(get_db) 
):
    # 1. Запрос статистики по статусам
    query = (
        select(TicketORM.status, func.count(TicketORM.id))
        .group_by(TicketORM.status)
    )
    status_result = await db.execute(query)
    # Превращаем результат в список словарей (например: [{'status': 'NEW', 'count': 100}, ...])
    by_status = status_result.mappings().all()

    # 2. Запрос количества просроченных
    now = datetime.now()
    overdue_query = (
        select(func.count(TicketORM.id))
        .where(
            TicketORM.deadline < now,
            TicketORM.status != TicketStatusEnum.COMPLETED
        )
    )
    overdue_result = await db.execute(overdue_query)
    overdue_count = overdue_result.scalar_one()

    # 3. Возвращаем корректные переменные
    return {
        "by_status": by_status,  # Теперь здесь правильные данные по статусам!
        "overdue_count": overdue_count
    }


