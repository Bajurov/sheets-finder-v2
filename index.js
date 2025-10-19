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
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.use('/api', require('./routes/api'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
