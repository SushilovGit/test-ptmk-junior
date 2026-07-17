import sys
import random
from pathlib import Path
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import insert, select, func

# Добавление пути для импорта
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path: sys.path.insert(0, backend_dir)

from src.database import async_engine, async_session, Base
from src.models import DepartmentORM, EmployeeORM, TicketORM, TicketStatusEnum

async def seed_database():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # 1. Департаменты
        for name in ["IT", "Sales", "Finance", "HR", "Support"]:
            res = await session.execute(select(DepartmentORM).filter_by(name=name))
            if not res.scalar():
                session.add(DepartmentORM(name=name))
        await session.commit()
        
        dept_ids = (await session.execute(select(DepartmentORM.id))).scalars().all()

        # 2. Сотрудники
        res_count = await session.execute(select(func.count(EmployeeORM.id)))
        if res_count.scalar() < 1000:
            emps = [EmployeeORM(fullname=f"Сотрудник {i}", department_id=random.choice(dept_ids), role="Staff") for i in range(1000)]
            session.add_all(emps)
            await session.commit()
        
        emp_ids = (await session.execute(select(EmployeeORM.id))).scalars().all()

        # 3. Заявки
        # 3. Заявки (Увеличиваем до 1,000,000)
        res_tickets = await session.execute(select(func.count(TicketORM.id)))
        current_count = res_tickets.scalar()
        
        if current_count < 1_000_000:
            weights = [random.randint(1, 10) for _ in emp_ids]
            statuses = list(TicketStatusEnum)
            now = datetime.utcnow()
            
            # Генерируем 100 партий по 10,000 заявок
            total_to_gen = 1_000_000 - current_count
            chunk_size = 10_000
            print(f"Начинаем генерацию {total_to_gen} заявок...")
            
            for chunk in range(total_to_gen // chunk_size):
                tickets_data = []
                for _ in range(chunk_size):
                    status = random.choice(statuses)
                    author = random.choices(emp_ids, weights=weights, k=1)[0]
                    assignee = random.choices(emp_ids, weights=weights, k=1)[0] if status != TicketStatusEnum.NEW else None
                    created = now - timedelta(days=random.randint(0, 60))
                    
                    # Используем словари для массовой вставки (быстрее, чем создание объектов ORM)
                    tickets_data.append({
                        "created_at": created,
                        "author_id": author,
                        "assignee_id": assignee,
                        "description": f"Задача #{random.randint(1000, 9999)}",
                        "deadline": created + timedelta(days=random.randint(-14, 14)),
                        "status": status.value # Если в модели Enum, лучше передавать значение
                    })
                
                # Массовая вставка через Core API (намного быстрее для больших объемов)
                await session.execute(insert(TicketORM), tickets_data)
                await session.commit()
                print(f"Партия {chunk + 1} из {total_to_gen // chunk_size} готова.")

if __name__ == "__main__":
    asyncio.run(seed_database())