from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
# from sqlalchemy import create_engine, text, Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import DeclarativeBase
from src.config import settings

class Base(DeclarativeBase):
    pass

async_engine = create_async_engine(url=settings.database_url_async, pool_size=5, max_overflow=10)

async_session = async_sessionmaker(async_engine)