from backend.src.database import sync_engine, async_engine
from sqlalchemy import text

async def test_async_connection():
    async with async_engine.connect() as connection:
        res = await connection.execute(text("SELECT VERSION()"))
        print(f"{res.all()}")


def create_tables():
    pass