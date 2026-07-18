from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.queries.models import EmployeeORM, DepartmentORM 
from src.queries.dependencies import get_db
from src.schemas import EmployeeSingleSchema, PagedResponse

router = APIRouter(prefix="/employee", tags=["Employee"])

@router.get("/", response_model=PagedResponse[EmployeeSingleSchema])
async def get_employee(
    limit: int = Query(24, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sorted_by: str = Query("id", enum=["id", "fullname", "role", "department_name"]),
    sorted_order: str = Query("asc", enum=["asc", "desc"]),
    db: AsyncSession = Depends(get_db),
):
    """запрос на исполнителей"""
    count_query = select(func.count(EmployeeORM.id))
    count_result = await db.execute(count_query)
    total_count = count_result.scalar_one()

    query = (
        select(
            EmployeeORM.id,
            EmployeeORM.fullname,
            EmployeeORM.role,
            EmployeeORM.department_id,
            DepartmentORM.name.label("department_name")
        )
        .join(DepartmentORM, EmployeeORM.department_id == DepartmentORM.id)
    )

    if sorted_by == "department_name":
        sort_column = DepartmentORM.name
    else:
        sort_column = getattr(EmployeeORM, sorted_by, EmployeeORM.id)

    query = query.order_by(desc(sort_column)
                           if sorted_order == "desc"
                           else asc(sort_column))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    employees = result.mappings().all()

    return PagedResponse(
        total=total_count,
        limit=limit,
        offset=offset,
        results=employees
    )