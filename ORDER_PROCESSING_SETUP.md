# Order Processing System Setup Guide

## Архитектура

Система обработки заказов построена на основе Bull + Redis с масштабируемыми worker процессами.

### Компоненты:

1. **Redis** - Хранилище очередей Bull
2. **Orders Service** - gRPC сервис + Bull Producer (отправляет заказы в очередь)
3. **Order Processing Workers** - N воркеров, обрабатывающих заказы из одной общей очереди
4. **PostgreSQL** - База данных для хранения заказов и пользователей Росреестра

### Механизм работы:

```
User → API Gateway → Orders Service → Bull Queue (order-processing)
                                            ↓
                        Worker 1 ← ← ← ← ← ← ← ← → Worker 2
                           ↓                           ↓
                    ROSREESTR_USER_NAME=user1    ROSREESTR_USER_NAME=user2
                           ↓                           ↓
                    Росреестр API            Росреестр API
```

- Все воркеры подключены к одной очереди `order-processing`
- Bull автоматически распределяет задачи между доступными workers
- Каждый worker обрабатывает по **1 заказу одновременно** (concurrency: 1)
- При взятии заказа worker находит пользователя Росреестра по `ROSREESTR_USER_NAME` и устанавливает `order.rosreestr_user_id`

## Установка и настройка

### 1. Запустить миграцию БД

```bash
npm run migration:run
```

Это создаст:
- Таблицу `rosreestr_users` для хранения credentials
- Поле `rosreestr_user_id` в таблице `orders`

### 2. Добавить пользователей Росреестра в БД

```sql
INSERT INTO rosreestr_users (username, password_encrypted, is_active, comment)
VALUES
  ('rosreestr_user_1', 'encrypted_password_1', true, 'Первый аккаунт Росреестра'),
  ('rosreestr_user_2', 'encrypted_password_2', true, 'Второй аккаунт Росреестра'),
  ('rosreestr_user_3', 'encrypted_password_3', true, 'Третий аккаунт Росреестра');
```

**Важно**: Пароли должны быть зашифрованы с помощью `CryptoService.encrypt()`.

### 3. Запуск с Docker Compose

#### Development режим (локально):

```bash
# Запустить только Redis и PostgreSQL
docker-compose up -d postgres redis

# Запустить миграции
npm run migration:run

# Запустить сервисы локально
npm run dev
```

#### Production режим (все в Docker):

```bash
# Билд и запуск всех сервисов
docker-compose up -d --build

# Проверить логи
docker-compose logs -f order-worker-1
docker-compose logs -f order-worker-2
docker-compose logs -f order-worker-3

# Остановить
docker-compose down
```

### 4. Масштабирование воркеров

Чтобы добавить еще один worker:

**Вариант A: Docker Compose**

Добавить в `docker-compose.yml`:

```yaml
order-worker-4:
  build:
    context: .
    dockerfile: apps/order-processing-worker/Dockerfile
  container_name: rosreestr-order-worker-4
  environment:
    ROSREESTR_USER_NAME: rosreestr_user_4  # Username пользователя Росреестра
    # ... остальные переменные
```

**Вариант B: Вручную через Docker**

```bash
docker run -d \
  --name order-worker-4 \
  --network rosreestr-network \
  -e ROSREESTR_USER_NAME=rosreestr_user_4 \
  -e DB_HOST=postgres \
  -e REDIS_HOST=redis \
  order-processing-worker:latest
```

**Вариант C: Локально (для разработки)**

```bash
# Terminal 1
ROSREESTR_USER_NAME=rosreestr_user_1 nx serve order-processing-worker

# Terminal 2
ROSREESTR_USER_NAME=rosreestr_user_2 nx serve order-processing-worker

# Terminal 3
ROSREESTR_USER_NAME=rosreestr_user_3 nx serve order-processing-worker
```

## Переменные окружения

### Order Processing Worker

```env
# Обязательные
ROSREESTR_USER_NAME=rosreestr_user_1  # Username пользователя Росреестра для этого worker

# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=rosreestr_extracts

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Crypto
BCRYPT_SALT_ROUNDS=10
ROSREESTR_CRYPTO_SECRET=your-secret-key-for-encrypting-rosreestr-passwords

# Orders Service URL (для gRPC)
ORDERS_SERVICE_HOST=localhost
ORDERS_SERVICE_PORT=5003
```

### Orders Service

```env
# Добавить Redis конфигурацию
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Мониторинг

### Проверка статуса очереди

Установить Bull Board (опционально):

```bash
npm install @bull-board/api @bull-board/express
```

Или через Redis CLI:

```bash
# Подключиться к Redis
docker exec -it rosreestr-redis redis-cli

# Проверить очередь
KEYS bull:order-processing:*

# Посмотреть задачи
LRANGE bull:order-processing:wait 0 -1
LRANGE bull:order-processing:active 0 -1
LRANGE bull:order-processing:completed 0 -1
LRANGE bull:order-processing:failed 0 -1
```

### Логи воркеров

```bash
# Docker
docker-compose logs -f order-worker-1

# Локально - логи выводятся в консоль
```

## Обработка ошибок

### Retry механизм

Worker автоматически повторяет failed задачи:
- **Попытки**: 3
- **Backoff**: экспоненциальный, начиная с 2 секунд
- **Конфигурация**: `libs/queue/src/lib/queue.constants.ts`

### Просмотр failed jobs

```sql
-- Using OrderStatus enum from @rosreestr-extracts/constants
SELECT o.id, o.cad_num, o.status, o.comment, o.rosreestr_user_id
FROM orders o
WHERE o.status LIKE 'Ошибка:%'  -- OrderStatus.ERROR_PREFIX
ORDER BY o.updated_at DESC;
```

## API для управления Rosreestr Users

### TODO: Добавить endpoints

```typescript
// В orders-service или users-service
POST   /rosreestr-users        - Создать нового пользователя Росреестра
GET    /rosreestr-users        - Список пользователей
GET    /rosreestr-users/:id    - Получить пользователя
PUT    /rosreestr-users/:id    - Обновить credentials
DELETE /rosreestr-users/:id    - Деактивировать
POST   /rosreestr-users/:id/activate - Активировать
```

## Архитектурные решения

### Почему одна общая очередь?

✅ **Преимущества**:
- Автоматическая балансировка нагрузки от Bull
- Любой свободный worker берет задачу
- Простое масштабирование (просто добавить worker)
- Эффективное использование ресурсов

❌ **Альтернатива** (отдельная очередь на пользователя):
- Сложнее масштабирование
- Неравномерная загрузка workers
- Больше очередей = больше памяти Redis

### Почему concurrency: 1?

- Ограничения API Росреестра (rate limiting)
- Предсказуемость обработки
- Простота отладки

### Безопасность credentials

Пароли Росреестра хранятся в БД в зашифрованном виде:
- Шифрование: `CryptoService` (bcrypt)
- Расшифровка только в worker перед вызовом API
- Credentials никогда не логируются

## Troubleshooting

### Worker не обрабатывает заказы

1. Проверить подключение к Redis:
   ```bash
   docker exec -it rosreestr-redis redis-cli ping
   ```

2. Проверить очередь:
   ```bash
   docker exec -it rosreestr-redis redis-cli
   > LLEN bull:order-processing:wait
   ```

3. Проверить логи worker:
   ```bash
   docker-compose logs -f order-worker-1
   ```

### Orders Service не добавляет в очередь

Проверить логи:
```bash
docker-compose logs -f orders-service
```

Убедиться что Redis доступен и QueueModule подключен.

### Rosreestr user не найден

```sql
-- Проверить наличие пользователя
SELECT * FROM rosreestr_users WHERE id = 1;

-- Убедиться что is_active = true
UPDATE rosreestr_users SET is_active = true WHERE id = 1;
```

## Следующие шаги

1. **Реализовать интеграцию с Росреестр API** в `OrderProcessor.processWithRosreestrApi()`
2. **Добавить API endpoints** для управления rosreestr_users
3. **Настроить Bull Board** для визуального мониторинга очередей
4. **Добавить метрики** (Prometheus/Grafana) для мониторинга производительности
5. **Настроить алерты** при большом количестве failed jobs
