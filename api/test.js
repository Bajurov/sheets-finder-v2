// Простой API endpoint для Vercel
export default function handler(req, res) {
    console.log('Vercel API test endpoint called');
    
    res.status(200).json({
        status: 'ok',
        message: 'Vercel API is working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        adminId: process.env.ADMIN_ID
    });
}
