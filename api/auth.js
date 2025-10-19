// Простой auth API endpoint для Vercel
export default function handler(req, res) {
    console.log('Vercel auth API called with:', req.body);
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
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
}
