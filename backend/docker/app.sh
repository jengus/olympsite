#!/bin/bash
while ! timeout 1 bash -c "</dev/tcp/$DB_HOST/$DB_PORT"; do
  echo "Ожидание доступности базы данных $DB_HOST:$DB_PORT..."
  sleep 1
done
alembic upgrade head
echo "Применение миграций..."
#cd /fastapi_app  # Переход в каталог с файлом alembic.ini
cd src 

gunicorn main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:8000

