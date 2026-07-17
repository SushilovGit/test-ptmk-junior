# from fastapi import FastAPI

# from src.queries.orm import create_tables




# def main():
#     create_tables()


# if __name__ == "__main__":
#     main()


    

import uvicorn
from fastapi import FastAPI
from src.routers.employee_router import router as employee_router
from src.routers.tickets_router import router as tickets_router
from src.routers.tickets_stats_router import router as stats_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Ticket System",
    version="1.0.0"
)


origins = [
    "http://localhost:5173",  # Локальный хост фронтенда на Vite
    "http://127.0.0.1:5173",
]

# 3. Подключаем CORS middleware к приложению
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Разрешаем запросы с этих адресов
    allow_credentials=True,
    allow_methods=["*"],              # Разрешаем любые методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],              # Разрешаем любые заголовки
)

# app.include_router(tickets_router)

# Подключаем роутеры
app.include_router(tickets_router)
app.include_router(stats_router)
app.include_router(employee_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Система контроля заявок запущена"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)