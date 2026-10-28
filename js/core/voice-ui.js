/**
 * KAPISH JARVIS - Voice Interface System
 * Floating UI widget for voice control.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.VoiceUI = (function() {
    let widget, orb, panel, statusText, transcriptText, resultCard, resultTitle, resultContent, historyList;

    function init() {
        // Inject CSS safely
        if (!document.getElementById('jarvis-voice-css')) {
            const link = document.createElement('link');
            link.id = 'jarvis-voice-css';
            link.rel = 'stylesheet';
            // Adjust path based on current page location
            const isRoot = window.location.pathname.endsWith('index.html') || !window.location.pathname.includes('/pages/');
            link.href = isRoot ? 'css/core/voice.css' : '../css/core/voice.css';
            document.head.appendChild(link);
        }

        buildDOM();
        bindEvents();
        updateHistory();
    }

    function buildDOM() {
        if (document.getElementById('jarvis-voice-widget')) return;

        widget = document.createElement('div');
        widget.id = 'jarvis-voice-widget';
        widget.className = 'jarvis-voice-widget';

        widget.innerHTML = `
            <div class="jarvis-voice-panel" id="jarvisVoicePanel">
                <div class="voice-panel-header">
                    <span class="voice-panel-title">JARVIS CORE</span>
                    <span class="voice-privacy-badge"><i class="fa-solid fa-shield-halved"></i> LOCAL</span>
                </div>
                <div class="voice-panel-body">
                    <div>
                        <div class="voice-status-text" id="voiceStatusText" aria-live="polite">SYSTEM IDLE</div>
                        <div class="voice-transcript" id="voiceTranscript">Awaiting command...</div>
                    </div>
                    
                    <div class="voice-result-card" id="voiceResultCard">
                        <div class="result-card-title" id="voiceResultTitle">RESULT</div>
                        <div class="result-card-content" id="voiceResultContent">...</div>
                    </div>

                    <div class="voice-history-section">
                        <div class="voice-history-header">
                            <span>RECENT COMMANDS</span>
                            <button class="btn-clear-history" id="btnClearVoiceHistory">CLEAR</button>
                        </div>
                        <div class="voice-history-list" id="voiceHistoryList"></div>
                    </div>
                </div>
            </div>
            
            <button class="jarvis-voice-orb state-idle" id="jarvisVoiceOrb" aria-label="Activate JARVIS Voice Control">
                <div class="jarvis-orb-ring"></div>
                <i class="fa-solid fa-microphone"></i>
            </button>
        `;

        document.body.appendChild(widget);

        // Cache elements
        orb = document.getElementById('jarvisVoiceOrb');
        panel = document.getElementById('jarvisVoicePanel');
        statusText = document.getElementById('voiceStatusText');
        transcriptText = document.getElementById('voiceTranscript');
        resultCard = document.getElementById('voiceResultCard');
        resultTitle = document.getElementById('voiceResultTitle');
        resultContent = document.getElementById('voiceResultContent');
        historyList = document.getElementById('voiceHistoryList');
    }

    function bindEvents() {
        orb.addEventListener('click', () => {
            if (window.JARVIS.Recognition.isListening()) {
                window.JARVIS.Recognition.stopListening();
            } else {
                panel.classList.add('active');
                window.JARVIS.Recognition.startListening();
            }
        });

        document.getElementById('btnClearVoiceHistory').addEventListener('click', () => {
            window.JARVIS.Storage.set('jarvisVoiceHistory', []);
            updateHistory();
        });
    }

    function setState(state, text = '') {
        if (!orb) return;
        
        // Remove all states
        orb.classList.remove('state-idle', 'state-listening', 'state-processing', 'state-speaking', 'state-error');
        orb.classList.add(`state-${state}`);

        const statusMap = {
            'idle': 'SYSTEM IDLE',
            'listening': 'LISTENING...',
            'processing': 'PROCESSING COMMAND...',
            'speaking': 'JARVIS SPEAKING...',
            'error': 'SYSTEM ERROR'
        };

        statusText.innerText = statusMap[state] || statusMap['idle'];
        
        if (state === 'idle' && !text) {
            setTimeout(() => { if(orb.classList.contains('state-idle')) panel.classList.remove('active'); }, 3000);
        } else {
            panel.classList.add('active');
        }

        if (text) {
            transcriptText.innerText = text;
            if(state === 'listening') transcriptText.classList.add('interim');
            else transcriptText.classList.remove('interim');
        }
    }

    function showResult(title, content) {
        resultTitle.innerText = title;
        resultContent.innerHTML = content;
        resultCard.classList.add('active');
    }

    function hideResult() {
        resultCard.classList.remove('active');
    }

    function updateHistory() {
        if(!historyList) return;
        const history = window.JARVIS.Storage.get('jarvisVoiceHistory', []);
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<div style="font-size:11px; color:#555;">No recent commands.</div>';
            return;
        }

        history.slice(0, 5).forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `<span class="history-time">${cmd.time}</span> <span>"${cmd.text}"</span>`;
            historyList.appendChild(div);
        });
    }

    return { init, setState, showResult, hideResult, updateHistory };
})();