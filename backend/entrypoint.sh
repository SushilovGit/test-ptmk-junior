#!/bin/sh
set -e

echo "Ожидание запуска базы данных..."
while ! nc -z db 5432; do
  sleep 0.5
done
echo "База данных доступна!"

# Запускаем сид, который сам создаст таблицы и зальет данные
echo "Запуск инициализации и наполнения базы данных (seed)..."
python src/seed.py

echo "Запуск FastAPI сервера..."
exec uvicorn main:app --host 0.0.0.0 --port 8000