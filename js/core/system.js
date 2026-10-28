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
        if (window.JARVIS.Navigation) {
            window.JARVIS.Navigation.initialize();
        }

        // 2. Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus Search / Settings shortcut
            if (e.ctrlKey && e.key.toLowerCase() === 'k') {
                const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"]');
                if (searchInputs.length > 0) {
                    e.preventDefault();
                    searchInputs[0].focus();
                }
            }
            
            // Global voice listening shortcut (Ctrl + Shift + V)
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                if (window.JARVIS.Recognition) {
                    if (window.JARVIS.Recognition.isListening()) {
                        window.JARVIS.Recognition.stopListening();
                    } else {
                        window.JARVIS.Recognition.startListening();
                    }
                }
            }
        });

        // 3. Attach Storage Sync Listeners
        // This allows independent page scripts to react when Core Storage changes
        window.addEventListener('jarvis:data-updated', (e) => {
            console.log(`[JARVIS Sync] Data updated for key: ${e.detail.key}`);
            // Individual pages can hook into this event to re-render UI natively
        });

        console.log("SYSTEM ONLINE. Awaiting commands.");
    }

    function getJARVISStatus() {
        const hasStorage = typeof(Storage) !== "undefined";
        const hasRecog = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
        const hasSynth = !!window.speechSynthesis;
        const notifStatus = ("Notification" in window) ? Notification.permission : "unsupported";

        const isFullyOnline = hasStorage && hasRecog && hasSynth;

        return {
            online: isFullyOnline,
            statusText: isFullyOnline ? "SYSTEM ONLINE" : "SYSTEM DEGRADED",
            features: {
                storage: hasStorage,
                speechRecognition: hasRecog,
                speechSynthesis: hasSynth,
                notifications: notifStatus
            }
        };
    }

    // Auto-boot if document is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeJARVIS);
    } else {
        initializeJARVIS();
    }

    return {
        boot: initializeJARVIS,
        getStatus: getJARVISStatus
    };
})();