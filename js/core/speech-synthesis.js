/**
 * KAPISH JARVIS - Speech Synthesis Engine
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Synthesis = (function() {
    const synth = window.speechSynthesis;

    function getSettings() {
        if (window.JARVIS.Storage) {
            return window.JARVIS.Storage.get(window.JARVIS.Storage.KEYS.VOICE_SETTINGS, { 
                enabled: true, responses: true, rate: 1.0, volume: 1.0 
            });
        }
        return { enabled: true, responses: true, rate: 1.0, volume: 1.0 };
    }

    function speak(text) {
        if (!synth) {
            console.warn("JARVIS: Speech synthesis not supported.");
            return;
        }

        const settings = getSettings();
        if (!settings.enabled || !settings.responses) return;

        // Clean text formatting
        const cleanText = text.replace(/[*_#`]/g, '').replace(/<[^>]*>?/gm, '');

        // Cancel current speech before starting new
        if (synth.speaking) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = settings.rate;
        utterance.volume = settings.volume;

        synth.speak(utterance);
    }

    function stopSpeaking() {
        if (synth && synth.speaking) synth.cancel();
    }

    function pauseSpeaking() {
        if (synth && synth.speaking) synth.pause();
    }

    function resumeSpeaking() {
        if (synth && synth.paused) synth.resume();
    }

    function getAvailableVoices() {
        return synth ? synth.getVoices() : [];
    }

    return {
        speak,
        stop: stopSpeaking,
        pause: pauseSpeaking,
        resume: resumeSpeaking,
        getVoices: getAvailableVoices
    };
})();