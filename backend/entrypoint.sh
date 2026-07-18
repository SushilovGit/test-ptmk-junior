#!/bin/sh
set -e

# тут db падает, если не дождаться её
while ! nc -z db 5432; do
  sleep 0.5
done

echo "Подождите пока seed закончит свою работу. Это может занять минут... 10. Ну а что вы хотели, всё по чесноку, 1000000 записей"
python src/seed.py

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload