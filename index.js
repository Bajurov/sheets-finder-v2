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

// Хардкод админа
const ADMIN_ID = 699759380;
users.set(ADMIN_ID, {
    id: 1,
    telegram_id: ADMIN_ID,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: new Date().toISOString()
});

console.log(`Администратор добавлен с ID: ${ADMIN_ID}`);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.post('/api/auth', (req, res) => {
    console.log('Auth request:', req.body);
    
    const { telegramId } = req.body;
    
    if (!telegramId) {
        return res.json({ authorized: false });
    }
    
    const user = users.get(parseInt(telegramId));
    console.log('Found user:', user);
    
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
});

app.get('/api/users', (req, res) => {
    const usersList = Array.from(users.values());
    res.json(usersList);
});

app.post('/api/users', (req, res) => {
    const { telegramId, username } = req.body;
    
    if (!telegramId) {
        return res.status(400).json({ error: 'Telegram ID обязателен' });
    }
    
    const user = {
        id: Date.now(),
        telegram_id: parseInt(telegramId),
        username: username || null,
        role: 'user',
        created_at: new Date().toISOString()
    };
    
    users.set(parseInt(telegramId), user);
    res.json({ id: user.id });
});

app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    
    for (const [telegramId, user] of users.entries()) {
        if (user.id === userId) {
            users.delete(telegramId);
            return res.json({ success: true });
        }
    }
    
    res.status(404).json({ error: 'Пользователь не найден' });
});

app.get('/api/settings', (req, res) => {
    res.json(settings);
});

app.post('/api/settings', (req, res) => {
    const { sheetsUrl, searchColumn, resultColumns } = req.body;
    
    Object.assign(settings, {
        sheets_url: sheetsUrl,
        search_column: searchColumn,
        result_columns: resultColumns,
        updated_at: new Date().toISOString()
    });
    
    res.json({ success: true });
});

app.post('/api/test-connection', (req, res) => {
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
});

app.post('/api/search', (req, res) => {
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
});

app.get('/api/suggestions', (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
        return res.json({ suggestions: [] });
    }
    
    const suggestions = ['Nike', 'Adidas', 'Puma', 'Reebok'].filter(brand =>
        brand.toLowerCase().startsWith(q.toLowerCase())
    );
    
    res.json({ suggestions });
});

// Для Vercel
module.exports = app;

// Локальный запуск
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Admin ID: ${ADMIN_ID}`);
    });
}