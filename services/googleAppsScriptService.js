const https = require('https');

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

    // Выполнить запрос к Google Apps Script
    async makeRequest(scriptId, functionName, parameters = {}) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}/${scriptId}/exec`;
            const postData = JSON.stringify({
                function: functionName,
                parameters: parameters
            });

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'Sheets-Finder-App/1.0'
                },
                timeout: 10000
            };

            const req = https.request(url, options, (res) => {
                let data = '';
                
                console.log('Google Apps Script Response Status:', res.statusCode);
                console.log('Google Apps Script Response Headers:', res.headers);
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    console.log('Google Apps Script Raw Response:', data.substring(0, 200) + '...');
                    
                    // Проверяем статус код
                    if (res.statusCode >= 300 && res.statusCode < 400) {
                        resolve({
                            success: false,
                            error: `Получен редирект (статус ${res.statusCode}). URL может быть неправильным`
                        });
                        return;
                    }
                    
                    // Проверяем, что ответ начинается с JSON
                    if (data.trim().startsWith('<')) {
                        resolve({
                            success: false,
                            error: 'Получен HTML вместо JSON. Возможно, URL неправильный или развертывание не настроено как веб-приложение'
                        });
                        return;
                    }
                    
                    try {
                        const result = JSON.parse(data);
                        resolve(result);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Ошибка парсинга ответа: ' + error.message + '. Ответ: ' + data.substring(0, 100)
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.log('Request error:', error);
                reject({
                    success: false,
                    error: 'Ошибка сети: ' + error.message
                });
            });

            req.on('timeout', () => {
                console.log('Request timeout');
                req.destroy();
                reject({
                    success: false,
                    error: 'Таймаут запроса к Google Apps Script'
                });
            });

            req.write(postData);
            req.end();
        });
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
