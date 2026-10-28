/**
 * KAPISH JARVIS - Speech Recognition Engine
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Recognition = (function() {
    let recognition = null;
    let isCurrentlyListening = false;

    function init() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isCurrentlyListening = true;
            window.dispatchEvent(new CustomEvent('jarvis:speech-start'));
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            window.dispatchEvent(new CustomEvent('jarvis:speech-result', { detail: { text: transcript } }));
            
            // Forward to command engine
            if (window.JARVIS.Commands) {
                window.JARVIS.Commands.processCommand(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.warn("JARVIS Speech Recognition Error:", event.error);
            window.dispatchEvent(new CustomEvent('jarvis:speech-error', { detail: { error: event.error } }));
            stopListening();
        };

        recognition.onend = () => {
            isCurrentlyListening = false;
            window.dispatchEvent(new CustomEvent('jarvis:speech-end'));
        };

        return true;
    }

    function setLanguage(langCode) {
        if (recognition) recognition.lang = langCode;
    }

    function startListening() {
        if (!recognition && !init()) {
            if (window.JARVIS.Notifications) window.JARVIS.Notifications.error("Speech recognition not supported in this browser.");
            return;
        }

        // Fetch user preferences
        if (window.JARVIS.Storage) {
            const vSettings = window.JARVIS.Storage.get(window.JARVIS.Storage.KEYS.VOICE_SETTINGS, { lang: 'en-IN', enabled: true });
            if (!vSettings.enabled) {
                if(window.JARVIS.Notifications) window.JARVIS.Notifications.warning("Voice assistant is disabled in Settings.");
                return;
            }
            setLanguage(vSettings.lang);
        }

        if (isCurrentlyListening) stopListening();
        
        try {
            recognition.start();
        } catch(e) { console.error(e); }
    }

    function stopListening() {
        if (recognition && isCurrentlyListening) {
            recognition.stop();
        }
    }

    return {
        init,
        startListening,
        stopListening,
        isListening: () => isCurrentlyListening,
        setLanguage
    };
})();