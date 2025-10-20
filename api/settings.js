const settings = require('../shared/settings');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET') {
        return res.status(200).json(settings);
    }

    if (req.method === 'POST') {
        const { sheetsUrl, searchColumn, resultColumns, sheets_url, search_column, result_columns } = req.body;
        
        // Поддерживаем оба формата (старый и новый)
        settings.sheets_url = sheetsUrl || sheets_url || '';
        settings.search_column = searchColumn || search_column || '';
        settings.result_columns = resultColumns || result_columns || '';
        
        console.log('Settings saved:', settings);
        return res.status(200).json({ success: true, settings });
    }

    res.status(405).json({ error: 'Method not allowed' });
};
