# 🐙 Настройка GitHub репозитория

Инструкция по созданию GitHub репозитория и настройке автоматического деплоя.

## 📋 Создание репозитория

### 1. Создайте репозиторий на GitHub

1. Перейдите на [github.com](https://github.com)
2. Нажмите "New repository"
3. Заполните данные:
   - **Repository name**: `sheets-finder`
   - **Description**: `Telegram Mini App for finding brands and suppliers in Google Sheets`
   - **Visibility**: Public (для бесплатного Vercel)
   - **Initialize**: НЕ ставьте галочки (у нас уже есть код)

### 2. Подключите локальный репозиторий

```bash
# Добавьте удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/sheets-finder.git

# Переименуйте ветку в main
git branch -M main

# Отправьте код на GitHub
git push -u origin main
```

## 🚀 Настройка Vercel

### 1. Подключение к GitHub

1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub аккаунт
3. Нажмите "New Project"
4. Выберите репозиторий `sheets-finder`
5. Нажмите "Import"

### 2. Настройка проекта

Vercel автоматически определит, что это Node.js приложение:

- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: (оставьте пустым)
- **Output Directory**: (оставьте пустым)
- **Install Command**: `npm install`

### 3. Переменные окружения

В настройках проекта добавьте:

```env
# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here

# Окружение
NODE_ENV=production
```

### 4. Vercel KV

1. В настройках проекта перейдите в "Storage"
2. Создайте новую KV базу данных
3. Vercel автоматически добавит переменные:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

## 🔄 Автоматический деплой

После настройки:

1. **Каждый push в main** → автоматический деплой
2. **Pull Request** → preview деплой
3. **Откат** → через Vercel Dashboard

## 📱 Настройка Telegram

После деплоя получите URL приложения:

1. Скопируйте URL из Vercel Dashboard (например: `https://sheets-finder.vercel.app`)
2. Создайте бота через [@BotFather](https://t.me/botfather)
3. Используйте команду `/newapp`
4. Укажите URL вашего Vercel приложения

## 👤 Создание первого администратора

После деплоя:

```bash
# Клонируйте репозиторий
git clone https://github.com/YOUR_USERNAME/sheets-finder.git
cd sheets-finder

# Установите зависимости
npm install

# Создайте .env с переменными из Vercel
cp env.example .env
# Добавьте KV переменные из Vercel Dashboard

# Создайте первого администратора
npm run init-admin-vercel
```

## 🔍 Мониторинг

- **GitHub**: Код, Issues, Pull Requests
- **Vercel**: Деплои, логи, метрики
- **Telegram**: Тестирование Mini App

## 🆘 Устранение неполадок

### Проблема: "Build failed"
- Проверьте, что все зависимости в `package.json`
- Убедитесь, что Node.js версия совместима

### Проблема: "Environment variables missing"
- Проверьте переменные в Vercel Dashboard
- Убедитесь, что KV база создана

### Проблема: "Telegram WebApp not loading"
- Проверьте URL в настройках бота
- Убедитесь, что домен добавлен в настройки бота
