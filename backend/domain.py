from datatime import datetime
from enum import Enum
from typing import Optional

class TicketStatus(Enum):
    NEW = 'NEW'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'


class Department:
    def __init__(self, id: int, name: str) -> None:
        self.id = id
        self.name = name

class Employee:
    def __init__(self, id: int, name: str, department_id: int, role: str) -> None:
        self.id = id
        self.fullname = name
        self.department_id = department_id
        self.role = role

class Ticket:

    _TRANSITIONS = {
        TicketStatus.NEW: [TicketStatus.IN_PROGRESS],
        TicketStatus.IN_PROGRESS: [TicketStatus.COMPLETED],
        TicketStatus.COMPLETED: []
    }

    def __init__(self, id: int, created_at: datetime,
                 aughtor_id: int, assignee_id: Optional[int],
                 description: str, deadline: datetime, status: TicketStatus.NEW) -> None:
        self.id = id
        self.created_at = created_at
        self.aughtor_id = aughtor_id
        self.assignee_id = assignee_id
        self.description = description
        self.deadline = deadline
        self._status = status

    @property
    def status(self) -> TicketStatus:
        return self._status
    
    def change_status(self, new_status: TicketStatus) -> None:
        self._status = new_status

        if self._status == new_status:
            return
        
        allowed = self._TRANSITIONS.get(self._status, [])
        if new_status not in allowed:
            raise ValueError(f"Invalid status transition from {self._status} to {new_status}")
        
        if new_status == TicketStatus.IN_PROGRESS and self.assignee_id is None:
            raise ValueError("Cannot change status to IN_PROGRESS without an assignee")
        
        self._status = new_status
        
    def change_assignee(self, new_ssignee_id: int) -> None:
        self.assignee_id = new_ssignee_id

    def is_overdue(self) -> bool:
        return datetime.now() > self.deadline and self._status != TicketStatus.COMPLETED

    

