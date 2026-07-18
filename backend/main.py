import uvicorn
import time
from fastapi import Request
from fastapi import FastAPI
from src.routers.employee_router import router as employee_router
from src.routers.tickets_router import router as tickets_router
from src.routers.tickets_stats_router import router as stats_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Ticket System",
    version="1.0.0"
)

# разрешения -а то тут инчае фронт не видет db d Docker
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    замеры времени запросов
    """
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    
    # Вывод времени в консоль сервера
    print(f"request: {request.url.path} - time: {process_time:.4f} sec")
    
    return response

app.include_router(tickets_router)
app.include_router(stats_router)
app.include_router(employee_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)