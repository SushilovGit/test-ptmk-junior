from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession

# Импортируем твои модели. Убедись, что модель DepartmentORM импортирована правильно
from src.models import EmployeeORM, DepartmentORM 
from src.dependencies import get_db


class EmployeeSingleSchema(BaseModel):
    id: int
    fullname: str
    role: str  # Твоя роль из модели EmployeeORM
    department_id: int
    department_name: str  # Название департамента, которое мы зажоиним

    class Config:
        from_attributes = True


class EmployeeResponseSchema(BaseModel):
    total: int
    limit: int
    offset: int
    results: list[EmployeeSingleSchema]


router = APIRouter(prefix="/employee", tags=["Employee"])



@router.get("/", response_model=EmployeeResponseSchema)
async def get_employee(
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    # Добавляем возможность сортировки по названию департамента или роли
    sorted_by: str = Query("id", enum=["id", "fullname", "role", "department_name"]),
    sorted_order: str = Query("asc", enum=["asc", "desc"]),
    db: AsyncSession = Depends(get_db),
):
    # 1. Считаем общее количество сотрудников
    count_query = select(func.count(EmployeeORM.id))
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()

    # 2. Строим запрос с JOIN, выбирая нужные поля
    query = (
        select(
            EmployeeORM.id,
            EmployeeORM.fullname,
            EmployeeORM.role,
            EmployeeORM.department_id,
            DepartmentORM.name.label("department_name") # Забираем имя департамента
        )
        .join(DepartmentORM, EmployeeORM.department_id == DepartmentORM.id)
    )

    # 3. Динамическая сортировка
    # Если сортируем по департаменту, используем колонку из DepartmentORM, иначе из EmployeeORM
    if sorted_by == "department_name":
        sort_column = DepartmentORM.name
    else:
        sort_column = getattr(EmployeeORM, sorted_by, EmployeeORM.id)

    if sorted_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # 4. Пагинация
    query = query.limit(limit).offset(offset)

    # 5. Выполняем запрос
    result = await db.execute(query)
    
    # Снова используем .mappings(), чтобы Pydantic без проблем 
    # сопоставил "department_name" со схемой без ручного маппинга row
    employees = result.mappings().all()

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "results": employees
    }