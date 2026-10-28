/**
 * KAPISH JARVIS - Dashboard Command Center Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Dashboard
    initializeDashboard();

    // 2. Setup recurring timers
    setInterval(updateClockAndNextClass, 1000);
    
    // 3. Listen for Storage Changes (to auto-refresh specific components)
    window.addEventListener('jarvis:data-updated', handleDataUpdate);
    
    // 4. Bind UI Events
    bindEvents();
});

// --- CORE INITIALIZATION ---
function initializeDashboard() {
    console.log("JARVIS Dashboard Initializing...");
    
    // Apply theme settings if available
    const settings = window.JARVIS.Storage.get('jarvisSettings', {});
    if(settings.profile) document.getElementById('headerAvatar').innerText = settings.profile.initial || 'K';
    
    loadDashboardData();
    updateClockAndNextClass(); // initial call
}

function loadDashboardData() {
    updateGreeting();
    updateStats();
    updateNextClassData();
    updateTodaySchedule();
    updateTaskOverview();
    updateStudyProgress();
    updateWeeklyStudyChart();
    updateFlashcardReview();
    updateNotesSnapshot();
    generateRecommendation();
    generateNotifications();
}

// --- CLOCK & GREETING ---
function updateGreeting() {
    const settings = window.JARVIS.Storage.get('jarvisSettings', {});
    const name = settings.profile?.name || "KAPISH";
    
    const hour = new Date().getHours();
    let greeting = "GOOD EVENING";
    if (hour >= 5 && hour < 12) greeting = "GOOD MORNING";
    else if (hour >= 12 && hour < 17) greeting = "GOOD AFTERNOON";
    else if (hour >= 21 || hour < 5) greeting = "GOOD NIGHT";
    
    document.querySelector('#headerGreeting h2').innerText = `${greeting}, ${name.toUpperCase()}`;
}

function updateClockAndNextClass() {
    const now = new Date();
    
    // Time & Date format
    const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('headerTime').innerText = now.toLocaleTimeString('en-US', timeOpts);
    
    const dateOpts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('headerDate').innerText = now.toLocaleDateString('en-US', dateOpts);

    // Update Next Class Countdown visually every second
    tickNextClassCountdown(now);
}

// --- STATS ROW ---
function updateStats() {
    const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
    const flashcards = window.JARVIS.Storage.get('jarvisFlashcards', []);
    const studySet = window.JARVIS.Storage.get('jarvisStudySettings', { todayCompleted: 0 }); // Assuming stored in minutes

    // Tasks
    document.getElementById('statTasks').innerText = tasks.filter(t => !t.completed).length;
    
    // Flashcards (Simulated due logic: cards with nextReview <= today)
    const now = new Date().toISOString();
    const dueCards = flashcards.filter(c => !c.nextReview || c.nextReview <= now).length;
    document.getElementById('statFlashcards').innerText = dueCards;

    // Study Time
    const completedMins = studySet.todayCompleted || 0;
    document.getElementById('statStudy').innerText = `${Math.floor(completedMins / 60)}h ${completedMins % 60}m`;
}

// --- TIMETABLE & NEXT CLASS LOGIC ---
let cachedNextClass = null; // Store to avoid heavy calculation every second

function parseTimeString(timeStr) {
    // Converts "10:30 AM" or "14:00" into a Date object for TODAY
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    
    if (modifier) {
        if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
    }
    
    const d = new Date();
    d.setHours(hours, parseInt(minutes, 10), 0, 0);
    return d;
}

function getTodayClasses() {
    const timetable = window.JARVIS.Storage.get('jarvisTimetable', []);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayStr = days[new Date().getDay()];
    
    // Filter classes for today and parse times
    const todayClasses = timetable
        .filter(c => c.day === todayStr)
        .map(c => {
            const start = parseTimeString(c.startTime || c.time);
            // Rough estimate of 1 hour duration if endTime not provided
            const end = c.endTime ? parseTimeString(c.endTime) : new Date(start.getTime() + 60*60*1000);
            return { ...c, startObj: start, endObj: end };
        })
        .sort((a, b) => a.startObj - b.startObj);
        
    return todayClasses;
}

function updateNextClassData() {
    const todayClasses = getTodayClasses();
    document.getElementById('statClasses').innerText = todayClasses.length;
    
    const now = new Date();
    cachedNextClass = null;
    
    // Find the current or next class
    for (let c of todayClasses) {
        if (now < c.endObj) {
            cachedNextClass = c;
            break;
        }
    }

    const ncSub = document.getElementById('ncSubject');
    const ncTime = document.getElementById('ncTime');
    const ncRoom = document.getElementById('ncRoom');
    const statusBadge = document.getElementById('nextClassStatus');
    const countdownBox = document.getElementById('ncCountdownBox');

    if (!cachedNextClass) {
        ncSub.innerText = "No More Classes";
        ncTime.innerText = "--:--";
        ncRoom.innerText = "--";
        statusBadge.className = "status-badge completed";
        statusBadge.innerText = "DONE";
        countdownBox.classList.add('hidden');
    } else {
        ncSub.innerText = cachedNextClass.subject || cachedNextClass.title;
        ncTime.innerText = cachedNextClass.startTime || cachedNextClass.time;
        ncRoom.innerText = cachedNextClass.room || 'TBD';
        countdownBox.classList.remove('hidden');
        tickNextClassCountdown(now); // Immediate update
    }
}

function tickNextClassCountdown(now) {
    if (!cachedNextClass) return;

    const statusBadge = document.getElementById('nextClassStatus');
    const timerText = document.getElementById('ncTimer');
    const progressBg = document.getElementById('ncProgressBg');
    const progressFill = document.getElementById('ncProgressFill');
    const countLabel = document.querySelector('.countdown-label');

    if (now >= cachedNextClass.startObj && now < cachedNextClass.endObj) {
        // Class is ONGOING
        statusBadge.className = "status-badge ongoing";
        statusBadge.innerText = "ONGOING";
        countLabel.innerText = "TIME REMAINING";
        progressBg.classList.remove('hidden');
        
        const totalDuration = cachedNextClass.endObj - cachedNextClass.startObj;
        const elapsed = now - cachedNextClass.startObj;
        const remaining = cachedNextClass.endObj - now;
        
        const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        progressFill.style.width = `${percent}%`;
        
        timerText.innerText = formatTimeDiff(remaining);
    } 
    else if (now < cachedNextClass.startObj) {
        // Class is UPCOMING
        statusBadge.className = "status-badge upcoming";
        statusBadge.innerText = "UPCOMING";
        countLabel.innerText = "STARTS IN";
        progressBg.classList.add('hidden');
        
        const remaining = cachedNextClass.startObj - now;
        timerText.innerText = formatTimeDiff(remaining);
    } 
    else {
        // State transition (class ended), re-fetch
        updateNextClassData();
        updateTodaySchedule(); // Update schedule list highlights
    }
}

function formatTimeDiff(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function updateTodaySchedule() {
    const list = document.getElementById('todayScheduleList');
    const todayClasses = getTodayClasses();
    const now = new Date();
    
    if (todayClasses.length === 0) {
        list.innerHTML = '<div class="empty-state">No schedule data available.</div>';
        return;
    }

    list.innerHTML = '';
    todayClasses.forEach(c => {
        let statusClass = 's-upcoming';
        if (now >= c.startObj && now < c.endObj) statusClass = 's-ongoing';
        else if (now >= c.endObj) statusClass = 's-completed';

        list.innerHTML += `
            <div class="schedule-item ${statusClass}">
                <div class="s-time">${c.startTime || c.time}</div>
                <div class="s-sub">${c.subject || c.title}</div>
                <div class="s-room">${c.room || ''}</div>
            </div>
        `;
    });
}

// --- TASK CENTER ---
function updateTaskOverview() {
    const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
    const list = document.getElementById('dashboardTaskList');
    
    let pending = 0, overdue = 0;
    const nowStr = new Date().toISOString().split('T')[0];

    const displayTasks = tasks.filter(t => !t.completed).map(t => {
        pending++;
        if (t.dueDate && t.dueDate < nowStr) overdue++;
        
        // Calculate a score for sorting
        let score = 0;
        if (t.dueDate && t.dueDate < nowStr) score += 100; // Overdue top
        if (t.dueDate === nowStr) score += 50; // Due today
        if (t.priority === 'high') score += 25;
        return { ...t, score };
    }).sort((a, b) => b.score - a.score);

    document.getElementById('tcPending').innerText = pending;
    document.getElementById('tcOverdue').innerText = overdue;

    if (displayTasks.length === 0) {
        list.innerHTML = '<div class="empty-state">All caught up! No pending tasks.</div>';
        return;
    }

    list.innerHTML = '';
    displayTasks.slice(0, 4).forEach(t => {
        const isHigh = t.priority === 'high' ? 'high-priority' : '';
        const isOverdue = (t.dueDate && t.dueDate < nowStr) ? 'overdue' : '';
        list.innerHTML += `
            <div class="task-item ${isHigh}">
                <div class="t-check"></div>
                <div class="t-content">
                    <span class="t-title">${t.title}</span>
                    <div class="t-meta">
                        <span>${t.category || 'General'}</span>
                        ${t.dueDate ? `<span class="due ${isOverdue}"><i class="fa-regular fa-clock"></i> ${t.dueDate}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

// --- STUDY PROGRESS ---
function updateStudyProgress() {
    const studySet = window.JARVIS.Storage.get('jarvisStudySettings', { dailyGoal: 120, todayCompleted: 0 });
    const goal = studySet.dailyGoal || 120; // Default 120 mins
    const completed = studySet.todayCompleted || 0;
    const remaining = Math.max(0, goal - completed);
    
    // Update Text
    document.getElementById('sdGoal').innerText = `${Math.floor(goal/60)}h ${goal%60}m`;
    document.getElementById('srCompleted').innerText = `${Math.floor(completed/60)}h ${completed%60}m`;
    document.getElementById('sdRemaining').innerText = `${Math.floor(remaining/60)}h ${remaining%60}m`;

    // Update Ring (0 to 360 degrees)
    const percentage = Math.min(1, completed / goal);
    const degrees = percentage * 360;
    document.getElementById('studyRing').style.setProperty('--progress', `${degrees}deg`);
}

function updateWeeklyStudyChart() {
    const chart = document.getElementById('weeklyChart');
    // Mocking weekly data extraction (ideally stored in jarvisStudySettings.weeklyHistory)
    const studySet = window.JARVIS.Storage.get('jarvisStudySettings', {});
    const weeklyData = studySet.weeklyHistory || [0, 45, 120, 90, 30, 0, 0]; // minutes per day (Mon-Sun)
    
    const maxVal = Math.max(...weeklyData, 120); // ensure at least some scale
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // Convert JS Sunday=0 to Monday=0

    chart.innerHTML = '';
    weeklyData.forEach((mins, idx) => {
        const heightPct = (mins / maxVal) * 100;
        const isToday = idx === currentDayIdx ? 'today' : '';
        const timeStr = `${Math.floor(mins/60)}h ${mins%60}m`;
        
        chart.innerHTML += `
            <div class="chart-bar-container">
                <div class="chart-bar ${isToday}" style="height: ${heightPct}%">
                    <span class="chart-tooltip">${timeStr}</span>
                </div>
                <span class="chart-label">${days[idx]}</span>
            </div>
        `;
    });
}

// --- FLASHCARDS & NOTES ---
function updateFlashcardReview() {
    const flashcards = window.JARVIS.Storage.get('jarvisFlashcards', []);
    const progress = window.JARVIS.Storage.get('jarvisFlashcardProgress', {}); // Map of cardId -> {status, nextReview}
    
    const now = new Date().toISOString();
    let due = 0, mastered = 0;

    flashcards.forEach(c => {
        const p = progress[c.id];
        if (!p || !p.nextReview || p.nextReview <= now) due++;
        if (p && p.status === 'mastered') mastered++;
    });

    document.getElementById('fcTotal').innerText = flashcards.length;
    document.getElementById('fcDue').innerText = due;
    document.getElementById('fcMastered').innerText = mastered;
}

function updateNotesSnapshot() {
    const notes = window.JARVIS.Storage.get('jarvisNotes', []);
    document.getElementById('kbTotal').innerText = notes.length;
    document.getElementById('kbPinned').innerText = notes.filter(n => n.pinned).length;

    const list = document.getElementById('kbRecentList');
    if (notes.length === 0) {
        list.innerHTML = '<div class="empty-state">No notes created yet.</div>';
        return;
    }

    // Sort by updated/created date descending
    const sorted = [...notes].sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    
    list.innerHTML = '';
    sorted.slice(0, 3).forEach(n => {
        const dateStr = n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : '';
        list.innerHTML += `
            <div class="kb-note" onclick="window.JARVIS.Navigation.openNotes()">
                <span class="kb-note-title"><i class="fa-regular fa-file-lines"></i> ${n.title}</span>
                <span class="kb-note-date">${dateStr}</span>
            </div>
        `;
    });
}

// --- JARVIS INTELLIGENCE (Rule-Based) ---
function generateRecommendation() {
    const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
    const nowStr = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < nowStr);
    
    const todayClasses = getTodayClasses();
    const flashcardsDue = parseInt(document.getElementById('fcDue').innerText) || 0;
    
    const recEl = document.getElementById('jarvisRecommendation');
    const focusList = document.getElementById('focusList');
    focusList.innerHTML = '';
    
    let mainRec = "Your planned work is currently clear. Good job!";
    
    if (overdueTasks.length > 0) {
        mainRec = "Your highest priority is clearing overdue tasks to stay on track.";
        focusList.innerHTML += `<li onclick="window.JARVIS.Navigation.openTasks()"><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Complete ${overdueTasks[0].title}</li>`;
    } else if (cachedNextClass && new Date() < cachedNextClass.startObj) {
        mainRec = `You have ${cachedNextClass.subject || cachedNextClass.title} coming up. Prepare your materials.`;
        focusList.innerHTML += `<li onclick="window.JARVIS.Navigation.openTimetable()"><i class="fa-solid fa-book"></i> Prepare for ${cachedNextClass.subject}</li>`;
    } else if (flashcardsDue > 0) {
        mainRec = "Spaced repetition is waiting. You have flashcards ready for review.";
    }

    recEl.innerText = mainRec;

    // Add secondary focus items
    if (flashcardsDue > 0) {
        focusList.innerHTML += `<li onclick="window.JARVIS.Navigation.openFlashcards()"><i class="fa-solid fa-layer-group"></i> Review ${flashcardsDue} Flashcards</li>`;
    }
    
    const pendingHigh = tasks.filter(t => !t.completed && t.priority === 'high' && !(t.dueDate && t.dueDate < nowStr));
    if (pendingHigh.length > 0) {
        focusList.innerHTML += `<li onclick="window.JARVIS.Navigation.openTasks()"><i class="fa-solid fa-star"></i> High Priority: ${pendingHigh[0].title}</li>`;
    }

    if (focusList.innerHTML === '') {
        focusList.innerHTML = '<li><i class="fa-solid fa-check"></i> Take a break, Kapish.</li>';
    }
}

function generateNotifications() {
    const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
    const nowStr = new Date().toISOString().split('T')[0];
    const overdueCount = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < nowStr).length;
    
    const notifList = document.getElementById('notifList');
    const badge = document.getElementById('notifBadge');
    
    let count = 0;
    notifList.innerHTML = '';

    if (overdueCount > 0) {
        notifList.innerHTML += `<div class="notif-item" style="border-color:var(--danger)">${overdueCount} tasks are overdue.</div>`;
        count++;
    }

    if (cachedNextClass) {
        const remaining = cachedNextClass.startObj - new Date();
        if (remaining > 0 && remaining <= 30*60*1000) { // Starts in <= 30 mins
            notifList.innerHTML += `<div class="notif-item">${cachedNextClass.subject} starts in ${Math.ceil(remaining/60000)} minutes.</div>`;
            count++;
        }
    }

    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
        notifList.innerHTML = '<div class="empty-state">No new alerts.</div>';
    }
}

// --- EVENT BINDINGS ---
function bindEvents() {
    // Refresh Button
    document.getElementById('btnRefresh').addEventListener('click', () => {
        loadDashboardData();
        if(window.JARVIS.Notifications) window.JARVIS.Notifications.success("Dashboard synchronized.");
    });

    // Quick Actions
    document.getElementById('qaBtnVoice').addEventListener('click', () => {
        if(window.JARVIS.Recognition) window.JARVIS.Recognition.startListening();
        else if(window.JARVIS.Notifications) window.JARVIS.Notifications.error("Voice system unavailable.");
    });

    // Quick Add Task Modal
    const modal = document.getElementById('quickTaskModal');
    document.getElementById('qaBtnTask').addEventListener('click', () => modal.classList.add('show'));
    document.getElementById('btnQuickTask').addEventListener('click', () => modal.classList.add('show'));
    document.getElementById('closeTaskModal').addEventListener('click', () => modal.classList.remove('show'));

    document.getElementById('btnSaveQuickTask').addEventListener('click', () => {
        const title = document.getElementById('qtTitle').value.trim();
        if(!title) return;
        
        const tasks = window.JARVIS.Storage.get('jarvisTasks', []);
        tasks.push({
            id: Date.now(),
            title: title,
            category: document.getElementById('qtCategory').value,
            priority: document.getElementById('qtPriority').value,
            dueDate: document.getElementById('qtDate').value,
            completed: false,
            createdAt: new Date().toISOString()
        });
        
        window.JARVIS.Storage.set('jarvisTasks', tasks);
        modal.classList.remove('show');
        
        // Reset form
        document.getElementById('qtTitle').value = '';
        document.getElementById('qtDate').value = '';
        
        if(window.JARVIS.Notifications) window.JARVIS.Notifications.success("Task added successfully.");
    });

    // Notification Dropdown
    document.getElementById('notificationBtn').addEventListener('click', () => {
        document.getElementById('notificationDropdown').classList.toggle('show');
        document.getElementById('notifBadge').classList.add('hidden');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if(!e.target.closest('#notificationBtn') && !e.target.closest('#notificationDropdown')) {
            document.getElementById('notificationDropdown').classList.remove('show');
        }
    });
}

function handleDataUpdate(e) {
    // Selectively refresh components based on what key changed
    if(!e.detail || !e.detail.key) return;
    
    switch(e.detail.key) {
        case 'jarvisTasks':
            updateTaskOverview();
            break;
        case 'jarvisTimetable':
            updateNextClassData();
            updateTodaySchedule();
            break;
        case 'jarvisStudySettings':
            updateStudyProgress();
            updateWeeklyStudyChart();
            break;
        case 'jarvisFlashcards':
        case 'jarvisFlashcardProgress':
            updateFlashcardReview();
            break;
        case 'jarvisNotes':
            updateNotesSnapshot();
            break;
    }
    
    // Always update high-level stats & recs
    updateStats();
    generateRecommendation();
    generateNotifications();
}