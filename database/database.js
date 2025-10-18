const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || './database.sqlite';
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    init() {
        // Создаем таблицы если их нет
        this.db.serialize(() => {
            // Таблица пользователей
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telegram_id INTEGER UNIQUE NOT NULL,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица настроек
            this.db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY,
                    sheets_url TEXT,
                    search_column TEXT,
                    result_columns TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Вставляем дефолтные настройки если их нет
            this.db.run(`
                INSERT OR IGNORE INTO settings (id) VALUES (1)
            `);
        });
    }

    // Пользователи
    async getUserByTelegramId(telegramId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM users WHERE telegram_id = ?',
                [telegramId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM users ORDER BY created_at DESC',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async addUser(userData) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (telegram_id, username, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
                [userData.telegram_id, userData.username, userData.first_name, userData.last_name, userData.role],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateUser(userId, userData) {
        const fields = [];
        const values = [];

        if (userData.username !== undefined) {
            fields.push('username = ?');
            values.push(userData.username);
        }
        if (userData.first_name !== undefined) {
            fields.push('first_name = ?');
            values.push(userData.first_name);
        }
        if (userData.last_name !== undefined) {
            fields.push('last_name = ?');
            values.push(userData.last_name);
        }

        if (fields.length === 0) return;

        values.push(userId);

        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async deleteUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM users WHERE id = ?',
                [userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Настройки
    async getSettings() {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM settings WHERE id = 1',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || {});
                }
            );
        });
    }

    async updateSettings(settingsData) {
        const fields = [];
        const values = [];

        if (settingsData.sheets_url !== undefined) {
            fields.push('sheets_url = ?');
            values.push(settingsData.sheets_url);
        }
        if (settingsData.search_column !== undefined) {
            fields.push('search_column = ?');
            values.push(settingsData.search_column);
        }
        if (settingsData.result_columns !== undefined) {
            fields.push('result_columns = ?');
            values.push(settingsData.result_columns);
        }

        if (fields.length === 0) return;

        fields.push('updated_at = CURRENT_TIMESTAMP');

        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE settings SET ${fields.join(', ')} WHERE id = 1`,
                values,
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // Закрыть соединение
    close() {
        this.db.close();
    }
}

module.exports = Database;
