// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const navItems = document.querySelectorAll('.sidebar nav li');
const serverStartBtn = document.getElementById('startServer');
const serverStopBtn = document.getElementById('stopServer');
const serverRestartBtn = document.getElementById('restartServer');
const consoleInput = document.getElementById('consoleInput');
const consoleOutput = document.getElementById('consoleOutput');
const sendCommandBtn = document.getElementById('sendCommand');
const showPlayersBtn = document.getElementById('showPlayers');
const copyIpBtn = document.querySelector('.copy-btn');

// Toggle sidebar on mobile
menuToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    menuToggle.innerHTML = sidebar.classList.contains('show') ? 
        '<i class="fas fa-times"></i>' : 
        '<i class="fas fa-bars"></i>';
});

// Handle navigation: switch visible section based on data-section
const sections = document.querySelectorAll('[data-section-content]');
function showSection(key) {
    sections.forEach(sec => {
        if (sec.getAttribute('data-section-content') === key) {
            sec.style.display = '';
        } else {
            sec.style.display = 'none';
        }
    });
}

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');

        // Section switching
        const key = item.getAttribute('data-section') || 'dashboard';
        showSection(key);
        
        // If on mobile, close sidebar after clicking
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('show');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
});

// Server control buttons
serverStartBtn?.addEventListener('click', () => {
    // Simulate server start
    addConsoleLog('Starting Minecraft server...', 'info');
    setTimeout(() => {
        addConsoleLog('Loading properties', 'info');
        addConsoleLog('Default game type: SURVIVAL', 'info');
        addConsoleLog('Generating keypair', 'info');
        addConsoleLog('Starting Minecraft server on *:25565', 'info');
        addConsoleLog('Using default channel type', 'info');
        addConsoleLog('Preparing level "world"', 'info');
        addConsoleLog('Preparing start region for dimension minecraft:overworld', 'info');
        addConsoleLog('Done (5.234s)! For help, type "help"', 'success');
        updateServerStatus('online');
    }, 1000);
});

serverStopBtn?.addEventListener('click', () => {
    // Simulate server stop
    addConsoleLog('Stopping the server...', 'warning');
    setTimeout(() => {
        addConsoleLog('Stopping server', 'warning');
        addConsoleLog('Saving players', 'warning');
        addConsoleLog('Saving worlds', 'warning');
        addConsoleLog('Saving chunks for level \'world\'/', 'warning');
        addConsoleLog('ThreadedAnvilChunkStorage (world): All chunks are saved', 'warning');
        addConsoleLog('ThreadedAnvilChunkStorage (DIM-1): All chunks are saved', 'warning');
        addConsoleLog('ThreadedAnvilChunkStorage (DIM1): All chunks are saved', 'warning');
        addConsoleLog('ThreadedAnvilChunkStorage (world_nether): All chunks are saved', 'warning');
        addConsoleLog('ThreadedAnvilChunkStorage (world_the_end): All chunks are saved', 'warning');
        addConsoleLog('Server stopped.', 'error');
        updateServerStatus('offline');
    }, 1000);
});

serverRestartBtn?.addEventListener('click', () => {
    // Simulate server restart
    addConsoleLog('Restarting server...', 'warning');
    serverStopBtn.click();
    setTimeout(() => {
        serverStartBtn.click();
    }, 2000);
});

// Console input
consoleInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCommand();
    }
});

sendCommandBtn?.addEventListener('click', sendCommand);

function sendCommand() {
    const command = consoleInput.value.trim();
    if (command) {
        // Add command to console
        addConsoleLog(`> ${command}`, 'command');
        
        // Clear input
        consoleInput.value = '';
        
        // Simulate response (in a real app, this would be handled by the server)
        setTimeout(() => {
            if (command.toLowerCase() === 'help') {
                addConsoleLog('--- Showing help ---', 'info');
                addConsoleLog('help - Shows this help message', 'info');
                addConsoleLog('list - Lists players on the server', 'info');
                addConsoleLog('stop - Stops the server', 'info');
                addConsoleLog('say <message> - Broadcasts a message', 'info');
            } else if (command.toLowerCase() === 'list') {
                addConsoleLog('There are 3/20 players online:', 'info');
                addConsoleLog('- Player1', 'info');
                addConsoleLog('- Player2', 'info');
                addConsoleLog('- Player3', 'info');
            } else if (command.toLowerCase().startsWith('say ')) {
                const message = command.substring(4);
                addConsoleLog(`[Server] ${message}`, 'info');
            } else if (command.toLowerCase() === 'stop') {
                serverStopBtn.click();
            } else {
                addConsoleLog(`Unknown command. Type "help" for help.`, 'error');
            }
        }, 300);
    }
}

// Copy server IP to clipboard
copyIpBtn?.addEventListener('click', () => {
    const ip = document.getElementById('serverIp').textContent;
    navigator.clipboard.writeText(ip).then(() => {
        const originalText = copyIpBtn.innerHTML;
        copyIpBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyIpBtn.innerHTML = originalText;
        }, 2000);
    });
});

// Show players list
showPlayersBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    // In a real app, this would show a modal with the players list
    addConsoleLog('There are 3/20 players online:', 'info');
    addConsoleLog('- Player1 (Survival)', 'info');
    addConsoleLog('- Player2 (Creative)', 'info');
    addConsoleLog('- Player3 (Adventure)', 'info');
});

// Helper function to add log entries to the console (robust)
function addConsoleLog(message, type = 'info') {
    const out = document.getElementById('consoleOutput');
    if (!out) {
        // Fallback to browser console if UI console not found
        console[type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log'](message);
        return;
    }
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    out.appendChild(logEntry);
    out.scrollTop = out.scrollHeight;
}

// Update server status UI
function updateServerStatus(status) {
    const statusIndicator = document.querySelector('.status-indicator');
    const pulse = document.querySelector('.pulse');
    
    if (status === 'online') {
        statusIndicator.className = 'status-indicator online';
        statusIndicator.innerHTML = '<span class="pulse"></span><span>يعمل</span>';
        serverStartBtn.disabled = true;
        serverStopBtn.disabled = false;
        serverRestartBtn.disabled = false;
    } else {
        statusIndicator.className = 'status-indicator offline';
        statusIndicator.innerHTML = '<span class="pulse"></span><span>متوقف</span>';
        serverStartBtn.disabled = false;
        serverStopBtn.disabled = true;
        serverRestartBtn.disabled = true;
    }
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Set initial server status
    updateServerStatus('online');
    
    // Add some initial console logs
    addConsoleLog('Starting minecraft server version 1.20.1', 'info');
    addConsoleLog('Loading properties', 'info');
    addConsoleLog('Default game type: SURVIVAL', 'info');
    addConsoleLog('Generating keypair', 'info');
    addConsoleLog('Starting Minecraft server on *:25565', 'info');
    addConsoleLog('Using default channel type', 'info');
    addConsoleLog('Preparing level "world"', 'info');
    addConsoleLog('Preparing start region for dimension minecraft:overworld', 'info');
    addConsoleLog('Done (3.456s)! For help, type "help"', 'success');
    
    // Set user email if available
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const emailElement = document.getElementById('userEmail');
        if (emailElement) {
            emailElement.textContent = userEmail;
        }
    }

    // Ensure dashboard is visible by default
    showSection('dashboard');

    // GitHub connect status helpers
    const ghStatusEl = document.getElementById('githubStatus');
    const ghConnectBtn = document.getElementById('githubConnect');
    const ghDisconnectBtn = document.getElementById('githubDisconnect');
    const ghTokenInput = document.getElementById('ghToken');

    async function refreshGithubStatus() {
        const stored = localStorage.getItem('ghToken');
        if (!stored) {
            ghStatusEl && (ghStatusEl.textContent = 'غير مربوط');
            ghConnectBtn && (ghConnectBtn.style.display = 'inline-flex');
            ghDisconnectBtn && (ghDisconnectBtn.style.display = 'none');
            return;
        }
        try {
            ghStatusEl && (ghStatusEl.textContent = 'جاري التحقق...');
            const uRes = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${stored}` }
            });
            if (!uRes.ok) throw new Error('Token غير صالح');
            const user = await uRes.json();
            ghStatusEl && (ghStatusEl.textContent = `مرتبط: @${user.login}`);
            ghConnectBtn && (ghConnectBtn.style.display = 'none');
            ghDisconnectBtn && (ghDisconnectBtn.style.display = 'inline-flex');
            if (ghTokenInput) ghTokenInput.value = '••••••••';
        } catch (e) {
            ghStatusEl && (ghStatusEl.textContent = 'فشل الربط. تحقق من التوكن');
            localStorage.removeItem('ghToken');
            ghConnectBtn && (ghConnectBtn.style.display = 'inline-flex');
            ghDisconnectBtn && (ghDisconnectBtn.style.display = 'none');
            if (ghTokenInput) ghTokenInput.value = '';
        }
    }

    ghConnectBtn?.addEventListener('click', async () => {
        // If backend OAuth is available, use redirect flow.
        // This expects a local backend serving at the same origin with /auth/github/login
        try {
            addConsoleLog('تحويل إلى GitHub لتفويض الوصول...', 'info');
            window.location.assign('/auth/github/login');
            return;
        } catch (e) {
            // Fallback to token prompt if backend not available
            const existing = localStorage.getItem('ghToken');
            let token = existing;
            if (!token) {
                const v = ghTokenInput && ghTokenInput.value && ghTokenInput.value !== '••••••••' ? ghTokenInput.value.trim() : '';
                token = v || prompt('أدخل GitHub Personal Access Token (صلاحية repo):', '')?.trim();
            }
            if (!token) return;
            localStorage.setItem('ghToken', token);
            await refreshGithubStatus();
            addConsoleLog('تم ربط GitHub بنجاح (Token مباشر).', 'success');
        }
    });

    ghDisconnectBtn?.addEventListener('click', () => {
        localStorage.removeItem('ghToken');
        if (ghTokenInput) ghTokenInput.value = '';
        refreshGithubStatus();
        addConsoleLog('تم فصل GitHub.', 'warning');
    });

    // If redirected back with #gh=<token>, store and clean URL
    (function captureGhFromHash() {
        if (window.location.hash && window.location.hash.startsWith('#gh=')) {
            const token = decodeURIComponent(window.location.hash.substring(4));
            if (token) {
                localStorage.setItem('ghToken', token);
                // Clean hash from URL
                history.replaceState(null, '', window.location.pathname);
            }
        }
    })();

    // Initialize GitHub status on load
    refreshGithubStatus();

    // Populate Minecraft versions 1.0 → 1.21.9 (both minor-only and patched variants)
    (function populateVersions() {
        const sel = document.getElementById('srvVersion');
        if (!sel) return;
        sel.innerHTML = '';
        const versions = [];
        for (let minor = 0; minor <= 21; minor++) {
            // Add 1.minor (e.g., 1.0, 1.1, ...)
            versions.push(`1.${minor}`);
            // Add patches .1 to .9 (e.g., 1.minor.1 ... 1.minor.9)
            for (let patch = 1; patch <= 9; patch++) {
                versions.push(`1.${minor}.${patch}`);
            }
        }
        // Newest first
        versions.reverse().forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            sel.appendChild(opt);
        });
        // Preselect a recent version if exists
        if (versions.includes('1.21.1')) sel.value = '1.21.1';
    })();

    // Wire up Server Management actions with optional GitHub integration
    document.getElementById('createServer')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = document.getElementById('srvName')?.value || 'My Server';
        const version = document.getElementById('srvVersion')?.value || 'latest';
        const software = document.getElementById('srvSoftware')?.value || 'Vanilla';
        const ghToken = (localStorage.getItem('ghToken')?.trim()) || (document.getElementById('ghToken')?.value?.trim());
        const btn = document.getElementById('createServer');
        const out = document.getElementById('consoleOutput');

        if (!name.trim()) {
            addConsoleLog('يرجى إدخال اسم السيرفر.', 'error');
            return;
        }

        if (!out) {
            addConsoleLog('Console output element not found. Cannot proceed.', 'error');
            return;
        }

        // Immediate feedback
        addConsoleLog(`بدء إنشاء السيرفر: ${name} — ${software} ${version}`, 'info');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء'; }

        const proceedInstall = () => {
            // Simulate download/install steps
            addConsoleLog(`تنزيل الحزمة (${software}) للإصدار ${version}...`, 'info');
            setTimeout(() => {
                addConsoleLog('استخراج الملفات وإعداد البيئة...', 'info');
                setTimeout(() => {
                    addConsoleLog('تهيئة ملفات التكوين (eula.txt, server.properties)...', 'info');
                    setTimeout(() => {
                        addConsoleLog('تم إنشاء السيرفر بنجاح.', 'success');
                        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> إنشاء'; }
                    }, 500);
                }, 600);
            }, 700);
        };

        // If GitHub token provided, create repo named after server and block duplicates
        if (ghToken) {
            try {
                addConsoleLog('التحقق من حساب GitHub...', 'info');
                const uRes = await fetch('https://api.github.com/user', {
                    headers: { Authorization: `Bearer ${ghToken}` }
                });
                if (!uRes.ok) throw new Error('تعذر الوصول إلى حساب GitHub');
                const user = await uRes.json();
                const login = user.login;
                addConsoleLog(`المستخدم: ${login}`, 'info');

                // Try to create repo directly; if 422, treat as exists
                addConsoleLog(`إنشاء مستودع GitHub: ${name}...`, 'info');
                const cRes = await fetch('https://api.github.com/user/repos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ghToken}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, auto_init: true, private: true, description: `Minecraft server ${name} (${software} ${version})` })
                });
                if (cRes.status === 422) {
                    addConsoleLog('الاسم موجود مسبقًا في GitHub. يرجى تغيير الاسم.', 'error');
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> إنشاء'; }
                    return;
                }
                if (!cRes.ok) {
                    const t = await cRes.text();
                    addConsoleLog(`فشل إنشاء المستودع: ${t}`, 'error');
                    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> إنشاء'; }
                    return;
                }
                addConsoleLog('تم إنشاء المستودع بنجاح على GitHub.', 'success');

                // Optionally add to existingServers list
                const sel = document.getElementById('existingServers');
                if (sel) {
                    const opt = document.createElement('option');
                    opt.textContent = `${name} - ${software}`;
                    opt.value = name;
                    sel.appendChild(opt);
                }

                proceedInstall();
            } catch (e) {
                addConsoleLog(`خطأ GitHub: ${e.message}`, 'error');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> إنشاء'; }
            }
        } else {
            proceedInstall();
        }
    });

    // Delete server handler
    document.getElementById('deleteServer')?.addEventListener('click', () => {
        const sel = document.getElementById('existingServers');
        const chosen = sel && sel.options[sel.selectedIndex]?.text || 'Selected Server';
        addConsoleLog(`Deleting server: ${chosen} ...`, 'warning');
        setTimeout(() => addConsoleLog('Server deleted (mock).', 'error'), 600);
    });

    // Save world settings handler
    document.getElementById('saveWorldSettings')?.addEventListener('click', () => {
        const seed = document.getElementById('worldSeed')?.value || '(none)';
        const difficulty = document.getElementById('difficulty')?.value || 'normal';
        const gamemode = document.getElementById('gamemode')?.value || 'survival';
        const worldType = document.getElementById('worldType')?.value || 'default';
        addConsoleLog(`Saving world settings: seed=${seed}, difficulty=${difficulty}, mode=${gamemode}, type=${worldType}`, 'info');
        setTimeout(() => addConsoleLog('World settings saved (mock).', 'success'), 400);
    });
});
