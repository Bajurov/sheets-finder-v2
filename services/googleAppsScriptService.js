const https = require('https');
const fetch = require('node-fetch');

class GoogleAppsScriptService {
    constructor() {
        this.baseUrl = 'https://script.google.com/macros/s';
    }

    // Извлечь ID скрипта из URL Google Apps Script
    extractScriptId(url) {
        console.log('Extracting script ID from URL:', url);
        
        // Проверяем разные форматы URL
        const patterns = [
            /\/macros\/s\/([a-zA-Z0-9-_]+)/,  // Стандартный формат
            /\/exec\/([a-zA-Z0-9-_]+)/,       // Альтернативный формат
            /\/s\/([a-zA-Z0-9-_]+)/           // Короткий формат
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                console.log('Found script ID:', match[1]);
                return match[1];
            }
        }
        
        console.log('No script ID found in URL');
        return null;
    }

    // Выполнить запрос к Google Apps Script с обработкой редиректов
    async makeRequest(scriptId, functionName, parameters = {}) {
        try {
            const url = `${this.baseUrl}/${scriptId}/exec`;
            const postData = {
                function: functionName,
                parameters: parameters
            };

            console.log('Making request to:', url);
            console.log('Request data:', postData);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Sheets-Finder-App/1.0'
                },
                body: JSON.stringify(postData),
                redirect: 'follow', // Автоматически следовать редиректам
                timeout: 15000
            });

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            const data = await response.text();
            console.log('Raw Response:', data.substring(0, 200) + '...');

            // Проверяем, что ответ начинается с JSON
            if (data.trim().startsWith('<')) {
                return {
                    success: false,
                    error: 'Получен HTML вместо JSON. Проверьте URL и развертывание Google Apps Script'
                };
            }

            try {
                const result = JSON.parse(data);
                return result;
            } catch (error) {
                return {
                    success: false,
                    error: 'Ошибка парсинга ответа: ' + error.message + '. Ответ: ' + data.substring(0, 100)
                };
            }
        } catch (error) {
            console.log('Request error:', error);
            return {
                success: false,
                error: 'Ошибка сети: ' + error.message
            };
        }
    }

    // Тест подключения к Google Apps Script
    async testConnection(scriptUrl) {
        try {
            console.log('Testing connection to:', scriptUrl);
            
            const scriptId = this.extractScriptId(scriptUrl);
            if (!scriptId) {
                return {
                    success: false,
                    error: `Неверный формат URL Google Apps Script. Получен URL: "${scriptUrl}". URL должен содержать /macros/s/.../exec или быть в формате: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`
                };
            }
            
            console.log('Extracted script ID:', scriptId);

            const result = await this.makeRequest(scriptId, 'testConnection');
            
            if (result.success) {
                return {
                    success: true,
                    rows: result.rows,
                    sheetName: result.sheetName,
                    message: result.message
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Ошибка подключения'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: 'Ошибка подключения: ' + error.message
            };
        }
    }

    // Поиск в таблице через Google Apps Script
    async search(scriptUrl, query, options = {}) {
        try {
            const scriptId = this.extractScriptId(scriptUrl);
            if (!scriptId) {
                return { error: 'connection' };
            }

            const {
                searchColumn = 'A',
                resultColumns = 'B,C,D',
                page = 1,
                limit = 10
            } = options;

            const result = await this.makeRequest(scriptId, 'searchInSheet', {
                query: query,
                searchColumn: searchColumn,
                resultColumns: resultColumns
            });

            if (!result.success) {
                return { error: 'connection' };
            }

            // Пагинация
            const totalResults = result.data.length;
            const totalPages = Math.ceil(totalResults / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = result.data.slice(startIndex, endIndex);

            return {
                data: paginatedResults,
                page,
                totalPages,
                totalResults
            };
        } catch (error) {
            console.error('Ошибка поиска:', error);
            return { error: 'connection' };
        }
    }

    // Получить подсказки для автодополнения
    async getSuggestions(scriptUrl, query, options = {}) {
        try {
            const scriptId = this.extractScriptId(scriptUrl);
            if (!scriptId) {
                return [];
            }

            const { searchColumn = 'A' } = options;

            const result = await this.makeRequest(scriptId, 'getSuggestions', {
                query: query,
                searchColumn: searchColumn
            });

            if (result.success) {
                return result.suggestions || [];
            }

            return [];
        } catch (error) {
            console.error('Ошибка получения подсказок:', error);
            return [];
        }
    }

    // Получить информацию о таблице
    async getSheetInfo(scriptUrl) {
        try {
            const scriptId = this.extractScriptId(scriptUrl);
            if (!scriptId) {
                return {
                    success: false,
                    error: 'Неверный формат URL'
                };
            }

            const result = await this.makeRequest(scriptId, 'getSheetInfo');
            return result;
        } catch (error) {
            return {
                success: false,
                error: 'Ошибка получения информации: ' + error.message
            };
        }
    }
}

module.exports = GoogleAppsScriptService;