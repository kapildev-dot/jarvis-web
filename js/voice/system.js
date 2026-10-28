/**
 * KAPISH JARVIS - Core System Initialization
 * Ties all modules together and boots the environment.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.System = (function() {
    
    function initializeJARVIS() {
        console.log("=========================================");
        console.log("   KAPISH JARVIS CORE INITIALIZING...    ");
        console.log("=========================================");

        // 1. Init Navigation & Sidebar
        if (window.JARVIS.Navigation) window.JARVIS.Navigation.initialize();

        // 2. Init Voice UI (Builds the floating DOM widget automatically)
        if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.init();

        // 3. Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape: Stop Voice / Close Modals
            if (e.key === 'Escape') {
                if (window.JARVIS.Recognition && window.JARVIS.Recognition.isListening()) {
                    window.JARVIS.Recognition.stopListening();
                }
                if (window.JARVIS.Synthesis) window.JARVIS.Synthesis.stop();
            }

            // Ctrl + Shift + J: Toggle Voice Listening
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') {
                e.preventDefault();
                if (window.JARVIS.Recognition) {
                    if (window.JARVIS.Recognition.isListening()) {
                        window.JARVIS.Recognition.stopListening();
                    } else {
                        if (window.JARVIS.VoiceUI) {
                            // Ensure the panel is visible before starting
                            document.getElementById('jarvisVoicePanel').classList.add('active');
                        }
                        window.JARVIS.Recognition.startListening();
                    }
                }
            }
        });

        // 4. Attach Storage Sync Listeners
        window.addEventListener('jarvis:data-updated', (e) => {
            console.log(`[JARVIS Sync] Data updated for key: ${e.detail.key}`);
        });

        console.log("SYSTEM ONLINE. Awaiting commands.");
    }

    // Auto-boot if document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeJARVIS);
    } else {
        initializeJARVIS();
    }

    return { boot: initializeJARVIS };
})();