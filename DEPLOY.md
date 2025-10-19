# 🚀 Деплой на Vercel

Инструкция по развертыванию Sheets Finder на Vercel с использованием Vercel KV.

## 📋 Подготовка

### 1. Создание GitHub репозитория

```bash
# Инициализация git
git init
git add .
git commit -m "Initial commit"

# Создание репозитория на GitHub (через веб-интерфейс)
# Затем подключение к удаленному репозиторию
git remote add origin https://github.com/YOUR_USERNAME/sheets-finder.git
git branch -M main
git push -u origin main
```

### 2. Настройка Vercel KV

1. Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Создайте новый проект из GitHub репозитория
3. В настройках проекта добавьте Vercel KV:
   - Перейдите в раздел "Storage"
   - Создайте новую KV базу данных
   - Скопируйте переменные окружения

### 3. Переменные окружения

В настройках проекта Vercel добавьте:

```env
# Vercel KV (автоматически добавляется при создании KV)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_readonly_token

# Администратор
ADMIN_ID=699759380

# Окружение
NODE_ENV=production
```

## 🔧 Настройка Google Apps Script

1. Перейдите на [script.google.com](https://script.google.com)
2. Создайте новый проект и скопируйте код из `google-apps-script/Code.gs`
3. Свяжите проект с вашей Google Sheets таблицей
4. Разверните как веб-приложение с доступом "Все"
5. Скопируйте URL веб-приложения

Подробная инструкция в [GOOGLE_APPS_SCRIPT_SETUP.md](GOOGLE_APPS_SCRIPT_SETUP.md)

## 👤 Создание первого администратора

После деплоя создайте первого администратора:

```bash
# Клонируйте репозиторий локально
git clone https://github.com/YOUR_USERNAME/sheets-finder.git
cd sheets-finder

# Установите зависимости
npm install

# Создайте .env файл с переменными из Vercel
cp env.example .env
# Добавьте переменные KV из Vercel Dashboard

# Создайте первого администратора
npm run init-admin-vercel
```

## 📱 Настройка Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Используйте команду `/newapp` для создания Mini App
3. Укажите URL вашего Vercel приложения: `https://your-app.vercel.app`
4. Настройте домен в настройках бота

## 🔄 Обновление приложения

```bash
# Внесите изменения в код
git add .
git commit -m "Update app"
git push origin main

# Vercel автоматически пересоберет и развернет приложение
```

## 🗄️ Управление данными

### Просмотр данных в Vercel KV

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Подключитесь к проекту
vercel link

# Просмотр данных KV
vercel kv ls
```

### Резервное копирование

```bash
# Экспорт всех данных
vercel kv export > backup.json

# Импорт данных
vercel kv import backup.json
```

## 🚨 Важные замечания

1. **Vercel KV** - это Redis-совместимая база данных
2. **Бесплатный тариф** включает 256MB хранилища
3. **Производительность** отличная для небольших приложений
4. **Автоматическое масштабирование** без дополнительной настройки

## 🔍 Мониторинг

- **Логи**: Vercel Dashboard → Functions → Logs
- **Метрики**: Vercel Dashboard → Analytics
- **Ошибки**: Vercel Dashboard → Functions → Errors

## 🆘 Устранение неполадок

### Проблема: "KV connection failed"
- Проверьте переменные окружения KV
- Убедитесь, что KV база создана в том же регионе

### Проблема: "Google Sheets API error"
- Проверьте API ключ Google Sheets
- Убедитесь, что API включен в Google Cloud Console

### Проблема: "Telegram WebApp not working"
- Проверьте URL в настройках бота
- Убедитесь, что домен добавлен в настройки бота
