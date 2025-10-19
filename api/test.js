module.exports = (req, res) => {
    console.log('Test API endpoint called');
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
        status: 'ok',
        message: 'API is working',
        timestamp: new Date().toISOString(),
        adminId: 699759380
    });
};
