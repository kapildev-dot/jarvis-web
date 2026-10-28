/**
 * KAPISH JARVIS - Core Storage System
 * Manages all LocalStorage operations securely.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Storage = (function() {
    // Central Data Keys
    const KEYS = {
        SETTINGS: 'jarvisSettings',
        VOICE_SETTINGS: 'jarvisVoiceSettings',
        NOTIF_SETTINGS: 'jarvisNotificationSettings',
        STUDY_SETTINGS: 'jarvisStudySettings',
        AI_SETTINGS: 'jarvisAISettings',
        TASKS: 'jarvisTasks',
        NOTES: 'jarvisNotes',
        TIMETABLE: 'jarvisTimetable',
        FLASHCARD_DECKS: 'jarvisFlashcardDecks',
        FLASHCARDS: 'jarvisFlashcards',
        FLASHCARD_PROGRESS: 'jarvisFlashcardProgress',
        QUIZ_HISTORY: 'jarvisQuizHistory',
        CONVERSATIONS: 'jarvisConversations'
    };

    function storageGet(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (error) {
            console.warn(`JARVIS Storage: Failed to parse key "${key}". Returning fallback.`, error);
            return fallback;
        }
    }

    function storageSet(key, value) {
        try {
            const jsonValue = JSON.stringify(value);
            localStorage.setItem(key, jsonValue);
            
            // Dispatch a custom event so other scripts on the same page can react
            const event = new CustomEvent('jarvis:data-updated', { detail: { key, value } });
            window.dispatchEvent(event);
            
            return true;
        } catch (error) {
            console.error(`JARVIS Storage: Failed to save key "${key}".`, error);
            return false;
        }
    }

    function storageRemove(key) {
        localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent('jarvis:data-updated', { detail: { key, value: null } }));
    }

    function storageExists(key) {
        return localStorage.getItem(key) !== null;
    }

    function storageGetSize(key) {
        const item = localStorage.getItem(key);
        return item ? new Blob([item]).size : 0;
    }

    function getAllJARVISData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jarvis')) {
                data[key] = storageGet(key);
            }
        }
        return data;
    }

    function storageClearJARVIS() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('jarvis')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new CustomEvent('jarvis:data-cleared'));
    }

    // Sync across tabs natively
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('jarvis')) {
            window.dispatchEvent(new CustomEvent('jarvis:data-updated', { 
                detail: { key: e.key, value: storageGet(e.key) } 
            }));
        }
    });

    return {
        KEYS,
        get: storageGet,
        set: storageSet,
        remove: storageRemove,
        exists: storageExists,
        getSize: storageGetSize,
        getAllData: getAllJARVISData,
        clearAll: storageClearJARVIS
    };
})();