document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. DATE, TIME & GREETING
       ========================================================================== */
    const updateDateTime = () => {
        const now = new Date();
        const hour = now.getHours();
        let greeting = "GOOD EVENING";
        if (hour >= 5 && hour < 12) greeting = "GOOD MORNING";
        else if (hour >= 12 && hour < 18) greeting = "GOOD AFTERNOON";
        
        const greetingEl = document.getElementById('greeting-text');
        if (greetingEl) greetingEl.textContent = `${greeting}, KAPISH`;

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateEl = document.getElementById('date-display');
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', options);
    };
    updateDateTime();
    setInterval(updateDateTime, 60000);

    /* ==========================================================================
       2. MOBILE SIDEBAR & NOTIFICATIONS
       ========================================================================== */
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    };

    if(mobileBtn) mobileBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => { if(window.innerWidth <= 768) toggleSidebar(); });
    });

    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
        });
    }
    document.addEventListener('click', (e) => {
        if (notifDropdown && notifDropdown.classList.contains('show') && !e.target.closest('.notification-wrapper')) {
            notifDropdown.classList.remove('show');
        }
    });

    /* ==========================================================================
       3. DATA MANAGEMENT (LocalStorage)
       ========================================================================== */
    
    // Default Subjects Data
    const defaultSubjects = [
        { id: 1, name: "Web Programming", totalTopics: 20, completedTopics: 12, icon: "fa-code", color: "var(--accent-1)" },
        { id: 2, name: "DBMS", totalTopics: 25, completedTopics: 17, icon: "fa-database", color: "var(--primary-cyan)" },
        { id: 3, name: "Python", totalTopics: 30, completedTopics: 15, icon: "fa-brands fa-python", color: "var(--accent-4)" },
        { id: 4, name: "Advanced Networks", totalTopics: 15, completedTopics: 3, icon: "fa-network-wired", color: "var(--accent-2)" },
        { id: 5, name: "PL/SQL", totalTopics: 18, completedTopics: 9, icon: "fa-server", color: "var(--accent-3)" },
        { id: 6, name: "Artificial Intelligence", totalTopics: 22, completedTopics: 5, icon: "fa-brain", color: "var(--primary-purple)" }
    ];

    // Default Study Stats
    const defaultStats = {
        goalMins: 240, // 4 hours
        completedMins: 150, // 2.5 hours
        sessions: 5,
        streak: 7
    };

    // Default Activity
    const defaultActivity = [
        { time: "Today", desc: "Completed <span>DBMS — Transactions</span>" },
        { time: "Today", desc: "Completed <span>Python — Functions</span>" },
        { time: "Yesterday", desc: "Completed <span>Web Programming — CSS</span>" }
    ];

    let subjects = JSON.parse(localStorage.getItem('kapish_subjects')) || defaultSubjects;
    let studyStats = JSON.parse(localStorage.getItem('kapish_study_stats')) || defaultStats;
    let activityLog = JSON.parse(localStorage.getItem('kapish_activity')) || defaultActivity;
    let currentSubjectContext = null;

    const saveData = () => {
        localStorage.setItem('kapish_subjects', JSON.stringify(subjects));
        localStorage.setItem('kapish_study_stats', JSON.stringify(studyStats));
        localStorage.setItem('kapish_activity', JSON.stringify(activityLog));
    };

    /* ==========================================================================
       4. RENDER UI COMPONENTS
       ========================================================================== */
    
    // Render Subjects
    const renderSubjects = () => {
        const container = document.getElementById('subjects-container');
        if (!container) return;
        container.innerHTML = '';

        subjects.forEach(sub => {
            const progress = Math.round((sub.completedTopics / sub.totalTopics) * 100) || 0;
            
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.innerHTML = `
                <div class="subject-top">
                    <div class="sub-icon" style="background: ${sub.color}20; color: ${sub.color};">
                        <i class="fas ${sub.icon}"></i>
                    </div>
                    <span class="sub-name">${sub.name}</span>
                </div>
                <div class="subject-progress">
                    <div class="prog-info">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="prog-bar-bg">
                        <div class="prog-bar-fill" style="width: ${progress}%; background: ${sub.color};"></div>
                    </div>
                    <span class="topic-count">${sub.completedTopics} / ${sub.totalTopics} completed</span>
                </div>
                <button class="btn-study" data-id="${sub.id}">STUDY</button>
            `;
            container.appendChild(card);
        });

        // Attach click events to study buttons
        document.querySelectorAll('.btn-study').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                openSubjectDetails(id);
            });
        });
    };

    // Render Study Stats
    const renderStats = () => {
        // Update top cards
        document.getElementById('stat-goal').textContent = `${(studyStats.goalMins / 60).toFixed(1).replace('.0','')} Hours`;
        document.getElementById('stat-completed').textContent = `${(studyStats.completedMins / 60).toFixed(1).replace('.0','')} Hours`;
        document.getElementById('stat-sessions').textContent = studyStats.sessions;
        document.getElementById('stat-streak').textContent = `${studyStats.streak} Days`;

        // Update Goal Card details
        const goalHoursText = (studyStats.goalMins / 60).toFixed(1).replace('.0','');
        const compHoursText = (studyStats.completedMins / 60).toFixed(1).replace('.0','');
        document.getElementById('goal-target').textContent = goalHoursText;
        document.getElementById('goal-done').textContent = compHoursText;
        
        // Update Circular Progress
        let percentage = Math.round((studyStats.completedMins / studyStats.goalMins) * 100);
        if (percentage > 100) percentage = 100;
        document.getElementById('goal-percentage').textContent = `${percentage}%`;
        
        const circle = document.getElementById('goal-progress-circle');
        if (circle) {
            circle.style.background = `conic-gradient(var(--primary-cyan) ${percentage}%, rgba(255,255,255,0.05) 0)`;
        }
    };

    // Render Activity
    const renderActivity = () => {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;
        container.innerHTML = '';
        
        // Show only last 4
        const displayLog = activityLog.slice(0, 4);
        displayLog.forEach(item => {
            const el = document.createElement('div');
            el.className = 'timeline-item';
            el.innerHTML = `
                <span class="timeline-time">${item.time}</span>
                <p class="timeline-text">${item.desc}</p>
            `;
            container.appendChild(el);
        });
    };

    /* ==========================================================================
       5. SUBJECT INTERACTION (Modals & Logic)
       ========================================================================== */
    const addSubjectModal = document.getElementById('add-subject-modal');
    const detailsModal = document.getElementById('subject-details-modal');

    // Add Subject flow
    document.getElementById('btn-add-subject')?.addEventListener('click', () => {
        addSubjectModal.classList.add('active');
    });
    const closeAddSubject = () => {
        addSubjectModal.classList.remove('active');
        document.getElementById('add-subject-form').reset();
    };
    document.getElementById('close-add-modal')?.addEventListener('click', closeAddSubject);
    document.getElementById('cancel-add-modal')?.addEventListener('click', closeAddSubject);

    document.getElementById('add-subject-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value;
        const total = parseInt(document.getElementById('subject-topics').value);
        
        const newSub = {
            id: Date.now(),
            name: name,
            totalTopics: total,
            completedTopics: 0,
            icon: "fa-book",
            color: "var(--primary-cyan)"
        };
        
        subjects.push(newSub);
        saveData();
        renderSubjects();
        closeAddSubject();
    });

    // Subject Details Flow
    const openSubjectDetails = (id) => {
        const sub = subjects.find(s => s.id === id);
        if (!sub) return;
        
        currentSubjectContext = sub;
        
        document.getElementById('detail-subject-name').textContent = sub.name;
        const progress = Math.round((sub.completedTopics / sub.totalTopics) * 100) || 0;
        document.getElementById('detail-subject-progress').textContent = `${progress}%`;
        
        // Generate topics checklist
        const list = document.getElementById('detail-topics-list');
        list.innerHTML = '';
        
        for (let i = 1; i <= sub.totalTopics; i++) {
            const isChecked = i <= sub.completedTopics;
            const item = document.createElement('label');
            item.className = 'topic-item';
            item.innerHTML = `
                <input type="checkbox" class="custom-checkbox" data-index="${i}" ${isChecked ? 'checked' : ''}>
                <span class="topic-name">Topic ${i} — ${sub.name} Module</span>
            `;
            list.appendChild(item);
        }

        // Attach listener for checkboxes
        list.querySelectorAll('input').forEach(box => {
            box.addEventListener('change', () => {
                // Count checked boxes
                const checkedCount = list.querySelectorAll('input:checked').length;
                sub.completedTopics = checkedCount;
                
                // Update local progress text
                const newProg = Math.round((sub.completedTopics / sub.totalTopics) * 100) || 0;
                document.getElementById('detail-subject-progress').textContent = `${newProg}%`;
                
                saveData();
                renderSubjects();
                
                // Add to activity if completed a topic
                if(box.checked) {
                    const topicNum = box.getAttribute('data-index');
                    logActivity(`Completed <span>${sub.name} — Topic ${topicNum}</span>`);
                }
            });
        });

        detailsModal.classList.add('active');
    };

    const closeDetails = () => detailsModal.classList.remove('active');
    document.getElementById('close-detail-modal')?.addEventListener('click', closeDetails);
    document.getElementById('cancel-detail-modal')?.addEventListener('click', closeDetails);

    // Link "START SESSION" button in modal to the Pomodoro panel
    document.getElementById('start-subject-session-btn')?.addEventListener('click', () => {
        closeDetails();
        document.getElementById('current-session-subject').textContent = currentSubjectContext.name;
        document.querySelector('.type-btn[data-type="focus"]').click(); // Reset to focus
        
        // Scroll to timer
        window.scrollTo({ top: document.querySelector('.focus-panel').offsetTop - 100, behavior: 'smooth' });
    });

    /* ==========================================================================
       6. POMODORO / STUDY TIMER
       ========================================================================== */
    let timerInterval;
    let timeRemaining = 25 * 60; 
    let timerRunning = false;
    let currentTimerType = 'focus'; // focus, short, long
    
    const display = document.getElementById('timer-display');
    const typeBtns = document.querySelectorAll('.type-btn');

    const times = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

    typeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(timerRunning) pauseTimer();
            typeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentTimerType = e.target.getAttribute('data-type');
            timeRemaining = times[currentTimerType];
            updateTimerDisplay();
        });
    });

    const updateTimerDisplay = () => {
        if(!display) return;
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        display.textContent = `${m}:${s}`;
    };

    const startTimer = () => {
        if (timerRunning) return;
        timerRunning = true;
        
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                handleTimerComplete();
            }
        }, 1000);
    };

    const pauseTimer = () => {
        clearInterval(timerInterval);
        timerRunning = false;
    };

    const resetTimer = () => {
        pauseTimer();
        timeRemaining = times[currentTimerType];
        updateTimerDisplay();
    };

    const handleTimerComplete = () => {
        pauseTimer();
        if (Notification.permission === "granted") {
            new Notification("Session Complete!", { body: "Timer has finished." });
        }

        if (currentTimerType === 'focus') {
            // Update stats
            studyStats.sessions += 1;
            studyStats.completedMins += 25;
            saveData();
            renderStats();
            
            const subjName = document.getElementById('current-session-subject').textContent;
            logActivity(`Completed 25m Focus on <span>${subjName}</span>`);
        }
        
        // Auto switch to short break if it was focus
        if(currentTimerType === 'focus') {
            document.querySelector('.type-btn[data-type="short"]').click();
        } else {
            document.querySelector('.type-btn[data-type="focus"]').click();
        }
    };

    document.getElementById('timer-start')?.addEventListener('click', startTimer);
    document.getElementById('timer-pause')?.addEventListener('click', pauseTimer);
    document.getElementById('timer-reset')?.addEventListener('click', resetTimer);

    // Quick Action button hook
    document.getElementById('btn-quick-focus')?.addEventListener('click', () => {
        document.querySelector('.type-btn[data-type="focus"]').click();
        startTimer();
        window.scrollTo({ top: document.querySelector('.focus-panel').offsetTop - 100, behavior: 'smooth' });
    });

    /* ==========================================================================
       7. MANUAL TIME ADDITION
       ========================================================================== */
    document.querySelectorAll('.btn-add-time').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mins = parseInt(e.target.getAttribute('data-mins'));
            studyStats.completedMins += mins;
            saveData();
            renderStats();
            logActivity(`Manually logged <span>${mins} Minutes</span> of study`);
        });
    });

    const logActivity = (descHtml) => {
        activityLog.unshift({ time: "Just Now", desc: descHtml });
        if(activityLog.length > 5) activityLog.pop();
        saveData();
        renderActivity();
    };

    /* ==========================================================================
       8. ANIMATE BAR CHART
       ========================================================================== */
    setTimeout(() => {
        const chart = document.getElementById('weekly-chart');
        if (chart) {
            chart.classList.add('animate');
            const bars = chart.querySelectorAll('.bar');
            bars.forEach(bar => {
                const height = bar.getAttribute('data-height');
                bar.style.height = height;
            });
        }
    }, 500);

    /* ==========================================================================
       9. VOICE ASSISTANT (Web Speech API)
       ========================================================================== */
    const aiOrb = document.getElementById('ai-orb');
    const voiceCard = document.getElementById('voice-assistant-card');
    const askJarvisBtn = document.getElementById('btn-ask-jarvis');
    const feedbackBox = document.getElementById('voice-feedback');
    let isListening = false;

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.includes('Male'));
            if (voice) utterance.voice = voice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const startListening = () => {
        if (isListening) return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            feedbackBox.innerHTML = '<p class="suggestion" style="color:red">Voice not supported in this browser.</p>';
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            aiOrb.classList.add('listening');
            feedbackBox.innerHTML = '<p class="suggestion" style="color:var(--primary-cyan)">LISTENING...</p>';
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            feedbackBox.innerHTML = `<p class="suggestion">YOU SAID:<br><strong>"${command}"</strong></p>`;
            setTimeout(() => processVoiceCommand(command), 800);
        };

        recognition.onerror = () => {
            aiOrb.classList.remove('listening');
            isListening = false;
            feedbackBox.innerHTML = '<p class="suggestion">Microphone error. Try again.</p>';
        };

        recognition.onend = () => {
            aiOrb.classList.remove('listening');
            isListening = false;
            setTimeout(() => {
                if(!feedbackBox.innerHTML.includes('YOU SAID')) {
                     feedbackBox.innerHTML = '<p class="suggestion">Try saying:<br><i>"Start study session"</i></p>';
                }
            }, 4000);
        };

        try { recognition.start(); } catch(e) {}
    };

    const processVoiceCommand = (cmd) => {
        let handled = false;

        if (cmd.includes('start study') || cmd.includes('start focus')) {
            speak('Starting focus session');
            document.querySelector('.type-btn[data-type="focus"]').click();
            startTimer();
            window.scrollTo({ top: document.querySelector('.focus-panel').offsetTop - 100, behavior: 'smooth' });
            handled = true;
        } 
        else if (cmd.includes('add 30 minutes') || cmd.includes('add thirty minutes')) {
            speak('Adding 30 minutes to your study goal');
            document.querySelector('.btn-add-time[data-mins="30"]').click();
            handled = true;
        }
        else if (cmd.includes('open flashcards')) {
            speak('Opening flashcards');
            setTimeout(() => window.location.href = 'flashcards.html', 1000);
            handled = true;
        }
        else if (cmd.includes('open notes')) {
            speak('Opening notes');
            setTimeout(() => window.location.href = 'notes.html', 1000);
            handled = true;
        }
        else if (cmd.includes('open timetable')) {
            speak('Opening timetable');
            setTimeout(() => window.location.href = 'timetable.html', 1000);
            handled = true;
        }
        else if (cmd.includes('open dashboard')) {
            speak('Opening dashboard');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
            handled = true;
        }

        if (!handled) {
            speak("I didn't understand that study command.");
        }
    };

    if (aiOrb) aiOrb.addEventListener('click', startListening);
    if (askJarvisBtn) {
        askJarvisBtn.addEventListener('click', () => {
            window.scrollTo({ top: voiceCard.offsetTop - 100, behavior: 'smooth' });
            setTimeout(startListening, 500);
        });
    }

    /* Initialize Data Render */
    renderSubjects();
    renderStats();
    renderActivity();

});