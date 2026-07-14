from datatime import datetime
from enum import Enum
from typing import Optional

class TicketStatus(Enum):
    NEW = 'NEW'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'


class Department:
    def __init__(self, id: int, name: str):
        self.id = id
        self.name = name

class Employee:
    def __init__(self, id: int, name: str, department_id: int, role: str):
        self.id = id
        self.fullname = name
        self.department_id = department_id
        self.role = role

class Ticket:
    def __init__(self, id: int, created_at: datetime,
                 aughtor_id: int, assignee_id: Optional[int],
                 description: str, deadline: datetime, status: TicketStatus.NEW):
        self.id = id
        self.created_at = created_at
        self.aughtor_id = aughtor_id
        self.assignee_id = assignee_id
        self.description = description
        self.deadline = deadline
        self.status = status


