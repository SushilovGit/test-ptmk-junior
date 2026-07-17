import asyncio
from src.database import async_engine
from src.models import Base  # Замени src.models на твой реальный путь к Base, если он отличается

async def init_models():
    async with async_engine.begin() as conn:
        # Удаляет старые таблицы и создаёт новые (если нужно начать с чистого листа)
        # await conn.run_sync(Base.metadata.drop_all) 
        
        # Создаёт таблицы, если их нет
        await conn.run_sync(Base.metadata.create_all)
    print("Таблицы успешно проверены/созданы!")

if __name__ == "__main__":
    asyncio.run(init_models())