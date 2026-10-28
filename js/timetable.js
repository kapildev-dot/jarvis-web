document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. GLOBAL VARIABLES & STATE
       ========================================================================== */
    const STORAGE_KEY_TT = 'jarvisTimetable';
    const STORAGE_KEY_ATT = 'jarvisAttendance';
    
    let timetableData = [];
    let attendanceData = {}; // Format: { "id-YYYY-MM-DD": "present"|"absent" }
    
    // Calendar & Selection State
    let currentDate = new Date();
    let selectedDate = new Date();
    
    // Timers
    let globalTimer;

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // MCA Sample Data
    const sampleTimetable = [
        // Monday
        { id: 1, day: "Monday", type: "Lecture", subject: "Web Programming", startTime: "10:00", endTime: "10:50", room: "E1-201", instructor: "Prof. Alan" },
        { id: 2, day: "Monday", type: "Lecture", subject: "DBMS", startTime: "10:55", endTime: "11:45", room: "E1-202", instructor: "Dr. Smith" },
        { id: 3, day: "Monday", type: "Lecture", subject: "Python", startTime: "11:50", endTime: "12:40", room: "E1-203", instructor: "Dr. Turing" },
        { id: 4, day: "Break", type: "Break", subject: "Lunch Break", startTime: "12:40", endTime: "13:30", room: "--", instructor: "--" },
        { id: 5, day: "Monday", type: "Lecture", subject: "Advanced Networks", startTime: "13:30", endTime: "14:20", room: "E1-204", instructor: "Prof. Hopper" },
        { id: 6, day: "Monday", type: "Lab", subject: "PL/SQL Lab", startTime: "14:25", endTime: "15:15", room: "CSE Lab 1", instructor: "Dr. Smith" },
        // Tuesday
        { id: 7, day: "Tuesday", type: "Lecture", subject: "DBMS", startTime: "10:00", endTime: "10:50", room: "E1-202", instructor: "Dr. Smith" },
        { id: 8, day: "Tuesday", type: "Lecture", subject: "Web Programming", startTime: "10:55", endTime: "11:45", room: "E1-201", instructor: "Prof. Alan" },
        { id: 9, day: "Tuesday", type: "Lecture", subject: "Artificial Intelligence", startTime: "12:00", endTime: "12:50", room: "E1-205", instructor: "Dr. Ng" },
        { id: 10, day: "Break", type: "Break", subject: "Lunch Break", startTime: "12:50", endTime: "13:30", room: "--", instructor: "--" },
        { id: 11, day: "Tuesday", type: "Lab", subject: "Python Lab", startTime: "13:30", endTime: "15:15", room: "CSE Lab 2", instructor: "Dr. Turing" },
        // Wednesday
        { id: 12, day: "Wednesday", type: "Lecture", subject: "Python", startTime: "10:00", endTime: "10:50", room: "E1-203", instructor: "Dr. Turing" },
        { id: 13, day: "Wednesday", type: "Lecture", subject: "Advanced Networks", startTime: "10:55", endTime: "11:45", room: "E1-204", instructor: "Prof. Hopper" },
        { id: 14, day: "Wednesday", type: "Lecture", subject: "DBMS", startTime: "11:50", endTime: "12:40", room: "E1-202", instructor: "Dr. Smith" },
        { id: 15, day: "Wednesday", type: "Lecture", subject: "Web Programming", startTime: "13:30", endTime: "14:20", room: "E1-201", instructor: "Prof. Alan" },
        // Thursday
        { id: 16, day: "Thursday", type: "Lecture", subject: "PL/SQL", startTime: "10:00", endTime: "10:50", room: "E1-205", instructor: "Dr. Smith" },
        { id: 17, day: "Thursday", type: "Lecture", subject: "Artificial Intelligence", startTime: "10:55", endTime: "11:45", room: "E1-205", instructor: "Dr. Ng" },
        { id: 18, day: "Thursday", type: "Lecture", subject: "Python", startTime: "11:50", endTime: "12:40", room: "E1-203", instructor: "Dr. Turing" },
        { id: 19, day: "Thursday", type: "Lab", subject: "Web Programming Lab", startTime: "13:30", endTime: "15:15", room: "CSE Lab 1", instructor: "Prof. Alan" },
        // Friday
        { id: 20, day: "Friday", type: "Lecture", subject: "DBMS", startTime: "10:00", endTime: "10:50", room: "E1-202", instructor: "Dr. Smith" },
        { id: 21, day: "Friday", type: "Lecture", subject: "Advanced Networks", startTime: "10:55", endTime: "11:45", room: "E1-204", instructor: "Prof. Hopper" }
    ];

    /* ==========================================================================
       2. INITIALIZATION
       ========================================================================== */
    const init = () => {
        loadData();
        setupEventListeners();
        startGlobalTimer();
        
        // Initial setup for the view
        selectedDate = new Date();
        updateDateSelectorDisplay();
        renderDashboard();
    };

    const loadData = () => {
        const storedTT = localStorage.getItem(STORAGE_KEY_TT);
        if (storedTT) {
            timetableData = JSON.parse(storedTT);
        } else {
            timetableData = sampleTimetable;
            saveData();
        }

        const storedAtt = localStorage.getItem(STORAGE_KEY_ATT);
        if (storedAtt) {
            attendanceData = JSON.parse(storedAtt);
        }
    };

    const saveData = () => {
        localStorage.setItem(STORAGE_KEY_TT, JSON.stringify(timetableData));
        localStorage.setItem(STORAGE_KEY_ATT, JSON.stringify(attendanceData));
        populateSubjectFilter();
    };

    /* ==========================================================================
       3. TIME UTILITIES
       ========================================================================== */
    const startGlobalTimer = () => {
        updateClock();
        globalTimer = setInterval(() => {
            updateClock();
            checkReminders();
            // We only need to re-render the time-sensitive parts, not the whole UI
            if (new Date().getSeconds() === 0) {
                renderHeroCard();
                updateClassStatusesInDOM();
                renderStats();
            }
        }, 1000);
    };

    const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        
        document.getElementById('live-time').textContent = timeStr;
        document.getElementById('live-date').textContent = dateStr;
        document.getElementById('jarvis-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Greeting
        const hour = now.getHours();
        let greeting = "GOOD EVENING";
        if (hour >= 5 && hour < 12) greeting = "GOOD MORNING";
        else if (hour >= 12 && hour < 18) greeting = "GOOD AFTERNOON";
        document.getElementById('greeting-text').textContent = `${greeting}, KAPISH`;
    };

    // Helper: "14:30" -> Date object for today
    const timeToDate = (timeStr, baseDate = new Date()) => {
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const formatAMPM = (timeStr) => {
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}:${m} ${ampm}`;
    };

    /* ==========================================================================
       4. CORE SCHEDULING LOGIC
       ========================================================================== */
    
    // Calculate status of a class based on a given reference Date
    const calculateStatus = (cls, refDate = new Date()) => {
        // If checking a date in the past
        const refStartOfDay = new Date(refDate); refStartOfDay.setHours(0,0,0,0);
        const todayStartOfDay = new Date(); todayStartOfDay.setHours(0,0,0,0);
        
        if (refStartOfDay < todayStartOfDay) return 'COMPLETED';
        if (refStartOfDay > todayStartOfDay) return 'UPCOMING';

        // It is today
        const now = new Date();
        const start = timeToDate(cls.startTime, now);
        const end = timeToDate(cls.endTime, now);

        if (now > end) return 'COMPLETED';
        if (now >= start && now <= end) return 'ONGOING';
        return 'UPCOMING';
    };

    const getClassesForDate = (dateObj) => {
        const dayName = daysOfWeek[dateObj.getDay()];
        let classes = timetableData.filter(c => c.day === dayName);
        
        // Sort by start time
        classes.sort((a, b) => {
            const timeA = parseInt(a.startTime.replace(':', ''));
            const timeB = parseInt(b.startTime.replace(':', ''));
            return timeA - timeB;
        });
        return classes;
    };

    /* ==========================================================================
       5. MAIN RENDERING
       ========================================================================== */
    const renderDashboard = () => {
        populateSubjectFilter();
        renderStats();
        renderHeroCard();
        renderDaySelector();
        renderTimetable();
        renderTodaySchedule();
        renderWeeklyOverview();
        renderSubjectHours();
        renderAttendanceSummary();
    };

    // Top Statistics
    const renderStats = () => {
        const todayClasses = getClassesForDate(new Date()).filter(c => c.type !== 'Break');
        let completed = 0;
        let remaining = 0;
        let nextClassTime = '--:--';

        const now = new Date();

        todayClasses.forEach(c => {
            const stat = calculateStatus(c, now);
            if (stat === 'COMPLETED') completed++;
            else if (stat === 'ONGOING' || stat === 'UPCOMING') remaining++;
        });

        // Find Next Class
        const upcoming = todayClasses.filter(c => calculateStatus(c, now) === 'UPCOMING');
        if (upcoming.length > 0) {
            nextClassTime = formatAMPM(upcoming[0].startTime);
            document.getElementById('jarvis-next').textContent = upcoming[0].subject.substring(0, 15);
        } else {
            document.getElementById('jarvis-next').textContent = "NONE";
        }

        document.getElementById('stat-today-total').textContent = todayClasses.length;
        document.getElementById('stat-today-completed').textContent = completed;
        document.getElementById('stat-today-remaining').textContent = remaining;
        document.getElementById('stat-next-class-time').textContent = nextClassTime;
    };

    // Hero Card (Dynamic countdown & active class)
    const renderHeroCard = () => {
        const container = document.getElementById('hero-class-card');
        const todayClasses = getClassesForDate(new Date());
        const now = new Date();
        
        // Exclude breaks for Hero card unless you want breaks shown
        const academicClasses = todayClasses.filter(c => c.type !== 'Break');
        
        let targetClass = null;
        let isOngoing = false;

        // Check for ongoing
        const ongoing = academicClasses.find(c => calculateStatus(c, now) === 'ONGOING');
        if (ongoing) {
            targetClass = ongoing;
            isOngoing = true;
        } else {
            // Find next
            targetClass = academicClasses.find(c => calculateStatus(c, now) === 'UPCOMING');
        }

        if (!targetClass) {
            container.innerHTML = `
                <div class="hero-content">
                    <span class="hero-badge">SCHEDULE CLEAR</span>
                    <h2 class="hero-subject">No More Classes Today</h2>
                    <div class="hero-details">Your academic schedule is clear. Take a break!</div>
                </div>
            `;
            return;
        }

        // Render target
        const startAMPM = formatAMPM(targetClass.startTime);
        const endAMPM = formatAMPM(targetClass.endTime);

        let html = `
            <div class="hero-content">
                <span class="hero-badge ${isOngoing ? 'ongoing' : ''}">${isOngoing ? '● LIVE NOW - ONGOING' : 'NEXT CLASS UPCOMING'}</span>
                <h2 class="hero-subject">${targetClass.subject}</h2>
                <div class="hero-details">
                    <span><i class="fas fa-clock"></i> ${startAMPM} – ${endAMPM}</span>
                    <span><i class="fas fa-map-marker-alt"></i> Room: ${targetClass.room}</span>
                    <span><i class="fas fa-chalkboard-teacher"></i> ${targetClass.instructor}</span>
                </div>
        `;

        if (isOngoing) {
            const start = timeToDate(targetClass.startTime);
            const end = timeToDate(targetClass.endTime);
            const totalSecs = (end - start) / 1000;
            const elapsed = (now - start) / 1000;
            const pct = Math.min(100, Math.max(0, (elapsed / totalSecs) * 100));

            html += `
                <div class="hero-progress-container">
                    <div class="hero-progress-bar">
                        <div class="hero-progress-fill" style="width: ${pct}%"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span class="hero-progress-txt">${Math.round(pct)}% completed</span>
                        <span class="hero-progress-txt" style="color:var(--text-gray)">Ends in: <span id="hero-countdown-timer"></span></span>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="hero-countdown-box">
                    <div class="hero-countdown-lbl">STARTS IN</div>
                    <div class="hero-countdown-val" id="hero-countdown-timer">--:--:--</div>
                </div>
            `;
        }
        
        html += `</div>`;
        container.innerHTML = html;

        // Set up the exact seconds countdown
        updateHeroCountdown(targetClass, isOngoing);
    };

    const updateHeroCountdown = (targetClass, isOngoing) => {
        const timerEl = document.getElementById('hero-countdown-timer');
        if (!timerEl) return;

        const now = new Date();
        const targetTime = isOngoing ? timeToDate(targetClass.endTime) : timeToDate(targetClass.startTime);
        const diffMs = targetTime - now;

        if (diffMs <= 0) {
            // Need to re-evaluate state
            renderHeroCard();
            renderStats();
            return;
        }

        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (num) => String(num).padStart(2, '0');
        timerEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

        // Request next frame via global timer check
        setTimeout(() => updateHeroCountdown(targetClass, isOngoing), 1000);
    };

    // Date/Day Selector
    const renderDaySelector = () => {
        const dayStr = daysOfWeek[selectedDate.getDay()];
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-day') === dayStr) {
                btn.classList.add('active');
            }
        });
        document.getElementById('current-view-title').textContent = `${dayStr.toUpperCase()}'S SCHEDULE`;
    };

    const updateDateSelectorDisplay = () => {
        const dateStr = selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('cal-current-date').textContent = dateStr;
        renderDaySelector();
        renderTimetable();
    };

    document.getElementById('cal-prev').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() - 1);
        updateDateSelectorDisplay();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
        selectedDate.setDate(selectedDate.getDate() + 1);
        updateDateSelectorDisplay();
    });
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetDay = e.target.getAttribute('data-day');
            // Move selectedDate to the nearest requested day in current week
            const currentDayIdx = selectedDate.getDay();
            const targetDayIdx = daysOfWeek.indexOf(targetDay);
            const diff = targetDayIdx - currentDayIdx;
            selectedDate.setDate(selectedDate.getDate() + diff);
            updateDateSelectorDisplay();
        });
    });

    // Main Timetable
    const renderTimetable = () => {
        const container = document.getElementById('timetable-body');
        const emptyState = document.getElementById('empty-timetable');
        
        let classes = getClassesForDate(selectedDate);

        // Apply Search & Filters
        const query = document.getElementById('search-input').value.toLowerCase();
        const fType = document.getElementById('filter-type').value;
        const fSubject = document.getElementById('filter-subject').value;

        classes = classes.filter(c => {
            const matchesQuery = c.subject.toLowerCase().includes(query) || c.room.toLowerCase().includes(query) || c.instructor.toLowerCase().includes(query);
            const matchesType = fType === 'All' || c.type === fType;
            const matchesSubj = fSubject === 'All' || c.subject === fSubject;
            return matchesQuery && matchesType && matchesSubj;
        });

        container.innerHTML = '';

        if (classes.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        const dateStrKey = selectedDate.toISOString().split('T')[0];

        classes.forEach(c => {
            const status = calculateStatus(c, selectedDate);
            const isBreak = c.type === 'Break';
            
            // Attendance data (only relevant for past/current dates)
            const attKey = `${c.id}-${dateStrKey}`;
            const attVal = attendanceData[attKey] || '';
            
            let attHtml = '';
            if (!isBreak) {
                attHtml = `
                    <button class="btn-icon att ${attVal === 'present' ? 'att-present' : ''}" data-att="present" data-id="${c.id}" title="Mark Present">P</button>
                    <button class="btn-icon att ${attVal === 'absent' ? 'att-absent' : ''}" data-att="absent" data-id="${c.id}" title="Mark Absent">A</button>
                `;
            }

            const row = document.createElement('div');
            row.className = `tt-row ${isBreak ? 'type-break' : ''} tt-row-dynamic`;
            row.setAttribute('data-id', c.id);
            row.setAttribute('data-start', c.startTime);
            row.setAttribute('data-end', c.endTime);
            row.setAttribute('data-isbreak', isBreak);
            
            let statusBadge = '';
            if (isBreak) statusBadge = `<span class="status-badge status-break">BREAK</span>`;
            else if (status === 'COMPLETED') statusBadge = `<span class="status-badge status-completed">COMPLETED</span>`;
            else if (status === 'ONGOING') statusBadge = `<span class="status-badge status-ongoing">ONGOING</span>`;
            else statusBadge = `<span class="status-badge status-upcoming">UPCOMING</span>`;

            row.innerHTML = `
                <div class="t-time">
                    <span>${formatAMPM(c.startTime)}</span>
                    <span class="t-time-end">${formatAMPM(c.endTime)}</span>
                </div>
                <div class="t-subject">
                    ${c.subject} <span class="t-type-badge type-lbl-${c.type.toLowerCase()}">${c.type.toUpperCase()}</span>
                </div>
                <div class="t-room">${c.room}</div>
                <div class="t-faculty">${c.instructor}</div>
                <div class="t-status-col">
                    <div class="status-wrapper">${statusBadge}</div>
                    <div class="tt-actions">
                        ${attHtml}
                        <button class="btn-icon edit" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon del" data-id="${c.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
            container.appendChild(row);
        });

        // Attach action events
        container.querySelectorAll('.btn-icon.edit').forEach(b => b.addEventListener('click', (e) => openClassModal(parseInt(e.currentTarget.dataset.id))));
        container.querySelectorAll('.btn-icon.del').forEach(b => b.addEventListener('click', (e) => openDeleteModal(parseInt(e.currentTarget.dataset.id))));
        container.querySelectorAll('.btn-icon.att').forEach(b => b.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const action = e.currentTarget.dataset.att;
            markAttendance(id, dateStrKey, action);
        }));
    };

    // Quick DOM update for statuses (runs every minute without full re-render)
    const updateClassStatusesInDOM = () => {
        // Only update if viewing today
        const todayStr = new Date().toDateString();
        if (selectedDate.toDateString() !== todayStr) return;

        const rows = document.querySelectorAll('.tt-row-dynamic');
        const now = new Date();

        rows.forEach(row => {
            const isBreak = row.getAttribute('data-isbreak') === 'true';
            if (isBreak) return;

            const startTime = row.getAttribute('data-start');
            const endTime = row.getAttribute('data-end');
            
            const start = timeToDate(startTime);
            const end = timeToDate(endTime);

            let status = 'UPCOMING';
            let badgeClass = 'status-upcoming';

            if (now > end) { status = 'COMPLETED'; badgeClass = 'status-completed'; }
            else if (now >= start && now <= end) { status = 'ONGOING'; badgeClass = 'status-ongoing'; }

            const wrapper = row.querySelector('.status-wrapper');
            if (wrapper && !wrapper.innerHTML.includes(status)) {
                wrapper.innerHTML = `<span class="status-badge ${badgeClass}">${status}</span>`;
            }
        });
    };

    /* ==========================================================================
       6. WIDGETS RENDERING
       ========================================================================== */
    const renderTodaySchedule = () => {
        const container = document.getElementById('today-timeline');
        const todayClasses = getClassesForDate(new Date());
        
        container.innerHTML = '';
        if (todayClasses.length === 0) {
            container.innerHTML = `<div class="timeline-empty">No classes today.</div>`;
            return;
        }

        const now = new Date();

        todayClasses.forEach(c => {
            const status = calculateStatus(c, now);
            const isActive = status === 'ONGOING';
            const item = document.createElement('div');
            item.className = `timeline-item ${isActive ? 'active' : ''}`;
            
            item.innerHTML = `
                <div class="timeline-time">${formatAMPM(c.startTime)}</div>
                <div class="timeline-title">${c.subject}</div>
                <div class="timeline-meta">${c.type !== 'Break' ? `${c.room} •${c.instructor}` : 'Break Time'}</div>
            `;
            container.appendChild(item);
        });
    };

    const renderWeeklyOverview = () => {
        const container = document.getElementById('weekly-overview-chart');
        container.innerHTML = '';

        const maxClasses = 8; // Assumed max per day for scale

        daysOfWeek.forEach((day, index) => {
            // Re-order to Mon-Sun
            const displayDay = index === 0 ? daysOfWeek[6] : daysOfWeek[index-1]; // quick shift if starting Sunday
            const dayName = index === 0 ? "Monday" : index === 1 ? "Tuesday" : index === 2 ? "Wednesday" : index === 3 ? "Thursday" : index === 4 ? "Friday" : index === 5 ? "Saturday" : "Sunday";
            
            const count = timetableData.filter(c => c.day === dayName && c.type !== 'Break').length;
            const pct = (count / maxClasses) * 100;
            const colorClass = count > 0 ? 'c-cyan' : '';

            container.innerHTML += `
                <div class="bar-row">
                    <span class="bar-label">${dayName.substring(0,3)}</span>
                    <div class="bar-track">
                        <div class="bar-fill ${colorClass}" style="width: ${pct}%"></div>
                    </div>
                    <span class="bar-val">${count}</span>
                </div>
            `;
        });
    };

    const renderSubjectHours = () => {
        const container = document.getElementById('subject-hours-chart');
        container.innerHTML = '';

        const subjMap = {};
        timetableData.forEach(c => {
            if (c.type === 'Break') return;
            // Calculate duration in hours
            const start = timeToDate(c.startTime);
            const end = timeToDate(c.endTime);
            const hours = (end - start) / (1000 * 60 * 60);
            
            if (!subjMap[c.subject]) subjMap[c.subject] = 0;
            subjMap[c.subject] += hours;
        });

        const sortedSubjects = Object.entries(subjMap).sort((a,b) => b[1] - a[1]);
        if (sortedSubjects.length === 0) return;

        const maxHours = sortedSubjects[0][1];

        sortedSubjects.slice(0, 5).forEach(([subj, hours]) => {
            const pct = (hours / maxHours) * 100;
            container.innerHTML += `
                <div class="bar-row">
                    <span class="bar-label" title="${subj}">${subj}</span>
                    <div class="bar-track">
                        <div class="bar-fill c-purple" style="width: ${pct}%"></div>
                    </div>
                    <span class="bar-val">${hours.toFixed(1)}h</span>
                </div>
            `;
        });
    };

    const renderAttendanceSummary = () => {
        let present = 0;
        let absent = 0;
        
        Object.values(attendanceData).forEach(val => {
            if (val === 'present') present++;
            if (val === 'absent') absent++;
        });

        const total = present + absent;
        const pct = total === 0 ? 0 : Math.round((present / total) * 100);

        document.getElementById('att-total').textContent = total;
        document.getElementById('att-present').textContent = present;
        document.getElementById('att-absent').textContent = absent;
        document.getElementById('att-percentage').textContent = `${pct}%`;
        document.getElementById('att-progress-fill').style.width = `${pct}%`;
    };

    const markAttendance = (classId, dateStr, status) => {
        const key = `${classId}-${dateStr}`;
        // Toggle off if same clicked
        if (attendanceData[key] === status) {
            delete attendanceData[key];
        } else {
            attendanceData[key] = status;
        }
        saveData();
        renderTimetable();
        renderAttendanceSummary();
        showToast('Attendance recorded', 'success');
    };

    const populateSubjectFilter = () => {
        const select = document.getElementById('filter-subject');
        const currentVal = select.value;
        const subjects = [...new Set(timetableData.filter(c => c.type !== 'Break').map(c => c.subject))];
        
        select.innerHTML = '<option value="All">All Subjects</option>';
        subjects.forEach(s => {
            select.innerHTML += `<option value="${s}">${s}</option>`;
        });
        select.value = currentVal || 'All';
    };

    /* ==========================================================================
       7. CRUD MODALS (ADD/EDIT/DELETE)
       ========================================================================== */
    const classModal = document.getElementById('class-modal');
    const deleteModal = document.getElementById('delete-modal');
    const classForm = document.getElementById('class-form');

    const openClassModal = (id = null) => {
        classForm.reset();
        document.getElementById('class-id').value = '';
        document.getElementById('modal-title').textContent = 'ADD NEW CLASS';
        
        // Auto-select current viewed day
        document.getElementById('class-day').value = daysOfWeek[selectedDate.getDay()];

        if (id) {
            const c = timetableData.find(t => t.id === id);
            if (c) {
                document.getElementById('modal-title').textContent = 'EDIT CLASS';
                document.getElementById('class-id').value = c.id;
                document.getElementById('class-day').value = c.day;
                document.getElementById('class-type').value = c.type;
                document.getElementById('class-subject').value = c.subject;
                document.getElementById('class-start').value = c.startTime;
                document.getElementById('class-end').value = c.endTime;
                document.getElementById('class-room').value = c.room;
                document.getElementById('class-instructor').value = c.instructor;
            }
        }
        classModal.classList.add('active');
    };

    const closeModals = () => {
        classModal.classList.remove('active');
        deleteModal.classList.remove('active');
    };

    document.getElementById('close-class-modal').addEventListener('click', closeModals);
    document.getElementById('cancel-class-modal').addEventListener('click', closeModals);
    document.getElementById('cancel-delete-modal').addEventListener('click', closeModals);

    classForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('class-id').value;
        const data = {
            day: document.getElementById('class-day').value,
            type: document.getElementById('class-type').value,
            subject: document.getElementById('class-subject').value,
            startTime: document.getElementById('class-start').value,
            endTime: document.getElementById('class-end').value,
            room: document.getElementById('class-room').value,
            instructor: document.getElementById('class-instructor').value,
        };

        // Basic validation
        if(timeToDate(data.endTime) <= timeToDate(data.startTime)) {
            showToast('End time must be after Start time.', 'error');
            return;
        }

        if (id) {
            // Edit
            const idx = timetableData.findIndex(c => c.id === parseInt(id));
            if (idx > -1) timetableData[idx] = { ...timetableData[idx], ...data };
            showToast('Class updated successfully', 'success');
        } else {
            // Add
            data.id = Date.now();
            timetableData.push(data);
            showToast('Class added successfully', 'success');
            addNotification('SCHEDULE UPDATED', `${data.subject} added to ${data.day}.`);
        }

        saveData();
        renderDashboard();
        closeModals();
    });

    const openDeleteModal = (id) => {
        document.getElementById('delete-class-id').value = id;
        deleteModal.classList.add('active');
    };

    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        const id = parseInt(document.getElementById('delete-class-id').value);
        timetableData = timetableData.filter(c => c.id !== id);
        saveData();
        renderDashboard();
        closeModals();
        showToast('Class removed', 'error');
    });

    /* ==========================================================================
       8. REMINDERS & NOTIFICATIONS
       ========================================================================== */
    const notifiedClasses = new Set(); // Prevent spamming notifications

    const checkReminders = () => {
        const now = new Date();
        const todayClasses = getClassesForDate(now);
        
        todayClasses.forEach(c => {
            if (c.type === 'Break') return;
            const start = timeToDate(c.startTime);
            const diffMs = start - now;
            const diffMins = Math.floor(diffMs / 60000);
            
            // Trigger exactly at 10 minutes before
            if (diffMins === 10 && !notifiedClasses.has(c.id)) {
                notifiedClasses.add(c.id);
                triggerBrowserNotification("UPCOMING CLASS", `${c.subject} starts in 10 minutes at Room ${c.room}.`);
                addNotification("UPCOMING CLASS", `${c.subject} starts in 10 minutes.`);
            }
            
            // Trigger on start
            if (diffMins === 0 && !notifiedClasses.has(c.id + '_start')) {
                notifiedClasses.add(c.id + '_start');
                addNotification("CLASS STARTED", `${c.subject} is now ongoing.`);
            }
        });
    };

    const triggerBrowserNotification = (title, body) => {
        if (Notification.permission === "granted") {
            new Notification(title, { body: body, icon: '../assets/favicon.ico' });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(perm => {
                if(perm === "granted") new Notification(title, { body: body });
            });
        }
    };

    const addNotification = (title, desc) => {
        const list = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge');
        
        list.innerHTML = `
            <div class="notif-item">
                <span class="notif-title"><i class="fas fa-info-circle"></i> ${title}</span>
                <span class="notif-desc">${desc}</span>
            </div>
        ` + list.innerHTML;

        let count = parseInt(badge.textContent) + 1;
        badge.textContent = count;
        badge.style.display = 'flex';
    };

    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-trash-alt';
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    /* ==========================================================================
       9. EVENT LISTENERS SETUP
       ========================================================================== */
    const setupEventListeners = () => {
        // Controls
        document.getElementById('search-input').addEventListener('input', renderTimetable);
        document.getElementById('filter-type').addEventListener('change', renderTimetable);
        document.getElementById('filter-subject').addEventListener('change', renderTimetable);
        
        // Buttons
        document.getElementById('btn-add-class').addEventListener('click', () => openClassModal());
        document.getElementById('qa-add-class').addEventListener('click', () => openClassModal());
        document.getElementById('qa-today').addEventListener('click', () => {
            selectedDate = new Date();
            updateDateSelectorDisplay();
        });

        // Setup notification permission request on first interaction if not set
        document.body.addEventListener('click', () => {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }, { once: true });
    };

    /* ==========================================================================
       10. VOICE ASSISTANT (WEB SPEECH API)
       ========================================================================== */
    const aiOrb = document.getElementById('ai-orb');
    const voiceFeedback = document.getElementById('voice-feedback');
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
            voiceFeedback.innerHTML = '<p class="suggestion" style="color:var(--danger)">Voice not supported in this browser.</p>';
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            aiOrb.classList.add('listening');
            voiceFeedback.innerHTML = '<p class="suggestion" style="color:var(--primary-cyan)">LISTENING...</p>';
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            voiceFeedback.innerHTML = `<p class="suggestion">YOU SAID:<br><strong>"${command}"</strong></p>`;
            setTimeout(() => handleVoiceCommand(command), 800);
        };

        recognition.onerror = () => {
            aiOrb.classList.remove('listening');
            isListening = false;
            voiceFeedback.innerHTML = '<p class="suggestion" style="color:var(--danger)">Microphone error.</p>';
        };

        recognition.onend = () => {
            aiOrb.classList.remove('listening');
            isListening = false;
            setTimeout(() => {
                if(!voiceFeedback.innerHTML.includes('YOU SAID')) {
                     voiceFeedback.innerHTML = '<p class="suggestion">Say:<br><i>"What is my next class?"</i></p>';
                }
            }, 3000);
        };

        try { recognition.start(); } catch(e) {}
    };

    const handleVoiceCommand = (cmd) => {
        let handled = false;

        // Navigation
        const routes = {
            'open dashboard': 'dashboard.html', 'open study': 'study.html',
            'open tasks': 'tasks.html', 'open notes': 'notes.html',
            'open flashcards': 'flashcards.html', 'open ai assistant': 'ai-assistant.html'
        };
        for (const [key, path] of Object.entries(routes)) {
            if (cmd.includes(key)) {
                speak(`Opening ${key.replace('open ', '')}`);
                setTimeout(() => window.location.href = path, 1000);
                handled = true;
                break;
            }
        }

        if(!handled) {
            if (cmd.includes('add class') || cmd.includes('create class')) {
                speak('Opening class scheduler');
                openClassModal();
                handled = true;
            } 
            else if (cmd.includes('show today') || cmd.includes('today\'s timetable')) {
                speak('Showing today\'s timetable');
                selectedDate = new Date();
                updateDateSelectorDisplay();
                handled = true;
            }
            else if (cmd.includes('show tomorrow')) {
                speak('Showing tomorrow\'s timetable');
                const tmrw = new Date();
                tmrw.setDate(tmrw.getDate() + 1);
                selectedDate = tmrw;
                updateDateSelectorDisplay();
                handled = true;
            }
            else if (cmd.includes('next class')) {
                const todayClasses = getClassesForDate(new Date()).filter(c => c.type !== 'Break');
                const next = todayClasses.find(c => calculateStatus(c) === 'UPCOMING');
                if (next) {
                    const response = `Your next class is ${next.subject} at ${formatAMPM(next.startTime)} in room ${next.room}.`;
                    speak(response);
                    voiceFeedback.innerHTML = `<p class="suggestion" style="color:var(--primary-cyan)">${response}</p>`;
                } else {
                    speak('You have no more classes today.');
                }
                handled = true;
            }
        }

        if (!handled) {
            speak("COMMAND NOT RECOGNIZED.");
            voiceFeedback.innerHTML = `<p class="suggestion" style="color:var(--danger)">COMMAND NOT RECOGNIZED</p>`;
        }
    };

    if (aiOrb) aiOrb.addEventListener('click', startListening);

    // Boot Up
    init();
});