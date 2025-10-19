const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Выбираем базу данных в зависимости от окружения
let Database;
try {
    if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
        Database = require('./database/vercelKvDatabase');
    } else {
        Database = require('./database/simpleDatabase');
    }
} catch (error) {
    console.error('Ошибка загрузки базы данных:', error);
    // Fallback на простую базу данных
    Database = require('./database/simpleDatabase');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Простой тестовый endpoint
app.get('/api/test', (req, res) => {
    console.log('Test API endpoint called');
    res.json({ 
        status: 'ok', 
        message: 'API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        adminId: process.env.ADMIN_ID
    });
});

// Простой auth endpoint
app.post('/api/auth', (req, res) => {
    console.log('Auth endpoint called with:', req.body);
    
    const { telegramId } = req.body;
    
    if (!telegramId) {
        return res.json({ authorized: false });
    }
    
    // Проверяем, является ли пользователь админом
    const adminId = process.env.ADMIN_ID;
    console.log('Admin ID from env:', adminId);
    console.log('User ID:', telegramId);
    
    if (adminId && parseInt(adminId) === parseInt(telegramId)) {
        res.json({
            authorized: true,
            user: {
                id: 1,
                telegram_id: parseInt(telegramId),
                username: 'admin',
                role: 'admin'
            }
        });
    } else {
        res.json({ authorized: false });
    }
});

// API routes
try {
    const apiRoutes = require('./routes/api');
    app.use('/api', apiRoutes);
    console.log('API routes loaded successfully');
} catch (error) {
    console.error('Error loading API routes:', error);
    // Добавляем простой API endpoint для тестирования
    app.post('/api/auth', (req, res) => {
        console.log('Simple auth endpoint called');
        res.json({ authorized: false, error: 'API routes not loaded' });
    });
}

// Для Vercel нужно экспортировать app
module.exports = app;

// Локальный запуск
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Database: ${Database.name || 'Unknown'}`);
    });
}
