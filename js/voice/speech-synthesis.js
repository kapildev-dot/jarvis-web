/**
 * KAPISH JARVIS - Speech Synthesis Engine
 * Integrates directly with UI states.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Synthesis = (function() {
    const synth = window.speechSynthesis;

    function speak(text) {
        if (!synth) return;

        const settings = window.JARVIS.Storage ? 
            window.JARVIS.Storage.get('jarvisVoiceSettings', { enabled: true, responses: true, rate: 1.0, volume: 1.0 }) : 
            { enabled: true, responses: true, rate: 1.0, volume: 1.0 };

        if (!settings.enabled || !settings.responses) {
            // End UI state immediately if silent mode is on
            if(window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('idle');
            return;
        }

        const cleanText = text.replace(/[*_#`]/g, '').replace(/<[^>]*>?/gm, '');
        if (synth.speaking) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = settings.rate;
        utterance.volume = settings.volume;

        utterance.onstart = () => {
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('speaking');
        };

        utterance.onend = () => {
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('idle');
        };

        utterance.onerror = () => {
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('idle');
        };

        synth.speak(utterance);
    }

    function stopSpeaking() {
        if (synth && synth.speaking) {
            synth.cancel();
            if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.setState('idle');
        }
    }

    return { speak, stop: stopSpeaking };
})();