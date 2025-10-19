// Telegram Web App инициализация
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Глобальные переменные
let currentUser = null;
let currentPage = 1;
let totalPages = 1;
let searchResults = [];
let suggestions = [];

// DOM элементы
const screens = {
    loading: document.getElementById('loading'),
    noAccess: document.getElementById('no-access'),
    adminPanel: document.getElementById('admin-panel'),
    searchScreen: document.getElementById('search-screen')
};

const elements = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    suggestions: document.getElementById('suggestions'),
    resultsList: document.getElementById('results-list'),
    searchResults: document.getElementById('search-results'),
    noResults: document.getElementById('no-results'),
    connectionError: document.getElementById('connection-error'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    pageInfo: document.getElementById('page-info'),
    goToAdmin: document.getElementById('go-to-admin'),
    goToSearch: document.getElementById('go-to-search'),
    usersList: document.getElementById('users-list'),
    addUserBtn: document.getElementById('add-user-btn'),
    sheetsUrl: document.getElementById('sheets-url'),
    testConnection: document.getElementById('test-connection'),
    connectionStatus: document.getElementById('connection-status'),
    searchColumn: document.getElementById('search-column'),
    resultColumns: document.getElementById('result-columns'),
    saveSettings: document.getElementById('save-settings'),
    addUserModal: document.getElementById('add-user-modal'),
    newUserTelegramId: document.getElementById('new-user-telegram-id'),
    newUserUsername: document.getElementById('new-user-username'),
    cancelAddUser: document.getElementById('cancel-add-user'),
    confirmAddUser: document.getElementById('confirm-add-user')
};

// Инициализация приложения
async function initApp() {
    try {
        showScreen('loading');
        
        // Отладочная информация
        let debugInfo = `=== ОТЛАДОЧНАЯ ИНФОРМАЦИЯ ===\n\n`;
        debugInfo += `Telegram WebApp объект: ${typeof tg}\n`;
        debugInfo += `tg.initDataUnsafe: ${typeof tg.initDataUnsafe}\n`;
        debugInfo += `tg.initDataUnsafe?.user: ${typeof tg.initDataUnsafe?.user}\n\n`;
        
        // Получаем данные пользователя из Telegram
        const telegramUser = tg.initDataUnsafe?.user;
        console.log('Telegram user data:', telegramUser);
        
        debugInfo += `initDataUnsafe: ${JSON.stringify(tg.initDataUnsafe, null, 2)}\n\n`;
        debugInfo += `user: ${JSON.stringify(telegramUser, null, 2)}\n\n`;
        
        if (!telegramUser) {
            debugInfo += `ОШИБКА: Данные пользователя недоступны!\n`;
            debugInfo += `Возможные причины:\n`;
            debugInfo += `- Telegram WebApp не инициализирован\n`;
            debugInfo += `- Пользователь не авторизован в Telegram\n`;
            debugInfo += `- Проблема с настройками бота\n\n`;
            
            // Если данные пользователя недоступны, показываем экран без ID
            const telegramIdElement = document.getElementById('user-telegram-id');
            const debugContent = document.getElementById('debug-content');
            
            if (telegramIdElement) {
                telegramIdElement.textContent = 'Недоступен';
            }
            
            if (debugContent) {
                debugContent.textContent = debugInfo;
            }
            
            showScreen('noAccess');
            return;
        }

        // Проверяем авторизацию пользователя
        debugInfo += `Отправляем запрос авторизации...\n`;
        
        let response;
        let userData;
        
        try {
            response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: telegramUser.id,
                    username: telegramUser.username,
                    firstName: telegramUser.first_name,
                    lastName: telegramUser.last_name
                })
            });
            
            debugInfo += `Статус ответа: ${response.status}\n`;
            userData = await response.json();
            debugInfo += `Ответ получен успешно\n`;
        } catch (error) {
            debugInfo += `ОШИБКА при запросе авторизации: ${error.message}\n`;
            userData = { authorized: false, error: error.message };
        }
        
        // Добавляем информацию об авторизации в отладку
        debugInfo += `\nЗапрос авторизации:\n`;
        debugInfo += `Отправлено: ${JSON.stringify({
            telegramId: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name
        }, null, 2)}\n`;
        debugInfo += `Получено: ${JSON.stringify(userData, null, 2)}\n`;
        
        if (!userData.authorized) {
            // Отображаем Telegram ID пользователя на экране "Нет доступа"
            const telegramIdElement = document.getElementById('user-telegram-id');
            const debugContent = document.getElementById('debug-content');
            
            if (telegramIdElement && telegramUser.id) {
                telegramIdElement.textContent = telegramUser.id;
            }
            
            if (debugContent) {
                debugContent.textContent = debugInfo;
            }
            
            showScreen('noAccess');
            return;
        }

        currentUser = userData.user;
        
        if (currentUser.role === 'admin') {
            showScreen('adminPanel');
            elements.goToAdmin.classList.remove('hidden');
            await loadAdminData();
        } else {
            showScreen('searchScreen');
            elements.goToAdmin.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        
        // Показываем отладочную информацию об ошибке
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            let debugInfo = `=== ОШИБКА ИНИЦИАЛИЗАЦИИ ===\n\n`;
            debugInfo += `Ошибка: ${error.message}\n`;
            debugInfo += `Стек: ${error.stack}\n\n`;
            debugInfo += `Telegram WebApp: ${typeof tg}\n`;
            debugInfo += `tg.initDataUnsafe: ${typeof tg.initDataUnsafe}\n`;
            debugContent.textContent = debugInfo;
        }
        
        showScreen('noAccess');
    }
}

// Показать экран
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// Загрузка данных для админ-панели
async function loadAdminData() {
    try {
        // Загружаем пользователей
        const usersResponse = await fetch('/api/users');
        const users = await usersResponse.json();
        renderUsersList(users);

        // Загружаем настройки
        const settingsResponse = await fetch('/api/settings');
        const settings = await settingsResponse.json();
        if (settings.sheetsUrl) elements.sheetsUrl.value = settings.sheetsUrl;
        if (settings.searchColumn) elements.searchColumn.value = settings.searchColumn;
        if (settings.resultColumns) elements.resultColumns.value = settings.resultColumns;
        
    } catch (error) {
        console.error('Ошибка загрузки данных админ-панели:', error);
    }
}

// Рендер списка пользователей
function renderUsersList(users) {
    elements.usersList.innerHTML = '';
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-info">
                <div class="user-username">${user.username || 'Без имени'}</div>
                <div class="user-telegram-id">ID: ${user.telegram_id}</div>
            </div>
            <button class="btn btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
        `;
        elements.usersList.appendChild(userItem);
    });
}

// Поиск с автоподсказками
let searchTimeout;
elements.searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        elements.suggestions.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.suggestions && data.suggestions.length > 0) {
                suggestions = data.suggestions;
                renderSuggestions();
                elements.suggestions.classList.remove('hidden');
            } else {
                elements.suggestions.classList.add('hidden');
            }
        } catch (error) {
            console.error('Ошибка получения подсказок:', error);
            elements.suggestions.classList.add('hidden');
        }
    }, 300);
});

// Рендер подсказок
function renderSuggestions() {
    elements.suggestions.innerHTML = '';
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', () => {
            elements.searchInput.value = suggestion;
            elements.suggestions.classList.add('hidden');
            performSearch();
        });
        elements.suggestions.appendChild(item);
    });
}

// Скрыть подсказки при клике вне
document.addEventListener('click', (e) => {
    if (!elements.suggestions.contains(e.target) && !elements.searchInput.contains(e.target)) {
        elements.suggestions.classList.add('hidden');
    }
});

// Выполнить поиск
async function performSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    try {
        elements.suggestions.classList.add('hidden');
        elements.searchResults.classList.add('hidden');
        elements.noResults.classList.add('hidden');
        elements.connectionError.classList.add('hidden');

        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, page: 1 })
        });

        const data = await response.json();
        
        if (data.error) {
            if (data.error === 'connection') {
                elements.connectionError.classList.remove('hidden');
            } else {
                elements.noResults.classList.remove('hidden');
            }
            return;
        }

        searchResults = data.results;
        currentPage = data.page;
        totalPages = data.totalPages;
        
        renderSearchResults();
        updatePagination();
        elements.searchResults.classList.remove('hidden');
        
    } catch (error) {
        console.error('Ошибка поиска:', error);
        elements.connectionError.classList.remove('hidden');
    }
}

// Рендер результатов поиска
function renderSearchResults() {
    elements.resultsList.innerHTML = '';
    
    searchResults.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        let suppliersHtml = '';
        if (result.suppliers && result.suppliers.length > 0) {
            suppliersHtml = result.suppliers.map(supplier => 
                `<div class="result-supplier">${supplier}</div>`
            ).join('');
        }
        
        resultItem.innerHTML = `
            <div class="result-brand">${result.brand}</div>
            ${suppliersHtml}
        `;
        
        elements.resultsList.appendChild(resultItem);
    });
}

// Обновить пагинацию
function updatePagination() {
    elements.pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
}

// Переход на предыдущую страницу
async function goToPrevPage() {
    if (currentPage <= 1) return;
    await goToPage(currentPage - 1);
}

// Переход на следующую страницу
async function goToNextPage() {
    if (currentPage >= totalPages) return;
    await goToPage(currentPage + 1);
}

// Переход на страницу
async function goToPage(page) {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, page })
        });

        const data = await response.json();
        
        if (data.error) {
            if (data.error === 'connection') {
                elements.connectionError.classList.remove('hidden');
            }
            return;
        }

        searchResults = data.results;
        currentPage = data.page;
        totalPages = data.totalPages;
        
        renderSearchResults();
        updatePagination();
        
    } catch (error) {
        console.error('Ошибка загрузки страницы:', error);
    }
}

// Тест подключения к Google Sheets
async function testConnection() {
    const url = elements.sheetsUrl.value.trim();
    if (!url) {
        showConnectionStatus('Введите ссылку на таблицу', 'error');
        return;
    }

    try {
        elements.testConnection.disabled = true;
        elements.testConnection.textContent = 'Проверка...';
        
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();
        
        if (data.success) {
            showConnectionStatus(`✅ OK\nСтрок: ${data.rows}\nЛистов: ${data.sheets}`, 'success');
        } else {
            showConnectionStatus(`❌ Ошибка: ${data.error}`, 'error');
        }
        
    } catch (error) {
        showConnectionStatus('❌ Ошибка подключения', 'error');
    } finally {
        elements.testConnection.disabled = false;
        elements.testConnection.textContent = 'Тест подключения';
    }
}

// Показать статус подключения
function showConnectionStatus(message, type) {
    elements.connectionStatus.textContent = message;
    elements.connectionStatus.className = `connection-${type}`;
    elements.connectionStatus.style.display = 'block';
}

// Сохранить настройки
async function saveSettings() {
    const settings = {
        sheetsUrl: elements.sheetsUrl.value.trim(),
        searchColumn: elements.searchColumn.value.trim(),
        resultColumns: elements.resultColumns.value.trim()
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            alert('Настройки сохранены');
        } else {
            alert('Ошибка сохранения настроек');
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка сохранения настроек');
    }
}

// Добавить пользователя
async function addUser() {
    const telegramId = elements.newUserTelegramId.value.trim();
    const username = elements.newUserUsername.value.trim();

    if (!telegramId) {
        alert('Введите Telegram ID');
        return;
    }

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId, username })
        });

        if (response.ok) {
            elements.addUserModal.classList.add('hidden');
            elements.newUserTelegramId.value = '';
            elements.newUserUsername.value = '';
            await loadAdminData();
        } else {
            alert('Ошибка добавления пользователя');
        }
    } catch (error) {
        console.error('Ошибка добавления пользователя:', error);
        alert('Ошибка добавления пользователя');
    }
}

// Удалить пользователя
async function deleteUser(userId) {
    if (!confirm('Удалить пользователя?')) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadAdminData();
        } else {
            alert('Ошибка удаления пользователя');
        }
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        alert('Ошибка удаления пользователя');
    }
}

// Обработчики событий
elements.searchBtn.addEventListener('click', performSearch);
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

elements.prevPage.addEventListener('click', goToPrevPage);
elements.nextPage.addEventListener('click', goToNextPage);

elements.goToSearch.addEventListener('click', () => showScreen('searchScreen'));
elements.goToAdmin.addEventListener('click', () => showScreen('adminPanel'));

elements.testConnection.addEventListener('click', testConnection);
elements.saveSettings.addEventListener('click', saveSettings);

elements.addUserBtn.addEventListener('click', () => {
    elements.addUserModal.classList.remove('hidden');
});

elements.cancelAddUser.addEventListener('click', () => {
    elements.addUserModal.classList.add('hidden');
});

elements.confirmAddUser.addEventListener('click', addUser);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что Telegram WebApp загружен
    if (typeof tg === 'undefined') {
        const debugContent = document.getElementById('debug-content');
        if (debugContent) {
            debugContent.textContent = `=== ОШИБКА ===\n\nTelegram WebApp не загружен!\nПроверьте настройки бота.`;
        }
        showScreen('noAccess');
        return;
    }
    
    initApp();
});
