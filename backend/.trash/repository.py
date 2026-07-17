from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import TicketORM, TicketStatusEnum
from domain import Ticket, TicketStatus

class TicketRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_domain(self, orm: TicketORM) -> Ticket:
        return Ticket(
            id=orm.id,
            created_at=orm.created_at,
            aughtor_id=orm.aughtor_id,
            assignee_id=orm.assignee_id,
            description=orm.description,
            deadline=orm.deadline,
            status=TicketStatus(orm.status.value)
        )

    async def get_by_id(self, ticket_id: int) -> Optional[Ticket]:
        result = await self.session.execute(select(TicketORM).where(TicketORM.id == ticket_id))
        orm = result.scalar_one_or_none()
        return self._to_domain(orm) if orm else None