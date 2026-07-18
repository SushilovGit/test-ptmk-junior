import sys
import random
from pathlib import Path
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import insert, select, func
import time

backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)

from src.database import async_engine, async_session, Base
from src.queries.models import DepartmentORM, EmployeeORM, TicketORM, TicketStatusEnum

async def seed_database():
    start_time = time.perf_counter()
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for name in ["IT", "Продавцы", "Финансисты", "HR", "Поддержка"]:
            res = await session.execute(select(DepartmentORM).filter_by(name=name))
            if not res.scalar():
                session.add(DepartmentORM(name=name))
        await session.commit()
        
        dept_ids = (await session.execute(select(DepartmentORM.id))).scalars().all()

        res_count = await session.execute(select(func.count(EmployeeORM.id)))
        if res_count.scalar() < 1_000:
            emps = [EmployeeORM(fullname=f"Имя Фамилия {i}", department_id=random.choice(dept_ids), role="worker") for i in range(1000)]
            session.add_all(emps)
            await session.commit()
        
        emp_ids = (await session.execute(select(EmployeeORM.id))).scalars().all()

        res_tickets = await session.execute(select(func.count(TicketORM.id)))
        current_count = res_tickets.scalar()
        
        if current_count < 1_000_000:
            weights = [random.randint(1, 10) for _ in emp_ids]
            statuses = list(TicketStatusEnum)
            now = datetime.utcnow()
            
            total_to_gen = 1_000_000 - current_count
            chunk_size = 5_000
            print(f"генерацию")
            
            for chunk in range(total_to_gen // chunk_size):
                tickets_data = []
                for _ in range(chunk_size):
                    status = random.choice(statuses)
                    author = random.choices(emp_ids, weights=weights, k=1)[0]
                    assignee = random.choices(emp_ids, weights=weights, k=1)[0] if status != TicketStatusEnum.NEW else None
                    created = now - timedelta(days=random.randint(0, 60))
                    
                    tickets_data.append({
                        "created_at": created,
                        "author_id": author,
                        "assignee_id": assignee,
                        "description": f"Задача #{random.randint(1000, 9999)}",
                        "deadline": created + timedelta(days=random.randint(-14, 14)),
                        "status": status.value
                    })
                
                await session.execute(insert(TicketORM), tickets_data)
                await session.commit()
                print(f"Чанк {chunk + 1} из {total_to_gen // chunk_size}")
            
        end_time = time.perf_counter()
        execution_time = end_time - start_time

        minutes = int(execution_time // 60)
        seconds = int(execution_time % 60)

        print(f"Время: {minutes} мин {seconds} сек")

if __name__ == "__main__":
    asyncio.run(seed_database())