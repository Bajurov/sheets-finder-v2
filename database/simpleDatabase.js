// Простая база данных в памяти для тестирования
class SimpleDatabase {
    constructor() {
        this.users = new Map();
        this.settings = {};
        this.init();
    }

    init() {
        // Добавляем администратора из переменной окружения
        const adminId = process.env.ADMIN_ID;
        if (adminId) {
            this.users.set(parseInt(adminId), {
                id: 1,
                telegram_id: parseInt(adminId),
                username: 'admin',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
                created_at: new Date().toISOString()
            });
            
            console.log(`Добавлен администратор с ID: ${adminId}`);
        } else {
            console.log('ADMIN_ID не установлен в переменных окружения');
        }
        
        console.log('Используется простая база данных в памяти');
    }

    // Пользователи
    async getUserByTelegramId(telegramId) {
        return this.users.get(telegramId) || null;
    }

    async getAllUsers() {
        return Array.from(this.users.values());
    }

    async addUser(userData) {
        const user = {
            id: Date.now(),
            telegram_id: userData.telegram_id,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role || 'user',
            created_at: new Date().toISOString()
        };
        
        this.users.set(userData.telegram_id, user);
        return user.id;
    }

    async updateUser(userId, userData) {
        // Находим пользователя по ID
        for (const user of this.users.values()) {
            if (user.id === userId) {
                if (userData.username !== undefined) user.username = userData.username;
                if (userData.first_name !== undefined) user.first_name = userData.first_name;
                if (userData.last_name !== undefined) user.last_name = userData.last_name;
                
                this.users.set(user.telegram_id, user);
                return 1;
            }
        }
        return 0;
    }

    async deleteUser(userId) {
        for (const [telegramId, user] of this.users.entries()) {
            if (user.id === userId) {
                this.users.delete(telegramId);
                return 1;
            }
        }
        return 0;
    }

    // Настройки
    async getSettings() {
        return this.settings;
    }

    async updateSettings(settingsData) {
        this.settings = {
            ...this.settings,
            ...settingsData,
            updated_at: new Date().toISOString()
        };
        return 1;
    }

    // Закрыть соединение (для совместимости)
    close() {
        // Не требуется для in-memory базы
    }
}

module.exports = SimpleDatabase;
