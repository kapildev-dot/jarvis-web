/**
 * KAPISH JARVIS - System Configuration Core
 * Handles reading, writing, and applying settings via LocalStorage.
 */

// --- Default Configuration States ---
const defaultSettings = {
    profile: { name: "Kapish", initial: "K", role: "Student", course: "MCA" },
    appearance: { theme: "dark", accent: "cyan", density: "comfortable", fontSize: "medium", animations: true, glow: true, grid: true },
    dashboard: { landing: "dashboard", dateFmt: "DD/MM/YYYY", timeFmt: "12", weekStart: "Monday", greeting: true, status: true }
};

const defaultVoiceSettings = {
    enabled: true, responses: true, autoListen: false, lang: "en-IN", rate: 1.0, volume: 1.0
};

const defaultNotificationSettings = {
    tasks: true, classes: true, study: true, timing: "10"
};

const defaultStudySettings = {
    dailyGoal: 120, focus: 25, shortBreak: 5, longBreak: 15, sessions: 4, flashcards: 20
};

const defaultAISettings = {
    endpoint: ""
};

// Global State
let settings = {};
let voiceSettings = {};
let notificationSettings = {};
let studySettings = {};
let aiSettings = {};
let actionToConfirm = null; // For modal callbacks

// DOM Elements
const els = {
    // Profile
    profName: document.getElementById('profName'), profInitial: document.getElementById('profInitial'), profRole: document.getElementById('profRole'), profCourse: document.getElementById('profCourse'),
    headerAvatar: document.getElementById('headerAvatar'),
    // Appearance
    appTheme: document.getElementById('appTheme'), appDensity: document.getElementById('appDensity'), appFontSize: document.getElementById('appFontSize'),
    appAnim: document.getElementById('appAnim'), appGlow: document.getElementById('appGlow'), appGrid: document.getElementById('appGrid'),
    colorSwatches: document.querySelectorAll('.color-swatch'),
    // Dashboard
    dashLanding: document.getElementById('dashLanding'), dashDate: document.getElementById('dashDate'), dashTime: document.getElementById('dashTime'),
    dashWeek: document.getElementById('dashWeek'), dashGreeting: document.getElementById('dashGreeting'), dashStatus: document.getElementById('dashStatus'),
    // Voice
    voiceEnabled: document.getElementById('voiceEnabled'), voiceResponses: document.getElementById('voiceResponses'), voiceAuto: document.getElementById('voiceAuto'),
    voiceLang: document.getElementById('voiceLang'), voiceRate: document.getElementById('voiceRate'), voiceVol: document.getElementById('voiceVol'),
    rateVal: document.getElementById('rateVal'), volVal: document.getElementById('volVal'),
    // Notifications
    notifStatus: document.getElementById('notifStatus'), notifTasks: document.getElementById('notifTasks'), notifClass: document.getElementById('notifClass'), notifStudy: document.getElementById('notifStudy'), notifTiming: document.getElementById('notifTiming'),
    // Study
    studyGoal: document.getElementById('studyGoal'), studyGoalVal: document.getElementById('studyGoalVal'), studyFocus: document.getElementById('studyFocus'), studyShortBreak: document.getElementById('studyShortBreak'), studyLongBreak: document.getElementById('studyLongBreak'), studySessions: document.getElementById('studySessions'), studyFlashcards: document.getElementById('studyFlashcards'),
    // AI
    aiEndpoint: document.getElementById('aiEndpoint'),
    // Utility
    search: document.getElementById('settingsSearch'), cards: document.querySelectorAll('.settings-card')
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadAllSettings();
    populateUI();
    applyUITheme();
    
    initClock();
    updateSystemInformation();
    setupEventListeners();
});

// --- CORE FUNCTIONS (LOAD/SAVE) ---

function loadAllSettings() {
    settings = JSON.parse(localStorage.getItem('jarvisSettings')) || JSON.parse(JSON.stringify(defaultSettings));
    voiceSettings = JSON.parse(localStorage.getItem('jarvisVoiceSettings')) || JSON.parse(JSON.stringify(defaultVoiceSettings));
    notificationSettings = JSON.parse(localStorage.getItem('jarvisNotificationSettings')) || JSON.parse(JSON.stringify(defaultNotificationSettings));
    studySettings = JSON.parse(localStorage.getItem('jarvisStudySettings')) || JSON.parse(JSON.stringify(defaultStudySettings));
    aiSettings = JSON.parse(localStorage.getItem('jarvisAISettings')) || JSON.parse(JSON.stringify(defaultAISettings));
}

function saveAllSettings() {
    // Scrape DOM for Profile
    settings.profile.name = els.profName.value.trim() || defaultSettings.profile.name;
    settings.profile.initial = els.profInitial.value.trim().toUpperCase() || defaultSettings.profile.initial;
    settings.profile.role = els.profRole.value.trim() || defaultSettings.profile.role;
    settings.profile.course = els.profCourse.value.trim() || defaultSettings.profile.course;

    // Appearance
    settings.appearance.theme = els.appTheme.value;
    settings.appearance.density = els.appDensity.value;
    settings.appearance.fontSize = els.appFontSize.value;
    settings.appearance.animations = els.appAnim.checked;
    settings.appearance.glow = els.appGlow.checked;
    settings.appearance.grid = els.appGrid.checked;
    // (Accent is updated immediately on click)

    // Dashboard
    settings.dashboard.landing = els.dashLanding.value;
    settings.dashboard.dateFmt = els.dashDate.value;
    settings.dashboard.timeFmt = els.dashTime.value;
    settings.dashboard.weekStart = els.dashWeek.value;
    settings.dashboard.greeting = els.dashGreeting.checked;
    settings.dashboard.status = els.dashStatus.checked;

    // Voice
    voiceSettings.enabled = els.voiceEnabled.checked;
    voiceSettings.responses = els.voiceResponses.checked;
    voiceSettings.autoListen = els.voiceAuto.checked;
    voiceSettings.lang = els.voiceLang.value;
    voiceSettings.rate = parseFloat(els.voiceRate.value);
    voiceSettings.volume = parseFloat(els.voiceVol.value);

    // Notifications
    notificationSettings.tasks = els.notifTasks.checked;
    notificationSettings.classes = els.notifClass.checked;
    notificationSettings.study = els.notifStudy.checked;
    notificationSettings.timing = els.notifTiming.value;

    // Study
    studySettings.dailyGoal = parseInt(els.studyGoal.value);
    studySettings.focus = parseInt(els.studyFocus.value);
    studySettings.shortBreak = parseInt(els.studyShortBreak.value);
    studySettings.longBreak = parseInt(els.studyLongBreak.value);
    studySettings.sessions = parseInt(els.studySessions.value);
    studySettings.flashcards = parseInt(els.studyFlashcards.value);

    // AI
    aiSettings.endpoint = els.aiEndpoint.value.trim();

    // Write to LocalStorage
    localStorage.setItem('jarvisSettings', JSON.stringify(settings));
    localStorage.setItem('jarvisVoiceSettings', JSON.stringify(voiceSettings));
    localStorage.setItem('jarvisNotificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('jarvisStudySettings', JSON.stringify(studySettings));
    localStorage.setItem('jarvisAISettings', JSON.stringify(aiSettings));

    applyUITheme(); // Re-apply immediately
    els.headerAvatar.innerText = settings.profile.initial;
    showToast("Settings saved successfully.");
}

function restoreDefaults() {
    localStorage.removeItem('jarvisSettings');
    localStorage.removeItem('jarvisVoiceSettings');
    localStorage.removeItem('jarvisNotificationSettings');
    localStorage.removeItem('jarvisStudySettings');
    localStorage.removeItem('jarvisAISettings');
    
    loadAllSettings();
    populateUI();
    applyUITheme();
    showToast("Settings restored to defaults.");
}

// --- UI POPULATION & APPLICATION ---

function populateUI() {
    // Profile
    els.profName.value = settings.profile.name;
    els.profInitial.value = settings.profile.initial;
    els.profRole.value = settings.profile.role;
    els.profCourse.value = settings.profile.course;
    els.headerAvatar.innerText = settings.profile.initial;

    // Appearance
    els.appTheme.value = settings.appearance.theme;
    els.appDensity.value = settings.appearance.density;
    els.appFontSize.value = settings.appearance.fontSize;
    els.appAnim.checked = settings.appearance.animations;
    els.appGlow.checked = settings.appearance.glow;
    els.appGrid.checked = settings.appearance.grid;
    els.colorSwatches.forEach(sw => {
        sw.classList.toggle('active', sw.dataset.color === settings.appearance.accent);
    });

    // Dashboard
    els.dashLanding.value = settings.dashboard.landing;
    els.dashDate.value = settings.dashboard.dateFmt;
    els.dashTime.value = settings.dashboard.timeFmt;
    els.dashWeek.value = settings.dashboard.weekStart;
    els.dashGreeting.checked = settings.dashboard.greeting;
    els.dashStatus.checked = settings.dashboard.status;

    // Voice
    els.voiceEnabled.checked = voiceSettings.enabled;
    els.voiceResponses.checked = voiceSettings.responses;
    els.voiceAuto.checked = voiceSettings.autoListen;
    els.voiceLang.value = voiceSettings.lang;
    els.voiceRate.value = voiceSettings.rate;
    els.voiceVol.value = voiceSettings.volume;
    els.rateVal.innerText = voiceSettings.rate.toFixed(1);
    els.volVal.innerText = voiceSettings.volume.toFixed(1);

    // Notifications
    els.notifTasks.checked = notificationSettings.tasks;
    els.notifClass.checked = notificationSettings.classes;
    els.notifStudy.checked = notificationSettings.study;
    els.notifTiming.value = notificationSettings.timing;
    
    // Study
    els.studyGoal.value = studySettings.dailyGoal;
    els.studyGoalVal.innerText = studySettings.dailyGoal;
    els.studyFocus.value = studySettings.focus;
    els.studyShortBreak.value = studySettings.shortBreak;
    els.studyLongBreak.value = studySettings.longBreak;
    els.studySessions.value = studySettings.sessions;
    els.studyFlashcards.value = studySettings.flashcards;

    // AI
    els.aiEndpoint.value = aiSettings.endpoint;
}

function applyUITheme() {
    const body = document.body;
    body.setAttribute('data-theme', settings.appearance.theme);
    body.setAttribute('data-accent', settings.appearance.accent);
    
    // Body classes for toggles and dropdowns
    body.className = '';
    body.classList.add(`density-${settings.appearance.density}`);
    body.classList.add(`font-${settings.appearance.fontSize}`);
    if(settings.appearance.animations) body.classList.add('animations-on');
    if(settings.appearance.glow) body.classList.add('glow-on');
    if(settings.appearance.grid) body.classList.add('grid-on');
}


// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Accent Color Selection
    els.colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            els.colorSwatches.forEach(s => s.classList.remove('active'));
            e.target.classList.add('active');
            settings.appearance.accent = e.target.dataset.color;
            applyUITheme(); // Live preview
        });
    });

    // Sliders live text update
    els.voiceRate.addEventListener('input', (e) => els.rateVal.innerText = parseFloat(e.target.value).toFixed(1));
    els.voiceVol.addEventListener('input', (e) => els.volVal.innerText = parseFloat(e.target.value).toFixed(1));
    els.studyGoal.addEventListener('input', (e) => els.studyGoalVal.innerText = e.target.value);

    // Footer Buttons
    document.getElementById('btnSaveSettings').addEventListener('click', saveAllSettings);
    document.getElementById('btnRestoreDefaults').addEventListener('click', restoreDefaults);

    // Global Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            saveAllSettings();
        }
        if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            els.search.focus();
        }
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Mobile Sidebar
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    // Settings Search
    els.search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        els.cards.forEach(card => {
            const tags = card.dataset.search || '';
            const title = card.querySelector('h3').innerText.toLowerCase();
            if (tags.includes(query) || title.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Test Voice
    document.getElementById('btnTestVoice').addEventListener('click', () => {
        if (!window.speechSynthesis) {
            showToast("Speech synthesis not supported in this browser", "error");
            return;
        }
        const utterance = new SpeechSynthesisUtterance("Voice system is working correctly.");
        utterance.rate = parseFloat(els.voiceRate.value);
        utterance.volume = parseFloat(els.voiceVol.value);
        window.speechSynthesis.speak(utterance);
        showToast("Playing voice test...");
    });

    // Request Notifications
    document.getElementById('btnReqNotif').addEventListener('click', async () => {
        if (!("Notification" in window)) {
            showToast("Notifications not supported", "error");
            return;
        }
        const permission = await Notification.requestPermission();
        els.notifStatus.innerText = permission.charAt(0).toUpperCase() + permission.slice(1);
        if (permission === 'granted') showToast("Notifications enabled", "success");
    });

    // Test AI
    document.getElementById('btnTestAI').addEventListener('click', () => {
        if(els.aiEndpoint.value.trim() === '') {
            showToast("External AI is not connected. Local mode is active.", "warning");
        } else {
            showToast("Attempting to connect to AI proxy...", "success");
            // Dummy simulation
            setTimeout(() => { showToast("Connection failed: Endpoints must be verified backend routes.", "error"); }, 1500);
        }
    });

    // Data Management
    document.getElementById('btnExport').addEventListener('click', exportData);
    
    const fileImport = document.getElementById('fileImport');
    document.getElementById('btnImportTrigger').addEventListener('click', () => fileImport.click());
    fileImport.addEventListener('change', importData);

    document.getElementById('btnResetAll').addEventListener('click', () => requestClear('all'));

    // Modal Actions
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmAction);
}


// --- SYSTEM INFO & CLOCK ---

function initClock() {
    const timeDisplay = document.getElementById('currentTime');
    const dateDisplay = document.getElementById('currentDate');
    
    setInterval(() => {
        const now = new Date();
        const timeFmt = (settings.dashboard && settings.dashboard.timeFmt === '24') ? false : true;
        timeDisplay.innerText = now.toLocaleTimeString('en-US', { hour12: timeFmt });
        
        let dateStr = "";
        const dFmt = (settings.dashboard && settings.dashboard.dateFmt) ? settings.dashboard.dateFmt : "DD/MM/YYYY";
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        
        if(dFmt === "DD/MM/YYYY") dateStr = `${d}/${m}/${y}`;
        else if(dFmt === "MM/DD/YYYY") dateStr = `${m}/${d}/${y}`;
        else if(dFmt === "YYYY-MM-DD") dateStr = `${y}-${m}-${d}`;
        
        dateDisplay.innerText = dateStr;
    }, 1000);
}

function updateSystemInformation() {
    // Notifications
    if ("Notification" in window) {
        els.notifStatus.innerText = Notification.permission.charAt(0).toUpperCase() + Notification.permission.slice(1);
    } else {
        els.notifStatus.innerText = "Unavailable";
    }

    // Voice APIs
    document.getElementById('infoSpeech').innerText = window.speechSynthesis ? "Available" : "Unavailable";
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    document.getElementById('infoVoice').innerText = SpeechRecognition ? "Available" : "Unavailable";

    // Storage Calculation
    let totalLength = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('jarvis')) {
            totalLength += (localStorage[key].length + key.length) * 2; // UTF-16 approx
        }
    }
    const kb = (totalLength / 1024).toFixed(2);
    document.getElementById('infoStorage').innerText = `${kb} KB`;
}


// --- DATA MANAGEMENT ---

function exportData() {
    const exportObj = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('jarvis')) {
            try {
                exportObj[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
                exportObj[key] = localStorage.getItem(key);
            }
        }
    }
    
    exportObj.timestamp = new Date().toISOString();
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `jarvis-backup-${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast("JARVIS data exported successfully");
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.timestamp || Object.keys(data).length < 2) {
                throw new Error("Invalid format");
            }
            
            // Ask for confirmation before overwriting
            actionToConfirm = () => {
                for (let key in data) {
                    if (key.startsWith('jarvis')) {
                        localStorage.setItem(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
                    }
                }
                showToast("Data imported successfully. Reloading...");
                setTimeout(() => location.reload(), 1500);
            };
            
            document.getElementById('modalTitle').innerText = "IMPORT DATA?";
            document.getElementById('modalDesc').innerText = "This will overwrite current settings and data with the backup file.";
            document.getElementById('modalTitle').style.color = "var(--warning)";
            document.getElementById('confirmModal').classList.add('show');
            
        } catch (error) {
            showToast("Invalid JARVIS backup file", "error");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

// Data Clearing Logic
const clearMap = {
    'tasks': { key: 'jarvisTasks', name: 'Task' },
    'notes': { key: 'jarvisNotes', name: 'Notes' },
    'timetable': { key: 'jarvisTimetable', name: 'Timetable' },
    'flashcards': { key: 'jarvisFlashcards', name: 'Flashcard' },
    'conversations': { key: 'jarvisConversations', name: 'Conversation' }
};

function requestClear(type) {
    if (type === 'all') {
        document.getElementById('modalTitle').innerText = "SYSTEM RESET";
        document.getElementById('modalDesc').innerText = "This will permanently remove ALL locally stored application data and settings from this browser.";
        document.getElementById('modalTitle').style.color = "var(--danger)";
        
        actionToConfirm = () => {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).startsWith('jarvis')) {
                    keysToRemove.push(localStorage.key(i));
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            showToast("System Reset Complete. Reloading...", "success");
            setTimeout(() => location.reload(), 1500);
        };
    } else {
        const info = clearMap[type];
        document.getElementById('modalTitle').innerText = `CLEAR ${info.name.toUpperCase()} DATA?`;
        document.getElementById('modalDesc').innerText = `This will permanently remove locally stored ${info.name.toLowerCase()} data.`;
        document.getElementById('modalTitle').style.color = "var(--warning)";
        
        actionToConfirm = () => {
            localStorage.removeItem(info.key);
            showToast(`${info.name} data cleared`, "success");
            updateSystemInformation();
        };
    }
    
    document.getElementById('confirmModal').classList.add('show');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('show');
    actionToConfirm = null;
}

function confirmAction() {
    if (actionToConfirm) actionToConfirm();
    closeModal();
}


// --- UTILITIES ---

function showToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = "fa-check-circle";
    if (type === "error") icon = "fa-circle-xmark";
    if (type === "warning") icon = "fa-triangle-exclamation";
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(container.contains(toast)) container.removeChild(toast);
    }, 3000);
}