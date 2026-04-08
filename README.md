# Meeting-of-legal-entities
---

## 🔹 Основные возможности

- Генерация и сброс базы данных (`/api/resetdb`)  
- Управление слотами и бронированиями (`/api/book`, `/api/start`)  
- Создание встреч (`/api/meet`)  
- Автоматическое управление пользователями через cookie токен  

---

## 🗂️ Эндпоинты

### 1. **POST /api/resetdb**  
**Описание:** Сброс базы данных до дефолтного состояния (админский эндпоинт).  
**Теги:** Admin  

**Пример запроса:**
```bash
curl -X POST https://localhost:7179/api/resetdb

Ответ:

200 OK
2. POST /api/book

Описание: Бронирование встречи. Принимает ID сотрудника, время и причину. После успешного бронирования слот удаляется из timetable.
Теги: Book

Схема запроса:

{
  "staffId": 6,
  "appointmentTime": "2026-04-01T14:00:00",
  "reason": "TestBackend"
}

Пример запроса:

curl -X POST "https://localhost:7179/api/book" \
-H "Content-Type: application/json" \
-d '{"staffId":6,"appointmentTime":"2026-04-01T14:00:00","reason":"TestBackend"}'

Ответ:

200 OK
3. POST /api/meet

Описание: Создание встречи с определённым слотом (для внутренних нужд).
Теги: Meet

Схема запроса:

{
  "slot": "2026-04-01T14:00:00"
}

Пример запроса:

curl -X POST "https://localhost:7179/api/meet" \
-H "Content-Type: application/json" \
-d '{"slot":"2026-04-01T14:00:00"}'

Ответ:

200 OK
4. GET /api/start

Описание: Получение всех доступных таймслотов для бронирования и списка текущих встреч пользователя по cookie токену. Возвращаются только слоты и встречи, которые ещё не прошли.
Теги: Start

Пример запроса:

curl -X GET "https://localhost:7179/api/start" \
-H "accept: */*"

Ответ:

{
  "slots": [
    {
      "slot": "2026-04-01T10:00:00",
      "count": 3
    }
  ],
  "appointments": [
    {
      "staffImage": "/images/staff1.png",
      "staffName": "John Doe",
      "reason": "Consultation",
      "appointmentTime": "2026-04-01T10:00:00"
    }
  ]
}
📦 Схемы DTO
BookRequest
{
  "staffId": 6,
  "appointmentTime": "2026-04-01T14:00:00",
  "reason": "TestBackend"
}
MeetRequest
{
  "slot": "2026-04-01T14:00:00"
}
🛠️ Логика работы
Пользователю при первом визите генерируется cookie user_token.
/api/start возвращает доступные таймслоты и встречи пользователя, которые ещё не прошли.
/api/book создаёт запись о встрече и удаляет соответствующий слот из timetable.
BackgroundService PastAppointmentsCleanupService ежедневно очищает прошедшие встречи и устаревшие слоты из базы данных.
🔐 Безопасность
Cookie user_token используется для идентификации пользователя.
Только реальные встречи хранятся с StaffId != 0, placeholder записи не считаются встречами.
🧹 Поддержка базы
/api/resetdb – ручной сброс базы.
Автоматическая чистка прошлых встреч и устаревших слотов выполняется один раз в день.
🚀 Запуск
Настройте appsettings.json с подключением к MySQL/MariaDB.
Выполните миграцию базы данных.
Запустите проект:
dotnet run
Перейдите на Swagger UI для тестирования:
https://localhost:7179/swagger

Backend построен с использованием ASP.NET Core, Entity Framework Core, MySQL/MariaDB, с поддержкой cookie токенов и асинхронной работы с базой данных.