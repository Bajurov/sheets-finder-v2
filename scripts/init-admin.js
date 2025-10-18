const Database = require('../database/database');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function initAdmin() {
    console.log('🔧 Инициализация первого администратора');
    console.log('=====================================\n');

    try {
        const db = new Database();
        
        // Проверяем, есть ли уже админы
        const users = await db.getAllUsers();
        const admins = users.filter(user => user.role === 'admin');
        
        if (admins.length > 0) {
            console.log('⚠️  Администраторы уже существуют:');
            admins.forEach(admin => {
                console.log(`   - ${admin.username || 'Без имени'} (ID: ${admin.telegram_id})`);
            });
            
            const continueSetup = await askQuestion('\nПродолжить добавление нового администратора? (y/n): ');
            if (continueSetup.toLowerCase() !== 'y') {
                console.log('Отменено.');
                process.exit(0);
            }
        }

        // Получаем данные нового админа
        const telegramId = await askQuestion('Введите Telegram ID администратора: ');
        const username = await askQuestion('Введите username (необязательно): ');
        const firstName = await askQuestion('Введите имя (необязательно): ');
        const lastName = await askQuestion('Введите фамилию (необязательно): ');

        if (!telegramId) {
            console.log('❌ Telegram ID обязателен!');
            process.exit(1);
        }

        // Проверяем, не существует ли уже пользователь с таким Telegram ID
        const existingUser = await db.getUserByTelegramId(telegramId);
        if (existingUser) {
            console.log('❌ Пользователь с таким Telegram ID уже существует!');
            process.exit(1);
        }

        // Добавляем администратора
        const adminId = await db.addUser({
            telegram_id: parseInt(telegramId),
            username: username || null,
            first_name: firstName || null,
            last_name: lastName || null,
            role: 'admin'
        });

        console.log('\n✅ Администратор успешно добавлен!');
        console.log(`   ID в базе: ${adminId}`);
        console.log(`   Telegram ID: ${telegramId}`);
        console.log(`   Username: ${username || 'Не указан'}`);
        console.log(`   Имя: ${firstName || 'Не указано'}`);
        console.log(`   Фамилия: ${lastName || 'Не указана'}`);
        
        console.log('\n📱 Теперь вы можете войти в приложение через Telegram Mini App!');
        
    } catch (error) {
        console.error('❌ Ошибка при создании администратора:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Запуск скрипта
if (require.main === module) {
    initAdmin();
}

module.exports = { initAdmin };
