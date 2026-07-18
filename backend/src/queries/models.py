from typing import Annotated
from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Enum as SQLEnum, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
import enum

intpk = Annotated[int, mapped_column(primary_key=True)]

class TicketStatusEnum(str, enum.Enum):
    NEW = 'NEW'
    IN_PROGRESS = 'IN_PROGRESS'
    COMPLETED = 'COMPLETED'

class EmployeeORM(Base):
    __tablename__ = "employees"

    id: Mapped[intpk]
    fullname: Mapped[str] = mapped_column(String(255), nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

class DepartmentORM(Base):
    __tablename__ = "departments"
    
    id: Mapped[intpk]
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

class TicketORM(Base):
    __tablename__ = "tickets"
    
    id: Mapped[intpk]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id", ondelete='CASCADE'), index=True, nullable=False)
    assignee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), index=True, nullable=True)
    
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(TicketStatusEnum), nullable=False)

    __table_args__ = (
        Index('idx_tickets_status_assignee_deadline', 'status', 'assignee_id', 'deadline'),
        Index('idx_tickets_deadline', 'deadline'),
    )