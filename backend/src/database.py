from datetime import datetime
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy import create_engine, text, Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import DeclarativeBase, declarative_base, sessionmaker
from src.config import settings

class Base(DeclarativeBase):
    pass

# sync_engine = create_engine(url=settings.database_url_sync, pool_size=5, max_overflow=10)
async_engine = create_async_engine(url=settings.database_url_async, pool_size=5, max_overflow=10)

# sync_session = sessionmaker(sync_engine)
async_session = async_sessionmaker(async_engine)