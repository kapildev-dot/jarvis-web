/**
 * KAPISH JARVIS - Speech Recognition Engine
 * Handles microphone input, permissions, and timeout logic safely.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Recognition = (function() {
    let recognition = null;
    let isCurrentlyListening = false;
    let timeoutTimer = null;

    function init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true; // Enabled for live UI

        recognition.onstart = () => {
            isCurrentlyListening = true;
            if(window.JARVIS.VoiceUI) {
                window.JARVIS.VoiceUI.setState('listening', 'Awaiting command...');
                window.JARVIS.VoiceUI.hideResult();
            }
            resetTimeout();
        };

        recognition.onresult = (event) => {
            resetTimeout(); // Keep alive while talking
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (interim && window.JARVIS.VoiceUI) {
                window.JARVIS.VoiceUI.setState('listening', `"${interim}"`);
            }

            if (final) {
                clearTimeout(timeoutTimer);
                if(window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('processing', `"${final}"`);
                
                // Route to command engine
                if (window.JARVIS.Commands) {
                    setTimeout(() => window.JARVIS.Commands.processCommand(final.trim()), 300);
                }
            }
        };

        recognition.onerror = (event) => {
            clearTimeout(timeoutTimer);
            console.warn("JARVIS Speech Error:", event.error);
            
            let errMsg = "Voice recognition error.";
            if (event.error === 'not-allowed') errMsg = "Microphone permission denied.";
            if (event.error === 'no-speech') errMsg = "I didn't hear anything.";
            
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('error', errMsg);
            if (window.JARVIS.Notifications) window.JARVIS.Notifications.error(errMsg);
            stopListening();
        };

        recognition.onend = () => {
            clearTimeout(timeoutTimer);
            isCurrentlyListening = false;
            // If it ends without processing a command, return to idle
            if (window.JARVIS.VoiceUI) {
                const currentText = document.getElementById('voiceStatusText').innerText;
                if(currentText === 'LISTENING...') {
                    window.JARVIS.VoiceUI.setState('idle', 'Listening stopped.');
                }
            }
        };

        return true;
    }

    function resetTimeout() {
        clearTimeout(timeoutTimer);
        // Automatically stop if silence for 6 seconds
        timeoutTimer = setTimeout(() => {
            if (isCurrentlyListening) stopListening();
        }, 6000);
    }

    function startListening() {
        if (!recognition && !init()) {
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('error', "Unsupported Browser.");
            if (window.JARVIS.Notifications) window.JARVIS.Notifications.error("Speech recognition not supported in this browser.");
            return;
        }

        const vSettings = window.JARVIS.Storage ? window.JARVIS.Storage.get('jarvisVoiceSettings', { lang: 'en-IN', enabled: true }) : {enabled:true, lang:'en-IN'};
        
        if (!vSettings.enabled) {
            if(window.JARVIS.Notifications) window.JARVIS.Notifications.warning("Voice assistant is disabled in Settings.");
            return;
        }

        recognition.lang = vSettings.lang;
        if (isCurrentlyListening) stopListening();
        
        try { recognition.start(); } 
        catch(e) { console.error(e); }
    }

    function stopListening() {
        clearTimeout(timeoutTimer);
        if (recognition && isCurrentlyListening) recognition.stop();
    }

    return {
        startListening,
        stopListening,
        isListening: () => isCurrentlyListening
    };
})();