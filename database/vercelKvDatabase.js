let kv;
try {
    const { kv: kvClient } = require('@vercel/kv');
    kv = kvClient;
} catch (error) {
    console.error('Ошибка загрузки Vercel KV:', error);
    kv = null;
}

class VercelKvDatabase {
    constructor() {
        this.kv = kv;
        if (!this.kv) {
            console.warn('Vercel KV недоступен, используется fallback');
        }
        this.initDefaultAdmin();
    }

    // Инициализация администратора из переменной окружения
    async initDefaultAdmin() {
        if (!this.kv) return;
        
        const adminId = process.env.ADMIN_ID;
        if (!adminId) {
            console.log('ADMIN_ID не установлен в переменных окружения');
            return;
        }
        
        try {
            // Проверяем, есть ли уже админ
            const existingAdmin = await this.kv.get(this.getUserKey(adminId));
            if (!existingAdmin) {
                const admin = {
                    id: 1,
                    telegram_id: parseInt(adminId),
                    username: 'admin',
                    first_name: 'Admin',
                    last_name: 'User',
                    role: 'admin',
                    created_at: new Date().toISOString()
                };
                
                await this.kv.set(this.getUserKey(adminId), JSON.stringify(admin));
                
                // Добавляем в список пользователей
                const usersList = await this.kv.get(this.getUsersListKey()) || [];
                if (!usersList.includes(parseInt(adminId))) {
                    usersList.push(parseInt(adminId));
                    await this.kv.set(this.getUsersListKey(), usersList);
                }
                
                console.log(`Добавлен администратор с ID: ${adminId}`);
            }
        } catch (error) {
            console.error('Ошибка инициализации админа:', error);
        }
    }

    // Ключи для хранения данных
    getUserKey(telegramId) {
        return `user:${telegramId}`;
    }

    getUsersListKey() {
        return 'users:list';
    }

    getSettingsKey() {
        return 'settings';
    }

    // Пользователи
    async getUserByTelegramId(telegramId) {
        if (!this.kv) {
            console.warn('Vercel KV недоступен');
            return null;
        }
        try {
            const userData = await this.kv.get(this.getUserKey(telegramId));
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            return null;
        }
    }

    async getAllUsers() {
        try {
            const usersList = await this.kv.get(this.getUsersListKey());
            if (!usersList) return [];
            
            const users = [];
            for (const telegramId of usersList) {
                const userData = await this.kv.get(this.getUserKey(telegramId));
                if (userData) {
                    users.push(JSON.parse(userData));
                }
            }
            return users;
        } catch (error) {
            console.error('Ошибка получения списка пользователей:', error);
            return [];
        }
    }

    async addUser(userData) {
        try {
            const user = {
                id: Date.now(), // Простой ID на основе времени
                telegram_id: userData.telegram_id,
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                role: userData.role || 'user',
                created_at: new Date().toISOString()
            };

            // Сохраняем пользователя
            await this.kv.set(this.getUserKey(userData.telegram_id), JSON.stringify(user));
            
            // Добавляем в список пользователей
            const usersList = await this.kv.get(this.getUsersListKey()) || [];
            if (!usersList.includes(userData.telegram_id)) {
                usersList.push(userData.telegram_id);
                await this.kv.set(this.getUsersListKey(), usersList);
            }

            return user.id;
        } catch (error) {
            console.error('Ошибка добавления пользователя:', error);
            throw error;
        }
    }

    async updateUser(userId, userData) {
        try {
            // Находим пользователя по ID
            const users = await this.getAllUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }

            // Обновляем данные
            const updatedUser = { ...user };
            if (userData.username !== undefined) updatedUser.username = userData.username;
            if (userData.first_name !== undefined) updatedUser.first_name = userData.first_name;
            if (userData.last_name !== undefined) updatedUser.last_name = userData.last_name;

            // Сохраняем обновленного пользователя
            await this.kv.set(this.getUserKey(user.telegram_id), JSON.stringify(updatedUser));
            
            return 1; // Успешно обновлен
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            // Находим пользователя по ID
            const users = await this.getAllUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                throw new Error('Пользователь не найден');
            }

            // Удаляем пользователя
            await this.kv.del(this.getUserKey(user.telegram_id));
            
            // Удаляем из списка пользователей
            const usersList = await this.kv.get(this.getUsersListKey()) || [];
            const updatedList = usersList.filter(id => id !== user.telegram_id);
            await this.kv.set(this.getUsersListKey(), updatedList);
            
            return 1; // Успешно удален
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            throw error;
        }
    }

    // Настройки
    async getSettings() {
        try {
            const settings = await this.kv.get(this.getSettingsKey());
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Ошибка получения настроек:', error);
            return {};
        }
    }

    async updateSettings(settingsData) {
        try {
            const currentSettings = await this.getSettings();
            const updatedSettings = {
                ...currentSettings,
                ...settingsData,
                updated_at: new Date().toISOString()
            };
            
            await this.kv.set(this.getSettingsKey(), JSON.stringify(updatedSettings));
            return 1; // Успешно обновлено
        } catch (error) {
            console.error('Ошибка обновления настроек:', error);
            throw error;
        }
    }

    // Закрыть соединение (для совместимости с SQLite версией)
    close() {
        // Vercel KV не требует явного закрытия соединения
    }
}

module.exports = VercelKvDatabase;
