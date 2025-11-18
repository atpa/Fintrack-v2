# FinTrackr - Архитектурная документация

## Обзор проекта

FinTrackr - это персональный финансовый трекер, построенный на стеке Node.js (backend) и Vanilla JavaScript (frontend). Проект находится в стадии активного развития и модернизации.

## Текущая архитектура

### Backend (Node.js)

**Расположение:** `/backend`

**Ключевые компоненты:**

1. **server.js** (~2000 строк) - монолитный серверный файл
   - HTTP сервер на встроенном модуле Node.js
   - REST API endpoints
   - Маршрутизация
   - Middleware для CORS, аутентификации
   - Обработка статических файлов

2. **Маршруты** (`/backend/routes/`)
   - `accounts.js` - управление счетами
   - `analytics.js` - аналитика и статистика
   - `auth.js` - аутентификация (регистрация, вход)
   - `budgets.js` - бюджеты
   - `categories.js` - категории транзакций
   - `currency.js` - конвертация валют
   - `goals.js` - финансовые цели
   - `meta.js` - метаданные
   - `planned.js` - запланированные операции
   - `rules.js` - правила категоризации
   - `subscriptions.js` - подписки
   - `sync.js` - синхронизация с банками
   - `transactions.js` - транзакции
   - `twofa.js` - двухфакторная аутентификация

3. **Сервисы** (`/backend/services/`)
   - `authService.js` - JWT токены, хеширование паролей
   - `dataService.js` - работа с данными (SQLite)
   - `dataService.new.js` - новая версия сервиса данных
   - `currencyService.js` - получение курсов валют
   - `analyticsService.js` - аналитика данных
   - `mlAnalyticsService.js` - машинное обучение для анализа
   - `sessionService.js` - управление сессиями
   - `categorizationService.js` - автоматическая категоризация
   - `emailService.js` - отправка email

4. **База данных** (`/backend/database/`)
   - `schema.sql` - SQL схема для SQLite
   - `init.js` - инициализация БД
   - Используется SQLite через better-sqlite3

5. **Middleware** (`/backend/middleware/`)
   - Аутентификация JWT
   - Валидация
   - Обработка ошибок

6. **Конфигурация** (`/backend/config/`)
   - Константы приложения
   - Настройки окружения

### Frontend (Vanilla JavaScript)

**Расположение:** `/frontend` и `/public`

**Структура:**

1. **HTML страницы** (`/public/*.html`) - ~20 страниц
   - `index.html` / `landing.html` - главная страница
   - `login.html`, `register.html` - аутентификация
   - `dashboard.html` - дашборд
   - `accounts.html` - счета
   - `transactions.html` - транзакции
   - `budgets.html` - бюджеты
   - `categories.html` - категории
   - `goals.html` - цели
   - `planned.html`, `recurring.html` - регулярные операции
   - `subscriptions.html` - подписки
   - `rules.html` - правила
   - `settings.html` - настройки
   - `sync.html` - синхронизация
   - `converter.html` - конвертер валют
   - `forecast.html`, `education.html`, `premium.html` - дополнительные
   - И другие

2. **JavaScript модули** (`/frontend/modules/`)
   - Модульная структура для переиспользования кода
   - Компоненты UI
   - API клиенты

3. **Страничные скрипты** (`/frontend/pages/`)
   - `dashboard.js` - логика дашборда
   - `accounts.js` - управление счетами
   - `transactions.js` - операции с транзакциями
   - `budgets.js` - бюджеты
   - `categories.js` - категории
   - И другие страницы

4. **Стили** (`/public/styles/`, `/frontend/styles/`)
   - CSS файлы для каждой страницы
   - Общие стили
   - ~4000+ строк CSS

### База данных (SQLite)

**Основные таблицы:**

1. **users** - пользователи
   - id, name, email, password_hash, created_at

2. **accounts** - счета пользователя
   - id, user_id, name, currency, balance, created_at

3. **categories** - категории транзакций
   - id, user_id, name, created_at

4. **transactions** - транзакции
   - id, user_id, account_id, category_id, type, amount, currency, date, note, created_at

5. **budgets** - бюджеты
   - id, user_id, category_id, month, limit_amount, spent, type, percent, currency

6. **goals** - финансовые цели
   - id, user_id, title, target_amount, current_amount, deadline

7. **planned** - запланированные операции
   - id, user_id, account_id, category_id, amount, frequency, next_date

8. **subscriptions** - подписки
   - id, user_id, name, amount, frequency, next_payment

9. **rules** - правила автоматической категоризации
   - id, user_id, pattern, category_id

10. **sessions** - сессии пользователей
    - id, user_id, refresh_token, expires_at

## Текущие проблемы и технический долг

### Backend

1. **Монолитный server.js** (~2000 строк)
   - Весь код в одном файле
   - Сложность поддержки и тестирования
   - Дублирование логики

2. **Смешанная архитектура**
   - Часть логики в server.js
   - Часть вынесена в routes/services
   - Неконсистентность подходов

3. **Обработка ошибок**
   - Нет централизованного error handler
   - Разные форматы ответов об ошибках
   - Недостаточная валидация входных данных

4. **API**
   - Неконсистентные HTTP коды
   - Отсутствие документации некоторых endpoint'ов
   - Неполная реализация CRUD для некоторых ресурсов

5. **База данных**
   - Миграции не полностью внедрены
   - Отсутствие seed данных для демо
   - Некоторые индексы могут быть не оптимальны

### Frontend

1. **Структура**
   - HTML файлы в корне `/public`
   - JS модули в `/frontend`
   - Неясная организация

2. **Дублирование кода**
   - Повторяющаяся логика работы с API
   - Дублирование UI компонентов
   - Похожие паттерны в разных страницах

3. **ES модули**
   - Частичный переход на ES6 модули
   - Смешанный стиль кода

4. **UI/UX**
   - Неконсистентный дизайн между страницами
   - Недостаточно адаптивности для мобильных
   - Отсутствие единой дизайн-системы
   - Нет состояний загрузки/ошибок на некоторых страницах

5. **Производительность**
   - Нет ленивой загрузки
   - Не оптимизированы ассеты
   - Отсутствует минификация

### Инфраструктура

1. **Environment variables**
   - Есть `.env.example`, но не везде используется
   - Жестко закодированные значения в коде

2. **Сборка**
   - Нет процесса сборки/бандлинга
   - Файлы отдаются как есть
   - Нет минификации

3. **Деплой**
   - Нет четкой инструкции по деплою
   - Не описан процесс CI/CD

4. **PWA**
   - Нет manifest.json
   - Нет service worker
   - Не работает офлайн

5. **Тестирование**
   - Есть unit тесты (Jest) - 52 теста
   - Есть e2e тесты (Playwright)
   - Некоторые тесты падают (14 failed, 38 passed)
   - Недостаточное покрытие

## Технологический стек

### Backend
- Node.js 14+
- Express.js 5.1.0
- SQLite (better-sqlite3)
- bcryptjs - хеширование паролей
- jsonwebtoken - JWT аутентификация
- cookie-parser - работа с cookies
- morgan - логирование запросов

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5 (семантическая разметка)
- CSS3 (Grid, Flexbox, CSS переменные)
- Canvas API для графиков

### Инструменты разработки
- Jest - unit тестирование
- Playwright - e2e тестирование
- ESLint - линтинг
- npm - менеджер пакетов

## Метрики кода

- Backend: ~7640 строк JavaScript
- Frontend: ~4175 строк JavaScript
- CSS: ~4119 строк
- Всего страниц: ~20 HTML файлов
- Маршруты API: 14 файлов
- Сервисы: 9 файлов
- Тесты: 52 теста (38 проходят, 14 падают)

## Структура директорий

```
Fintrack-v2/
├── backend/
│   ├── __tests__/          # Unit тесты
│   ├── config/             # Конфигурация
│   ├── database/           # БД схема и инициализация
│   ├── middleware/         # Middleware
│   ├── routes/             # API маршруты
│   ├── services/           # Бизнес-логика
│   ├── utils/              # Утилиты
│   ├── app.js              # Express приложение
│   ├── server.js           # Монолитный сервер (legacy)
│   └── data.json           # JSON хранилище (для dev)
├── frontend/
│   ├── modules/            # Переиспользуемые модули
│   └── pages/              # Страничные скрипты
├── public/
│   ├── styles/             # CSS файлы
│   ├── images/             # Изображения
│   └── *.html              # HTML страницы
├── docs/                   # Документация
├── tests/                  # E2E тесты
├── package.json            # Зависимости проекта
├── jest.config.js          # Конфигурация Jest
├── playwright.config.js    # Конфигурация Playwright
└── vite.config.js          # Конфигурация Vite (не используется)
```

## Планы модернизации

См. `/docs/tasks.md` для полного списка задач по модернизации проекта.

Ключевые направления:
1. Рефакторинг backend - разделение server.js на модули
2. Унификация REST API и документация
3. Миграции БД и seed данные
4. Рефакторинг frontend - ES модули и компоненты
5. Модернизация UI/UX
6. PWA и производительность
7. Подготовка к production деплою
8. Полная документация
