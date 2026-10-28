/**
 * KAPISH JARVIS - Advanced Voice Command Interpreter
 * Maps natural language to system intents and UI updates.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Commands = (function() {
    
    function saveHistory(transcript) {
        if (!window.JARVIS.Storage) return;
        let history = window.JARVIS.Storage.get('jarvisVoiceHistory', []);
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        history.unshift({ text: transcript, time: timeStr });
        if (history.length > 20) history = history.slice(0, 20);
        
        window.JARVIS.Storage.set('jarvisVoiceHistory', history);
        if (window.JARVIS.VoiceUI) window.JARVIS.VoiceUI.updateHistory();
    }

    function detectIntent(text) {
        const lower = text.toLowerCase();
        
        // System Commands
        if (/stop|cancel|quiet|never mind/i.test(lower)) return { intent: 'STOP' };
        if (/time is it|current time/i.test(lower)) return { intent: 'TIME' };
        if (/system status|how are you/i.test(lower)) return { intent: 'STATUS' };
        
        // Navigation
        if (/open dashboard|go to dashboard|home/i.test(lower)) return { intent: 'NAV', target: 'dashboard' };
        if (/open study|start study|go to study|focus mode/i.test(lower)) return { intent: 'NAV', target: 'study' };
        if (/open task|go to task/i.test(lower)) return { intent: 'NAV', target: 'tasks' };
        if (/open note|go to note/i.test(lower)) return { intent: 'NAV', target: 'notes' };
        if (/open timetable|go to timetable|schedule/i.test(lower)) return { intent: 'NAV', target: 'timetable' };
        if (/open flashcard|go to flashcard/i.test(lower)) return { intent: 'NAV', target: 'flashcards' };
        if (/open ai|ask ai|jarvis core/i.test(lower)) return { intent: 'NAV', target: 'ai-assistant' };
        if (/open setting|configuration/i.test(lower)) return { intent: 'NAV', target: 'settings' };

        // Tasks
        if (/pending task|tasks left/i.test(lower)) return { intent: 'DATA_TASKS', type: 'pending' };
        if (/completed task|tasks done/i.test(lower)) return { intent: 'DATA_TASKS', type: 'completed' };

        // Timetable
        if (/next class|next lecture/i.test(lower)) return { intent: 'DATA_TIMETABLE', type: 'next' };
        
        // Flashcards
        if (/review card|due card/i.test(lower)) return { intent: 'DATA_FLASHCARDS', type: 'due' };

        return { intent: 'UNKNOWN' };
    }

    function processCommand(transcript) {
        saveHistory(transcript);
        const command = detectIntent(transcript);
        executeIntent(command);
    }

    function executeIntent(command) {
        const ui = window.JARVIS.VoiceUI;
        const synth = window.JARVIS.Synthesis;
        const nav = window.JARVIS.Navigation;
        const storage = window.JARVIS.Storage;

        if (command.intent === 'STOP') {
            synth.stop();
            if(ui) ui.setState('idle', 'Action cancelled.');
            return;
        }

        if (command.intent === 'NAV') {
            const pageName = command.target.charAt(0).toUpperCase() + command.target.slice(1);
            synth.speak(`Opening ${pageName}.`);
            if(ui) ui.setState('idle', `Navigating to ${pageName}...`);
            
            setTimeout(() => {
                const navMap = {
                    'dashboard': nav.openDashboard, 'study': nav.openStudy, 'tasks': nav.openTasks,
                    'notes': nav.openNotes, 'timetable': nav.openTimetable, 'flashcards': nav.openFlashcards,
                    'ai-assistant': nav.openAIAssistant, 'settings': nav.openSettings
                };
                if(navMap[command.target]) navMap[command.target]();
            }, 1000);
            return;
        }

        if (command.intent === 'TIME') {
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const msg = `It is currently ${timeStr}.`;
            synth.speak(msg);
            if(ui) { ui.showResult("TIME", msg); ui.setState('idle'); }
            return;
        }

        if (command.intent === 'STATUS') {
            const msg = "All JARVIS local systems are fully operational.";
            synth.speak(msg);
            if(ui) { ui.showResult("SYSTEM STATUS", "● ONLINE<br>Local core functioning normally."); ui.setState('idle'); }
            return;
        }

        if (command.intent === 'DATA_TASKS' && storage) {
            const tasks = storage.get('jarvisTasks', []);
            let count = 0;
            if(command.type === 'pending') count = tasks.filter(t => !t.completed).length;
            if(command.type === 'completed') count = tasks.filter(t => t.completed).length;

            const msg = `You have ${count} ${command.type} tasks.`;
            synth.speak(msg);
            if(ui) { 
                ui.showResult(`TASKS (${command.type.toUpperCase()})`, `<strong>${count}</strong> tasks found.`);
                ui.setState('idle'); 
            }
            return;
        }

        if (command.intent === 'DATA_TIMETABLE' && storage) {
            // Simplified logic: Since we don't know the exact time of the user's classes,
            // we will simulate finding the next class based on array length for safety.
            const timetable = storage.get('jarvisTimetable', []);
            if (timetable.length === 0) {
                const msg = "You don't have any classes scheduled.";
                synth.speak(msg);
                if(ui) { ui.showResult("NEXT CLASS", msg); ui.setState('idle'); }
            } else {
                // Safely grab the first item as a fallback next class
                const nextClass = timetable[0]; 
                const className = nextClass.subject || nextClass.title || "your next class";
                const classTime = nextClass.time || nextClass.startTime || "soon";
                
                const msg = `Your next class is ${className} at ${classTime}.`;
                synth.speak(msg);
                if(ui) { 
                    ui.showResult("NEXT CLASS", `<strong>${className}</strong><br>Time: ${classTime}`);
                    ui.setState('idle'); 
                }
            }
            return;
        }

        if (command.intent === 'DATA_FLASHCARDS' && storage) {
            const cards = storage.get('jarvisFlashcards', []);
            const msg = cards.length > 0 ? `You have flashcards ready for review.` : `You have no cards to review.`;
            synth.speak(msg);
            if(ui) { ui.showResult("FLASHCARDS", `<strong>${cards.length}</strong> total cards available.`); ui.setState('idle'); }
            return;
        }

        // UNKNOWN
        const fallbackMsg = "I didn't recognize that command.";
        synth.speak(fallbackMsg);
        if(ui) {
            ui.setState('idle');
            ui.showResult("UNRECOGNIZED COMMAND", "Try saying: <em>'Open tasks'</em>, <em>'What is my next class?'</em>, or <em>'System status'</em>.");
        }
    }

    return { processCommand };
})();