from src.database import sync_engine, async_engine
from src.models import EmployeeORM, DepartmentORM, TicketORM
from src.database import Base

def create_tables():
    sync_engine.echo = False
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)
    sync_engine.echo = True

