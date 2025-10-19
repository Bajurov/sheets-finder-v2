// Hardcoded admin ID
const ADMIN_ID = 699759380;

// In-memory "database"
const users = new Map();

// Add hardcoded admin
users.set(ADMIN_ID, {
    id: 1,
    telegram_id: ADMIN_ID,
    username: 'admin',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: new Date().toISOString()
});

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
        return res.status(200).json({ users: Array.from(users.values()) });
    }

    if (req.method === 'POST') {
        const { telegramId, username, firstName, lastName, role = 'user' } = req.body;
        if (!telegramId) {
            return res.status(400).json({ error: 'Telegram ID обязателен' });
        }
        const newUser = {
            id: users.size + 1,
            telegram_id: parseInt(telegramId),
            username,
            first_name: firstName,
            last_name: lastName,
            role,
            created_at: new Date().toISOString()
        };
        users.set(parseInt(telegramId), newUser);
        return res.status(200).json({ success: true, user: newUser });
    }

    if (req.method === 'DELETE') {
        const { telegramId } = req.query;
        if (users.delete(parseInt(telegramId))) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
};
