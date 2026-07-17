from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field

from src.models import TicketStatusEnum




class EmployeeSchema(BaseModel):
    id: int
    fullname: str
    department_id: int
    role: str

    model_config = ConfigDict(from_attributes=True)



class DepartmentSchema(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)



class TicketCreateSchema(BaseModel):
    author_id: int
    description: str = Field(max_length=1000)
    deadline: datetime

class TicketUpdateStateSchema(BaseModel):
    assignee_id: int | None
    status: TicketStatusEnum | None

class TicketResponseSchema(BaseModel):
    id: int
    created_at: datetime
    author_id: int
    assignee_id: int | None
    description: str
    deadline: datetime
    status: TicketStatusEnum

    model_config = ConfigDict(from_attributes=True)


class PagedTicketResponseSchema(BaseModel):
    total: int
    limit: int
    offset: int
    results: List[TicketResponseSchema]