# Sheets Finder - Telegram Mini App

Telegram Mini App для поиска брендов и поставщиков в Google Sheets с авторизацией по Telegram ID.

## Возможности

- 🔐 Авторизация по Telegram ID
- 👥 Управление пользователями (только для админов)
- 📊 Интеграция с Google Sheets
- 🔍 Поиск с автоподсказками
- 📄 Постраничная навигация результатов
- ⚙️ Настройка таблицы и столбцов

## Установка

### Локальная разработка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd sheets-finder
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе `env.example`:
```bash
cp env.example .env
```

4. Настройте переменные окружения в `.env`:
```
PORT=3000
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
DATABASE_PATH=./database.sqlite
```

### Деплой на Vercel

Для продакшн деплоя используйте Vercel с Vercel KV базой данных. Подробная инструкция в [DEPLOY.md](DEPLOY.md).

## Настройка Google Sheets API

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API
4. Создайте API ключ в разделе "Учетные данные"
5. Скопируйте API ключ в файл `.env`

## Настройка Google Sheets

1. Создайте Google Sheets таблицу
2. Установите доступ "Anyone with the link can view"
3. Скопируйте ссылку на таблицу
4. В админ-панели укажите ссылку и настройте столбцы

## Запуск

### Режим разработки:
```bash
npm run dev
```

### Продакшн:
```bash
npm start
```

Приложение будет доступно по адресу `http://localhost:3000`

## Структура проекта

```
sheets-finder/
├── public/                 # Статические файлы
│   ├── index.html         # Главная страница
│   ├── styles.css         # Стили
│   └── app.js             # Клиентский JavaScript
├── routes/                # API маршруты
│   └── api.js             # Основные API endpoints
├── database/              # Работа с базой данных
│   └── database.js        # SQLite база данных
├── services/              # Внешние сервисы
│   └── googleSheetsService.js  # Google Sheets API
├── index.js               # Главный файл сервера
├── package.json           # Зависимости
└── README.md              # Документация
```

## API Endpoints

### Авторизация
- `POST /api/auth` - Авторизация пользователя

### Пользователи (только для админов)
- `GET /api/users` - Получить всех пользователей
- `POST /api/users` - Добавить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

### Настройки
- `GET /api/settings` - Получить настройки
- `POST /api/settings` - Сохранить настройки

### Google Sheets
- `POST /api/test-connection` - Тест подключения к таблице
- `POST /api/search` - Поиск в таблице
- `GET /api/suggestions` - Получить подсказки для автодополнения

## Роли пользователей

### Admin
- Управление пользователями
- Настройка Google Sheets
- Доступ к поиску

### User
- Поиск брендов
- Просмотр результатов

## Настройка Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Используйте команду `/newapp` для создания Mini App
3. Укажите URL вашего приложения
4. Настройте домен в настройках бота

## Первоначальная настройка

1. Запустите приложение
2. Добавьте первого пользователя в базу данных как админа:
```sql
INSERT INTO users (telegram_id, username, role) VALUES (YOUR_TELEGRAM_ID, 'your_username', 'admin');
```

3. Войдите в приложение через Telegram
4. Настройте Google Sheets в админ-панели

## Требования к Google Sheets

- Таблица должна быть доступна по ссылке (режим "Anyone with the link can view")
- Первая строка может содержать заголовки
- Столбец поиска должен содержать названия брендов
- Столбцы результатов должны содержать информацию о поставщиках

## Лицензия

MIT License
