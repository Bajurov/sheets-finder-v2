const express = require('express');
const router = express.Router();
// Выбираем базу данных в зависимости от окружения
let Database;
try {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
        Database = require('../database/vercelKvDatabase');
    } else {
        Database = require('../database/simpleDatabase');
    }
} catch (error) {
    console.error('Ошибка загрузки базы данных:', error);
    Database = require('../database/simpleDatabase');
}
const GoogleAppsScriptService = require('../services/googleAppsScriptService');

const db = new Database();
const appsScriptService = new GoogleAppsScriptService();

// Авторизация пользователя
router.post('/auth', async (req, res) => {
    try {
        const { telegramId, username, firstName, lastName } = req.body;
        
        if (!telegramId) {
            return res.json({ authorized: false });
        }
        
        const user = await db.getUserByTelegramId(telegramId);
        
        if (!user) {
            return res.json({ authorized: false });
        }
        
        // Обновляем информацию о пользователе
        await db.updateUser(user.id, {
            username: username || user.username,
            first_name: firstName || user.first_name,
            last_name: lastName || user.last_name
        });
        
        res.json({ 
            authorized: true, 
            user: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: username || user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Ошибка авторизации' });
    }
});

// Получить всех пользователей (только для админов)
router.get('/users', async (req, res) => {
    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

// Добавить пользователя
router.post('/users', async (req, res) => {
    try {
        const { telegramId, username } = req.body;
        
        if (!telegramId) {
            return res.status(400).json({ error: 'Telegram ID обязателен' });
        }
        
        const existingUser = await db.getUserByTelegramId(telegramId);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }
        
        const userId = await db.addUser({
            telegram_id: telegramId,
            username: username || null,
            role: 'user'
        });
        
        res.json({ id: userId });
    } catch (error) {
        console.error('Ошибка добавления пользователя:', error);
        res.status(500).json({ error: 'Ошибка добавления пользователя' });
    }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        await db.deleteUser(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

// Получить настройки
router.get('/settings', async (req, res) => {
    try {
        const settings = await db.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: 'Ошибка получения настроек' });
    }
});

// Сохранить настройки
router.post('/settings', async (req, res) => {
    try {
        const { sheetsUrl, searchColumn, resultColumns } = req.body;
        
        await db.updateSettings({
            sheets_url: sheetsUrl,
            search_column: searchColumn,
            result_columns: resultColumns
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        res.status(500).json({ error: 'Ошибка сохранения настроек' });
    }
});

// Тест подключения к Google Apps Script
router.post('/test-connection', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL обязателен' });
        }
        
        const result = await appsScriptService.testConnection(url);
        
        if (result.success) {
            res.json({
                success: true,
                rows: result.rows,
                sheetName: result.sheetName,
                message: result.message
            });
        } else {
            res.json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Ошибка тестирования подключения:', error);
        res.status(500).json({ error: 'Ошибка тестирования подключения' });
    }
});

// Поиск через Google Apps Script
router.post('/search', async (req, res) => {
    try {
        const { query, page = 1 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Запрос обязателен' });
        }
        
        const settings = await db.getSettings();
        
        if (!settings.sheets_url) {
            return res.json({ error: 'connection' });
        }
        
        const results = await appsScriptService.search(settings.sheets_url, query, {
            searchColumn: settings.search_column,
            resultColumns: settings.result_columns,
            page: parseInt(page),
            limit: 10
        });
        
        if (results.error) {
            return res.json({ error: results.error });
        }
        
        res.json({
            results: results.data,
            page: results.page,
            totalPages: results.totalPages,
            totalResults: results.totalResults
        });
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.json({ error: 'connection' });
    }
});

// Получить подсказки для автодополнения
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }
        
        const settings = await db.getSettings();
        
        if (!settings.sheets_url) {
            return res.json({ suggestions: [] });
        }
        
        const suggestions = await appsScriptService.getSuggestions(settings.sheets_url, q, {
            searchColumn: settings.search_column
        });
        
        res.json({ suggestions });
    } catch (error) {
        console.error('Ошибка получения подсказок:', error);
        res.json({ suggestions: [] });
    }
});

module.exports = router;
