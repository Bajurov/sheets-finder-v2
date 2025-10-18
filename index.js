const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Выбираем базу данных в зависимости от окружения
const Database = process.env.NODE_ENV === 'production' 
    ? require('./database/vercelKvDatabase')
    : require('./database/database');

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
