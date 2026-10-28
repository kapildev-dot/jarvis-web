/**
 * KAPISH JARVIS - AI Assistant Core Logic
 * Handles:
 * - Local UI
 * - Voice Recognition
 * - Speech Synthesis
 * - LocalStorage
 * - Local Commands
 * - Secure Backend AI Connection
 * - OpenAI powered responses through backend
 */

// =====================================================
// STATE & CONFIGURATION
// =====================================================

const AI_CONFIG = {
    enabled: true,
    // FIX: Using 127.0.0.1 to avoid Node.js v17+ IPv6 'localhost' mapping issues
    endpoint: 'http://127.0.0.1:3000/api/ai/chat',
    healthEndpoint: 'http://127.0.0.1:3000/api/health',
    model: 'gpt-5.6-luna'
};

let conversations = JSON.parse(localStorage.getItem('jarvisConversations')) || [];
let currentChatId = null;
let isProcessing = false;

// =====================================================
// VOICE STATE
// =====================================================

let voiceSettings = JSON.parse(localStorage.getItem('jarvisVoiceSettings')) || {
    enabled: true,
    rate: 1.0,
    volume: 1.0
};

let recognition = null;
let isListening = false;

// =====================================================
// DOM ELEMENTS
// =====================================================

const elements = {
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    aiCore: document.getElementById('aiCore'),
    coreStatus: document.getElementById('coreStatus'),
    typingIndicator: document.getElementById('typingIndicator'),
    historyList: document.getElementById('historyList'),
    newChatBtn: document.getElementById('newChatBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    toastContainer: document.getElementById('toastContainer'),
    voiceToggle: document.getElementById('voiceToggle'),
    speechRate: document.getElementById('speechRate'),
    speechVolume: document.getElementById('speechVolume'),
    liveTranscription: document.getElementById('liveTranscription'),
    transcriptionText: document.getElementById('transcriptionText'),
    aiConnectionStatus: document.getElementById('aiConnectionStatus')
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initDataSnapshots();
    initSpeechRecognition();
    loadVoiceSettings();

    if (conversations.length === 0) {
        createNewChat();
    } else {
        loadConversation(conversations[0].id);
        renderHistory();
    }

    updateConnectionStatus();
    setupEventListeners();

    // Check backend when page loads
    checkBackendConnection();
});

// =====================================================
// CONNECTION STATUS
// =====================================================

function updateConnectionStatus(online = true) {
    if (!elements.aiConnectionStatus) return;

    if (online) {
        elements.aiConnectionStatus.className = 'connection-status ai-mode';
        elements.aiConnectionStatus.innerText = 'ONLINE AI';
    } else {
        elements.aiConnectionStatus.className = 'connection-status local';
        elements.aiConnectionStatus.innerText = 'BACKEND OFFLINE';
    }
}

// =====================================================
// BACKEND CONNECTION CHECK
// =====================================================

async function checkBackendConnection() {
    try {
        const response = await fetch(AI_CONFIG.healthEndpoint, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Backend unavailable');
        }

        const data = await response.json();

        if (data.status === 'online') {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false);
        }
    } catch (error) {
        console.warn('JARVIS backend is not reachable:', error.message);
        updateConnectionStatus(false);
    }
}

// =====================================================
// CLOCK
// =====================================================

function initClock() {
    const timeDisplay = document.getElementById('currentTime');
    if (!timeDisplay) return;

    const updateClock = () => {
        const now = new Date();
        timeDisplay.innerText = now.toLocaleTimeString('en-US', { hour12: false });
    };

    updateClock();
    setInterval(updateClock, 1000);
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
    // Enter to send
    if (elements.chatInput) {
        elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserInput();
            }
        });
    }

    // Global shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            elements.chatInput?.focus();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            createNewChat();
        }
    });

    // Send button
    elements.sendBtn?.addEventListener('click', handleUserInput);

    // Voice button
    elements.voiceBtn?.addEventListener('click', toggleVoiceRecognition);

    // New chat
    elements.newChatBtn?.addEventListener('click', createNewChat);

    // Quick prompts
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            elements.chatInput.value = chip.innerText;
            handleUserInput();
        });
    });

    // Voice toggle
    elements.voiceToggle?.addEventListener('change', (e) => {
        voiceSettings.enabled = e.target.checked;
        saveVoiceSettings();
        showToast(`Voice response ${voiceSettings.enabled ? 'enabled' : 'disabled'}`);
    });

    // Speech rate
    elements.speechRate?.addEventListener('input', (e) => {
        voiceSettings.rate = parseFloat(e.target.value);
        const rateVal = document.getElementById('rateVal');
        if (rateVal) {
            rateVal.innerText = voiceSettings.rate.toFixed(1);
        }
        saveVoiceSettings();
    });

    // Speech volume
    elements.speechVolume?.addEventListener('input', (e) => {
        voiceSettings.volume = parseFloat(e.target.value);
        const volVal = document.getElementById('volVal');
        if (volVal) {
            volVal.innerText = voiceSettings.volume.toFixed(1);
        }
        saveVoiceSettings();
    });

    // Clear chat
    elements.clearChatBtn?.addEventListener('click', () => {
        const modal = document.getElementById('clearChatModal');
        modal?.classList.add('show');
    });

    document.getElementById('cancelClearBtn')?.addEventListener('click', () => {
        document.getElementById('clearChatModal')?.classList.remove('show');
    });

    document.getElementById('confirmClearBtn')?.addEventListener('click', () => {
        clearCurrentChat();
        document.getElementById('clearChatModal')?.classList.remove('show');
    });

    // Mobile sidebar
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Notifications
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
        document.getElementById('notificationDropdown')?.classList.toggle('show');
    });
}

// =====================================================
// CHAT LOGIC
// =====================================================

function handleUserInput() {
    const text = elements.chatInput.value.trim();
    if (!text || isProcessing) return;

    elements.chatInput.value = '';
    elements.chatInput.style.height = 'auto';

    // Show user message
    appendMessage('user', text);
    saveMessageToCurrentChat('user', text);

    // Processing state
    setAIState('processing');
    isProcessing = true;

    if (elements.sendBtn) {
        elements.sendBtn.disabled = true;
    }

    // Small natural delay
    setTimeout(() => {
        processCommand(text);
    }, 400);
}

// =====================================================
// COMMAND PROCESSOR
// =====================================================

function processCommand(input) {
    const lowerInput = input.toLowerCase();

    // 1. Navigation
    if (detectNavigation(lowerInput)) {
        return;
    }

    // 2. Local commands
    const localResponse = detectLocalIntent(lowerInput);
    if (localResponse) {
        finalizeAIResponse(localResponse);
        return;
    }

    // 3. Send everything else to OpenAI backend
    sendToAIProvider(input);
}

// =====================================================
// NAVIGATION COMMANDS
// =====================================================

function detectNavigation(input) {
    const navMap = {
        'dashboard': 'dashboard.html',
        'study': 'study.html',
        'tasks': 'tasks.html',
        'timetable': 'timetable.html',
        'notes': 'notes.html',
        'flashcards': 'flashcards.html',
        'settings': '#'
    };

    if (input.includes('open ') || input.includes('go to ')) {
        for (const [key, url] of Object.entries(navMap)) {
            if (input.includes(key)) {
                finalizeAIResponse(`Navigating to ${key.charAt(0).toUpperCase() + key.slice(1)}...`);
                
                if (url !== '#') {
                    setTimeout(() => {
                        window.location.href = url;
                    }, 1000);
                }
                return true;
            }
        }
    }
    return false;
}

// =====================================================
// LOCAL INTENT
// =====================================================

function detectLocalIntent(input) {
    // Tasks
    if (input.includes('task') || input.includes('pending work')) {
        return getPendingTasksText();
    }

    // Timetable
    if (input.includes('class') || input.includes('schedule') || input.includes('timetable')) {
        return getNextClassText();
    }

    // Notes
    if (input.includes('notes')) {
        return getNotesText();
    }

    // Focus
    if (input.includes('focus') || input.includes('pomodoro')) {
        return "Starting a 25-minute focus session. I recommend navigating to the Study Zone to track your progress.";
    }

    // Greetings
    if (input.match(/^(hello|hi|hey|wake up)\b/)) {
        return "Hello, Kapish. All local systems are online. How can I assist you today?";
    }

    // Status
    if (input.includes('status')) {
        return "SYSTEM STATUS:\n- Local Core: ONLINE\n- External AI: CONNECTED\n- OpenAI Backend: ACTIVE\n- Data sync: ACTIVE";
    }

    return null;
}

// =====================================================
// LOCAL DATA - TASKS
// =====================================================

function getPendingTasksText() {
    const tasks = JSON.parse(localStorage.getItem('jarvisTasks')) || [];
    const pending = tasks.filter(t => !t.completed);

    if (pending.length === 0) {
        return "You have no pending tasks. Great job!";
    }

    let text = `You have **${pending.length} pending tasks**:\n`;
    pending.slice(0, 5).forEach(t => {
        text += `- ${t.title || 'Untitled Task'}\n`;
    });

    if (pending.length > 5) {
        text += `- *...and ${pending.length - 5} more.*`;
    }

    return text;
}

// =====================================================
// LOCAL DATA - TIMETABLE
// =====================================================

function getNextClassText() {
    const timetable = JSON.parse(localStorage.getItem('jarvisTimetable')) || [];
    if (timetable.length === 0) {
        return "I don't have any saved timetable data for today yet.";
    }
    return "Based on your schedule, your next class is **DBMS** at **10:55 AM**.";
}

// =====================================================
// LOCAL DATA - NOTES
// =====================================================

function getNotesText() {
    const notes = JSON.parse(localStorage.getItem('jarvisNotes')) || [];
    if (notes.length === 0) {
        return "You haven't saved any notes yet.";
    }
    return `You have a total of **${notes.length} notes** saved in your repository. Use the Study Zone to review them.`;
}

// =====================================================
// DATA SNAPSHOTS
// =====================================================

function initDataSnapshots() {
    const tasks = JSON.parse(localStorage.getItem('jarvisTasks')) || [];
    const notes = JSON.parse(localStorage.getItem('jarvisNotes')) || [];

    const snapTasks = document.getElementById('snapTasks');
    const snapNotes = document.getElementById('snapNotes');

    if (snapTasks) {
        snapTasks.innerText = tasks.filter(t => !t.completed).length || '--';
    }

    if (snapNotes) {
        snapNotes.innerText = notes.length || '--';
    }

    // Existing dashboard snapshot values
    const snapClasses = document.getElementById('snapClasses');
    const snapStudy = document.getElementById('snapStudy');
    const snapCards = document.getElementById('snapCards');

    if (snapClasses) snapClasses.innerText = '3';
    if (snapStudy) snapStudy.innerText = '90';
    if (snapCards) snapCards.innerText = '17';

    const focusNextClass = document.getElementById('focusNextClass');
    const focusPriorityTask = document.getElementById('focusPriorityTask');

    if (focusNextClass) {
        focusNextClass.innerText = 'DBMS – 10:55 AM';
    }

    if (focusPriorityTask) {
        focusPriorityTask.innerText = tasks.length > 0 ? tasks[0].title : 'Complete DBMS Notes';
    }
}

// =====================================================
// OPENAI BACKEND
// =====================================================

async function sendToAIProvider(text) {
    try {
        setAIState('processing');
        let response;
        
        // 1. Attempt Network Request
        try {
            response = await fetch(AI_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    context: {
                        source: 'KAPISH JARVIS',
                        page: 'AI Assistant'
                    }
                })
            });
        } catch (networkError) {
            console.error('KAPISH JARVIS Network Error:', networkError);
            updateConnectionStatus(false);
            finalizeAIResponse(
                "JARVIS backend is unreachable.\n\n" +
                "Please make sure the backend is running on http://127.0.0.1:3000."
            );
            return;
        }

        // 2. Parse Backend JSON
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Invalid JSON from backend:', jsonError);
            updateConnectionStatus(true); // Technically backend is alive but returned bad format
            finalizeAIResponse("Invalid response received from backend.");
            return;
        }

        // 3. Handle Backend Logic or OpenAI Error Responses
        if (!response.ok || !data.success) {
            updateConnectionStatus(true);
            finalizeAIResponse(data.reply || data.error || 'AI request failed.');
            return;
        }

        // 4. Successful Response
        updateConnectionStatus(true);
        finalizeAIResponse(data.reply || 'I received an empty response from OpenAI.');

    } catch (error) {
        // Fallback for completely unexpected JS issues inside the function
        console.error('Unexpected KAPISH JARVIS AI Error:', error);
        updateConnectionStatus(false);
        finalizeAIResponse("An unexpected internal error occurred.");
    }
}

// =====================================================
// OUTPUT / RESPONSE
// =====================================================

function finalizeAIResponse(text) {
    isProcessing = false;

    if (elements.sendBtn) {
        elements.sendBtn.disabled = false;
    }

    appendMessage('assistant', text);
    saveMessageToCurrentChat('assistant', text);

    if (voiceSettings.enabled) {
        speakResponse(text);
    } else {
        setAIState('idle');
    }
}

// =====================================================
// MESSAGE RENDERING
// =====================================================

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message msg-${role === 'user' ? 'user' : 'bot'}`;

    const label = role === 'user' ? 'USER' : 'JARVIS';
    const formattedContent = formatAIResponse(content);

    let actionButtons = '';
    if (role === 'assistant') {
        actionButtons = `
            <div class="msg-actions">
                <button
                    class="msg-action-btn"
                    onclick="copyText(this)"
                    data-text="${encodeURIComponent(content)}"
                >
                    <i class="fa-regular fa-copy"></i>
                    Copy
                </button>
                <button
                    class="msg-action-btn"
                    onclick="triggerSpeak(this)"
                    data-text="${encodeURIComponent(content)}"
                >
                    <i class="fa-solid fa-volume-high"></i>
                    Speak
                </button>
            </div>
        `;
    }

    msgDiv.innerHTML = `
        <div class="msg-label">${label}</div>
        <div class="msg-bubble">${formattedContent}</div>
        ${actionButtons}
    `;

    elements.chatMessages.appendChild(msgDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// =====================================================
// RESPONSE FORMATTER
// =====================================================

function formatAIResponse(text) {
    if (!text) return '';

    // Escape HTML first to prevent injection
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Bullet points
    html = html.replace(/\n- (.*?)(?=\n|$)/g, '<br>• $1');
    
    // Numbered lists
    html = html.replace(/\n(\d+)\. (.*?)(?=\n|$)/g, '<br>$1. $2');
    
    // New lines
    html = html.replace(/\n/g, '<br>');

    return html;
}

// =====================================================
// AI CORE STATE
// =====================================================

function setAIState(state) {
    if (elements.aiCore) {
        elements.aiCore.className = `ai-core-container ai-${state}`;
    }

    const statusMap = {
        idle: 'AI CORE ONLINE<br>READY FOR COMMAND',
        listening: 'LISTENING...',
        processing: 'PROCESSING...',
        speaking: 'SPEAKING...'
    };

    if (elements.coreStatus) {
        elements.coreStatus.innerHTML = statusMap[state] || statusMap.idle;
    }

    if (elements.typingIndicator) {
        if (state === 'processing') {
            elements.typingIndicator.classList.remove('hidden');
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        } else {
            elements.typingIndicator.classList.add('hidden');
        }
    }
}

// =====================================================
// VOICE RECOGNITION
// =====================================================

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Speech recognition is not supported.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
        isListening = true;
        elements.voiceBtn?.classList.add('recording');
        elements.liveTranscription?.classList.remove('hidden');
        setAIState('listening');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (elements.transcriptionText) {
            elements.transcriptionText.innerText = finalTranscript || interimTranscript;
        }

        if (finalTranscript) {
            elements.chatInput.value = finalTranscript;
            elements.liveTranscription?.classList.add('hidden');
            handleUserInput();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopVoiceRecognition();
        showToast('Voice recognition failed.');
    };

    recognition.onend = () => {
        if (isListening) {
            stopVoiceRecognition();
        }
    };
}

// =====================================================
// VOICE CONTROL
// =====================================================

function toggleVoiceRecognition() {
    if (!recognition) {
        showToast('Voice recognition is not supported in this browser.');
        return;
    }

    if (isListening) {
        stopVoiceRecognition();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error(error);
        }
    }
}

function stopVoiceRecognition() {
    isListening = false;

    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            // Recognition already stopped
        }
    }

    elements.voiceBtn?.classList.remove('recording');
    elements.liveTranscription?.classList.add('hidden');

    if (!isProcessing) {
        setAIState('idle');
    }
}

// =====================================================
// SPEECH SYNTHESIS
// =====================================================

function speakResponse(text) {
    if (!window.speechSynthesis) {
        setAIState('idle');
        return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
        .replace(/[*_#`]/g, '')
        .replace(/<[^>]*>?/gm, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceSettings.rate;
    utterance.volume = voiceSettings.volume;

    utterance.onstart = () => {
        setAIState('speaking');
    };

    utterance.onend = () => {
        setAIState('idle');
    };

    utterance.onerror = () => {
        setAIState('idle');
    };

    window.speechSynthesis.speak(utterance);
}

// =====================================================
// MESSAGE ACTIONS
// =====================================================

window.triggerSpeak = function(btn) {
    const text = decodeURIComponent(btn.getAttribute('data-text'));
    speakResponse(text);
};

window.copyText = function(btn) {
    const text = decodeURIComponent(btn.getAttribute('data-text'));

    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Message copied to clipboard');
        })
        .catch(() => {
            showToast('Could not copy message');
        });
};

// =====================================================
// VOICE SETTINGS
// =====================================================

function saveVoiceSettings() {
    localStorage.setItem('jarvisVoiceSettings', JSON.stringify(voiceSettings));
}

function loadVoiceSettings() {
    if (elements.voiceToggle) {
        elements.voiceToggle.checked = voiceSettings.enabled;
    }
    if (elements.speechRate) {
        elements.speechRate.value = voiceSettings.rate;
    }
    if (elements.speechVolume) {
        elements.speechVolume.value = voiceSettings.volume;
    }

    const rateVal = document.getElementById('rateVal');
    const volVal = document.getElementById('volVal');

    if (rateVal) {
        rateVal.innerText = voiceSettings.rate.toFixed(1);
    }
    if (volVal) {
        volVal.innerText = voiceSettings.volume.toFixed(1);
    }
}

// =====================================================
// CONVERSATION HISTORY
// =====================================================

function createNewChat() {
    const newChat = {
        id: Date.now(),
        title: 'New Conversation',
        createdAt: new Date().toISOString().split('T')[0],
        messages: []
    };

    conversations.unshift(newChat);
    saveConversations();
    currentChatId = newChat.id;

    elements.chatMessages.innerHTML = '';
    renderHistory();

    const welcome = "Hello Kapish.\nI'm ready.\n\nYou can ask me about your studies, programming, current information, tasks, timetable, notes or flashcards.";
    
    appendMessage('assistant', welcome);
    saveMessageToCurrentChat('assistant', welcome);
    showToast('New chat created');
}

// =====================================================
// LOAD CONVERSATION
// =====================================================

function loadConversation(id) {
    currentChatId = id;
    const chat = conversations.find(c => c.id === id);
    if (!chat) return;

    elements.chatMessages.innerHTML = '';
    chat.messages.forEach(msg => {
        appendMessage(msg.role, msg.content);
    });

    document.querySelectorAll('.history-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.id) === id) {
            item.classList.add('active');
        }
    });
}

// =====================================================
// SAVE MESSAGE
// =====================================================

function saveMessageToCurrentChat(role, content) {
    const chat = conversations.find(c => c.id === currentChatId);
    if (!chat) return;

    chat.messages.push({ role, content });

    // Auto title
    if (chat.messages.length === 2 && role === 'user') {
        chat.title = content.substring(0, 20) + (content.length > 20 ? '...' : '');
        renderHistory();
    }

    saveConversations();
}

// =====================================================
// SAVE CONVERSATIONS
// =====================================================

function saveConversations() {
    // Keep last 10 chats
    if (conversations.length > 10) {
        conversations = conversations.slice(0, 10);
    }
    localStorage.setItem('jarvisConversations', JSON.stringify(conversations));
}

// =====================================================
// RENDER HISTORY
// =====================================================

function renderHistory() {
    if (!elements.historyList) return;

    elements.historyList.innerHTML = '';
    conversations.forEach(chat => {
        const div = document.createElement('div');
        div.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        div.dataset.id = chat.id;
        div.innerHTML = `
            <div>${escapeHTML(chat.title)}</div>
            <span class="history-date">${chat.createdAt}</span>
        `;

        div.addEventListener('click', () => {
            loadConversation(chat.id);
        });

        elements.historyList.appendChild(div);
    });
}

// =====================================================
// CLEAR CHAT
// =====================================================

function clearCurrentChat() {
    conversations = conversations.filter(c => c.id !== currentChatId);
    saveConversations();

    if (conversations.length > 0) {
        loadConversation(conversations[0].id);
        renderHistory();
    } else {
        createNewChat();
    }

    showToast('Conversation cleared');
}

// =====================================================
// UTILITIES
// =====================================================

function showToast(message) {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${escapeHTML(message)}`;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        if (elements.toastContainer.contains(toast)) {
            elements.toastContainer.removeChild(toast);
        }
    }, 3000);
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// =====================================================
// TEXTAREA AUTO RESIZE
// =====================================================

if (elements.chatInput) {
    elements.chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 120 ? this.scrollHeight : 120) + 'px';
    });
}