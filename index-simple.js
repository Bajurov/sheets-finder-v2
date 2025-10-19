const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Простая база данных в памяти
const users = new Map();
const settings = {};

// Добавляем тестового админа
users.set(123456789, {
    id: 1,
    telegram_id: 123456789,
    username: 'admin',
    role: 'admin',
    created_at: new Date().toISOString()
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.post('/api/auth', (req, res) => {
    try {
        const { telegramId } = req.body;
        
        if (!telegramId) {
            return res.json({ authorized: false });
        }
        
        const user = users.get(telegramId);
        
        if (!user) {
            return res.json({ authorized: false });
        }
        
        res.json({ 
            authorized: true, 
            user: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ error: 'Ошибка авторизации' });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const usersList = Array.from(users.values());
        res.json(usersList);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

app.post('/api/users', (req, res) => {
    try {
        const { telegramId, username } = req.body;
        
        if (!telegramId) {
            return res.status(400).json({ error: 'Telegram ID обязателен' });
        }
        
        const user = {
            id: Date.now(),
            telegram_id: telegramId,
            username: username || null,
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        users.set(telegramId, user);
        res.json({ id: user.id });
    } catch (error) {
        console.error('Ошибка добавления пользователя:', error);
        res.status(500).json({ error: 'Ошибка добавления пользователя' });
    }
});

app.delete('/api/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        for (const [telegramId, user] of users.entries()) {
            if (user.id === userId) {
                users.delete(telegramId);
                return res.json({ success: true });
            }
        }
        
        res.status(404).json({ error: 'Пользователь не найден' });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

app.get('/api/settings', (req, res) => {
    try {
        res.json(settings);
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: 'Ошибка получения настроек' });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const { sheetsUrl, searchColumn, resultColumns } = req.body;
        
        Object.assign(settings, {
            sheets_url: sheetsUrl,
            search_column: searchColumn,
            result_columns: resultColumns,
            updated_at: new Date().toISOString()
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        res.status(500).json({ error: 'Ошибка сохранения настроек' });
    }
});

app.post('/api/test-connection', (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL обязателен' });
        }
        
        // Простая проверка URL
        if (url.includes('script.google.com')) {
            res.json({
                success: true,
                rows: 100,
                sheetName: 'Test Sheet',
                message: 'Подключение успешно'
            });
        } else {
            res.json({
                success: false,
                error: 'Неверный формат URL'
            });
        }
    } catch (error) {
        console.error('Ошибка тестирования подключения:', error);
        res.status(500).json({ error: 'Ошибка тестирования подключения' });
    }
});

app.post('/api/search', (req, res) => {
    try {
        const { query, page = 1 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Запрос обязателен' });
        }
        
        // Тестовые данные
        const testResults = [
            {
                brand: 'Nike',
                suppliers: ['Supplier A', 'Supplier B', 'Supplier C']
            },
            {
                brand: 'Adidas',
                suppliers: ['Supplier D', 'Supplier E']
            }
        ];
        
        const filteredResults = testResults.filter(result => 
            result.brand.toLowerCase().includes(query.toLowerCase())
        );
        
        res.json({
            results: filteredResults,
            page: 1,
            totalPages: 1,
            totalResults: filteredResults.length
        });
    } catch (error) {
        console.error('Ошибка поиска:', error);
        res.json({ error: 'connection' });
    }
});

app.get('/api/suggestions', (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }
        
        const suggestions = ['Nike', 'Adidas', 'Puma', 'Reebok'].filter(brand =>
            brand.toLowerCase().startsWith(q.toLowerCase())
        );
        
        res.json({ suggestions });
    } catch (error) {
        console.error('Ошибка получения подсказок:', error);
        res.json({ suggestions: [] });
    }
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
