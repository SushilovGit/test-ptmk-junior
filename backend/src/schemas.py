from datetime import datetime
from typing import List, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, Field
from src.queries.models import TicketStatusEnum

T = TypeVar("T")

class PagedResponse(BaseModel, Generic[T]):
    total: int
    limit: int
    offset: int
    results: List[T]

# Сотрудники
class EmployeeSingleSchema(BaseModel):
    id: int
    fullname: str
    role: str
    department_id: int
    department_name: str
    model_config = ConfigDict(from_attributes=True)

# Заявки (наследование)
class TicketBase(BaseModel):
    author_id: int
    assignee_id: int | None = None
    description: str = Field(..., max_length=1000)
    deadline: datetime
    status: TicketStatusEnum = TicketStatusEnum.NEW

class TicketCreateSchema(TicketBase):
    pass

class TicketResponseSchema(TicketBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Обновления
class TicketStatusUpdateSchema(BaseModel):
    status: TicketStatusEnum

class TicketAssigneeUpdateSchema(BaseModel):
    assignee_id: int | None = None

# Статистика
class StatusCountSchema(BaseModel):
    status: str
    count: int

class AssigneeStatsSchema(BaseModel):
    assignee_id: int
    fullname: str
    count: int


class GeneralStatsResponseSchema(BaseModel):
    by_status: list[StatusCountSchema]
    overdue_count: int