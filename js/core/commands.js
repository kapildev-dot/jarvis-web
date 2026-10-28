/**
 * KAPISH JARVIS - Voice Command Interpreter
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Commands = (function() {
    
    function processCommand(transcript) {
        const text = transcript.toLowerCase();
        console.log(`JARVIS Command Recognized: "${text}"`);

        const nav = window.JARVIS.Navigation;
        const synth = window.JARVIS.Synthesis;
        const notif = window.JARVIS.Notifications;

        // Navigation Commands
        if (text.includes("dashboard") || text.includes("home page")) {
            synth.speak("Opening Dashboard");
            nav.openDashboard();
            return;
        }
        if (text.includes("study") || text.includes("focus")) {
            synth.speak("Opening Study Zone");
            nav.openStudy();
            return;
        }
        if (text.includes("task") || text.includes("to-do")) {
            synth.speak("Opening Tasks");
            nav.openTasks();
            return;
        }
        if (text.includes("note")) {
            synth.speak("Opening Notes");
            nav.openNotes();
            return;
        }
        if (text.includes("time table") || text.includes("timetable") || text.includes("schedule")) {
            synth.speak("Opening Timetable");
            nav.openTimetable();
            return;
        }
        if (text.includes("flashcard") || text.includes("card")) {
            synth.speak("Opening Flashcards");
            nav.openFlashcards();
            return;
        }
        if (text.includes("setting") || text.includes("configuration")) {
            synth.speak("Opening Settings");
            nav.openSettings();
            return;
        }
        if (text.includes("ai assistant") || text.includes("chat") || text.includes("jarvis core")) {
            synth.speak("Opening AI Assistant");
            nav.openAIAssistant();
            return;
        }

        // Action Commands
        if (text.includes("hello") || text.includes("wake up") || text.includes("hi jarvis")) {
            const greeting = "Hello Kapish. All systems are online. How can I help you?";
            synth.speak(greeting);
            if(notif) notif.info(greeting);
            return;
        }
        
        if (text.includes("stop talking") || text.includes("quiet") || text.includes("mute")) {
            synth.stop();
            if(notif) notif.info("Voice synthesis muted.");
            return;
        }

        // Data Query Commands
        if (text.includes("pending task") || text.includes("how many tasks")) {
            if (window.JARVIS.Storage) {
                const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
                const pending = tasks.filter(t => !t.completed).length;
                const msg = pending > 0 ? `You have ${pending} pending tasks.` : "You have no pending tasks. Great job!";
                synth.speak(msg);
                if(notif) notif.info(msg);
            }
            return;
        }

        // Fallback for unhandled command
        if(notif) notif.info(`Recognized: "${transcript}"`);
    }

    return {
        processCommand
    };
})();