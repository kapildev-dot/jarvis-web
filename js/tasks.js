document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. GLOBAL VARIABLES & INITIALIZATION
       ========================================================================== */
    const STORAGE_KEY = 'jarvisTasks';
    let tasksList = [];

    // Sample data for empty initialization
    const sampleTasks = [
        { id: 1, title: "Complete DBMS Transaction Notes", description: "Revise transaction and serializability topics", category: "Assignment", priority: "High", dueDate: "2026-09-20", dueTime: "18:00", completed: false, createdAt: "2026-09-18" },
        { id: 2, title: "Practice C++ Inheritance Program", description: "Write programs demonstrating multiple and multilevel inheritance.", category: "Study", priority: "Medium", dueDate: "2026-09-21", dueTime: "14:00", completed: false, createdAt: "2026-09-19" },
        { id: 3, title: "Prepare Python Viva Questions", description: "Focus on generators, decorators, and object-oriented concepts.", category: "Exam", priority: "High", dueDate: "2026-09-19", dueTime: "09:00", completed: false, createdAt: "2026-09-15" },
        { id: 4, title: "Complete Smart Student Dashboard", description: "Finish the Task Management UI page for KAPISH JARVIS.", category: "Project", priority: "High", dueDate: "2026-09-25", dueTime: "23:59", completed: false, createdAt: "2026-09-10" },
        { id: 5, title: "Revise Advanced Networks Unit 1", description: "OSI Model and TCP/IP protocol suite comparison.", category: "Study", priority: "Medium", dueDate: "2026-09-22", dueTime: "17:00", completed: true, createdAt: "2026-09-18" }
    ];

    const init = () => {
        updateDateTime();
        setInterval(updateDateTime, 60000); // Update clock every minute
        loadTasks();
        setupEventListeners();
    };

    /* ==========================================================================
       2. DATE, TIME, GREETING & SIDEBAR
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
        document.getElementById('date-display').textContent = now.toLocaleDateString('en-US', options);
    };

    // Mobile Sidebar
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    };
    if(mobileBtn) mobileBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar);

    // Notifications Dropdown Toggle
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
       3. CORE TASK LOGIC (CRUD & LocalStorage)
       ========================================================================== */
    const loadTasks = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            tasksList = JSON.parse(stored);
        } else {
            tasksList = sampleTasks;
            saveTasks();
        }
        renderDashboard();
    };

    const saveTasks = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksList));
    };

    const createTask = (data) => {
        const newTask = {
            id: Date.now(),
            ...data,
            completed: false,
            createdAt: new Date().toISOString().split('T')[0]
        };
        tasksList.push(newTask);
        saveTasks();
        renderDashboard();
        showToast('Task added successfully', 'success');
        updateNotifications();
    };

    const updateTask = (id, data) => {
        const index = tasksList.findIndex(t => t.id === id);
        if (index > -1) {
            tasksList[index] = { ...tasksList[index], ...data };
            saveTasks();
            renderDashboard();
            showToast('Task updated successfully', 'success');
            updateNotifications();
        }
    };

    const deleteTask = (id) => {
        tasksList = tasksList.filter(t => t.id !== id);
        saveTasks();
        renderDashboard();
        showToast('Task deleted', 'error');
        updateNotifications();
    };

    const toggleTask = (id, completedStatus) => {
        const task = tasksList.find(t => t.id === id);
        if (task) {
            task.completed = completedStatus;
            saveTasks();
            renderDashboard();
            if(completedStatus) showToast('Task marked as completed', 'success');
        }
    };

    /* ==========================================================================
       4. RENDERING & UI UPDATES
       ========================================================================== */
    
    // Master render function
    const renderDashboard = () => {
        const filtered = getFilteredAndSortedTasks();
        renderTasksList(filtered);
        updateStats();
        renderProgress();
        renderTodayFocus();
        updateNotifications();
    };

    // Helper: Determine task date status (Overdue, Due Today, etc.)
    const getTaskDateStatus = (dateStr, completed) => {
        if (!dateStr || completed) return { text: `Due: ${formatDateDisplay(dateStr)}`, class: '' };
        
        // Ensure accurate local comparison
        const due = new Date(dateStr);
        due.setHours(0,0,0,0);
        const today = new Date();
        today.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (due < today) return { text: 'OVERDUE', class: 'overdue-text' };
        if (due.getTime() === today.getTime()) return { text: 'DUE TODAY', class: 'today-text' };
        if (due.getTime() === tomorrow.getTime()) return { text: 'DUE TOMORROW', class: '' };
        
        return { text: `Due: ${formatDateDisplay(dateStr)}`, class: '' };
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return 'No Date';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const renderTasksList = (tasksToRender) => {
        const container = document.getElementById('tasks-list');
        const emptyState = document.getElementById('empty-state');
        
        container.innerHTML = '';

        if (tasksToRender.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            
            tasksToRender.forEach(task => {
                const dateStatus = getTaskDateStatus(task.dueDate, task.completed);
                const completedBadge = task.completed ? `<span class="badge-completed">COMPLETED</span>` : '';
                
                const card = document.createElement('div');
                card.className = `task-card ${task.completed ? 'completed' : ''}`;
                card.innerHTML = `
                    <div class="task-checkbox-container">
                        <input type="checkbox" class="custom-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    </div>
                    <div class="task-content">
                        <div class="task-header">
                            <h3 class="task-title">${task.title}</h3>
                        </div>
                        <div class="task-badges">
                            ${completedBadge}
                            <span class="badge-priority priority-${task.priority.toLowerCase()}">${task.priority.toUpperCase()}</span>
                            <span class="badge-category">${task.category}</span>
                        </div>
                        <p class="task-desc">${task.description || 'No description provided.'}</p>
                        
                        <div class="task-footer">
                            <div class="task-dates">
                                <span class="task-date-due ${dateStatus.class}">
                                    <i class="fas ${dateStatus.class === 'overdue-text' ? 'fa-exclamation-circle' : 'fa-calendar-day'}"></i> 
                                    ${dateStatus.text} ${task.dueTime && !task.completed ? `at ${task.dueTime}` : ''}
                                </span>
                                <span>Created: ${formatDateDisplay(task.createdAt)}</span>
                            </div>
                            <div class="task-actions">
                                <button class="btn-icon btn-edit" data-id="${task.id}" title="Edit Task"><i class="fas fa-edit"></i></button>
                                <button class="btn-icon btn-delete" data-id="${task.id}" title="Delete Task"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            // Attach Events to new DOM elements
            attachTaskItemEvents();
        }
    };

    const attachTaskItemEvents = () => {
        document.querySelectorAll('.custom-checkbox').forEach(box => {
            box.addEventListener('change', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                toggleTask(id, e.target.checked);
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                openTaskModal(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                openDeleteModal(id);
            });
        });
    };

    const updateStats = () => {
        const total = tasksList.length;
        const completed = tasksList.filter(t => t.completed).length;
        const pending = total - completed;
        
        // Calculate Overdue
        const today = new Date();
        today.setHours(0,0,0,0);
        const overdue = tasksList.filter(t => {
            if(t.completed || !t.dueDate) return false;
            const due = new Date(t.dueDate);
            due.setHours(0,0,0,0);
            return due < today;
        }).length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-completed').textContent = completed;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-overdue').textContent = overdue;
    };

    const renderProgress = () => {
        const total = tasksList.length;
        const completed = tasksList.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        document.getElementById('progress-text').textContent = `${completed} / ${total} Tasks Completed`;
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('task-progress-bar').style.width = `${percentage}%`;
    };

    const renderTodayFocus = () => {
        const container = document.getElementById('today-focus-list');
        const today = new Date();
        today.setHours(0,0,0,0);

        // Get pending tasks due today or overdue
        let focusTasks = tasksList.filter(t => {
            if(t.completed || !t.dueDate) return false;
            const due = new Date(t.dueDate);
            due.setHours(0,0,0,0);
            return due <= today;
        });

        // Sort by priority (High > Medium > Low)
        const priorityScore = { "High": 3, "Medium": 2, "Low": 1 };
        focusTasks.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

        // Take top 3
        focusTasks = focusTasks.slice(0, 3);

        container.innerHTML = '';

        if(focusTasks.length === 0) {
            container.innerHTML = `
                <div class="focus-empty">
                    <i class="fas fa-check-circle"></i>
                    NO URGENT TASKS<br>You're clear for today.
                </div>
            `;
        } else {
            focusTasks.forEach((t, i) => {
                const item = document.createElement('div');
                item.className = 'focus-item';
                item.innerHTML = `
                    <span class="focus-num">0${i+1}</span>
                    <span class="focus-title">${t.title}</span>
                    <div class="focus-meta">
                        <span>${t.priority.toUpperCase()} PRIORITY</span>
                        <span>${getTaskDateStatus(t.dueDate, false).text}</span>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    };

    const updateNotifications = () => {
        const notifList = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge-count');
        notifList.innerHTML = '';
        
        const today = new Date();
        today.setHours(0,0,0,0);
        let count = 0;

        tasksList.forEach(t => {
            if(t.completed || !t.dueDate) return;
            const due = new Date(t.dueDate);
            due.setHours(0,0,0,0);
            
            if(due < today) {
                count++;
                notifList.innerHTML += `
                    <div class="notif-item">
                        <span class="notif-title overdue"><i class="fas fa-exclamation-triangle"></i> OVERDUE TASK</span>
                        <span class="notif-desc">${t.title}</span>
                    </div>`;
            } else if (due.getTime() === today.getTime()) {
                count++;
                notifList.innerHTML += `
                    <div class="notif-item">
                        <span class="notif-title today"><i class="fas fa-clock"></i> TASK DUE TODAY</span>
                        <span class="notif-desc">${t.title}</span>
                    </div>`;
            }
        });

        if(count === 0) {
            notifList.innerHTML = `<div class="empty-notif">No new notifications</div>`;
            badge.style.display = 'none';
        } else {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
    };

    /* ==========================================================================
       5. FILTER, SORT & SEARCH LOGIC
       ========================================================================== */
    const getFilteredAndSortedTasks = () => {
        const searchQ = document.getElementById('search-input').value.toLowerCase();
        const statusF = document.getElementById('filter-status').value;
        const priorityF = document.getElementById('filter-priority').value;
        const categoryF = document.getElementById('filter-category').value;
        const sortType = document.getElementById('sort-tasks').value;

        // Filter
        let result = tasksList.filter(t => {
            // Search
            const matchesSearch = t.title.toLowerCase().includes(searchQ) || 
                                 (t.description && t.description.toLowerCase().includes(searchQ)) ||
                                 t.category.toLowerCase().includes(searchQ);
            
            // Status
            let matchesStatus = true;
            if (statusF === 'Pending') matchesStatus = !t.completed;
            if (statusF === 'Completed') matchesStatus = t.completed;
            if (statusF === 'Overdue') {
                if(t.completed || !t.dueDate) { matchesStatus = false; }
                else {
                    const due = new Date(t.dueDate); due.setHours(0,0,0,0);
                    const today = new Date(); today.setHours(0,0,0,0);
                    matchesStatus = due < today;
                }
            }

            // Priority & Category
            const matchesPriority = priorityF === 'All' || t.priority === priorityF;
            const matchesCategory = categoryF === 'All' || t.category === categoryF;

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });

        // Sort
        result.sort((a, b) => {
            if (sortType === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortType === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortType === 'DueDate') {
                if(!a.dueDate) return 1; if(!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (sortType === 'Priority') {
                const scores = { "High": 3, "Medium": 2, "Low": 1 };
                return scores[b.priority] - scores[a.priority];
            }
            return 0;
        });

        return result;
    };

    const setupEventListeners = () => {
        // Control Inputs
        document.getElementById('search-input').addEventListener('input', renderDashboard);
        document.getElementById('filter-status').addEventListener('change', renderDashboard);
        document.getElementById('filter-priority').addEventListener('change', renderDashboard);
        document.getElementById('filter-category').addEventListener('change', renderDashboard);
        document.getElementById('sort-tasks').addEventListener('change', renderDashboard);

        // Buttons
        document.getElementById('btn-add-task').addEventListener('click', () => openTaskModal());
        document.getElementById('btn-empty-add').addEventListener('click', () => openTaskModal());
        document.getElementById('qa-add-task').addEventListener('click', () => openTaskModal());
    };

    /* ==========================================================================
       6. MODALS LOGIC
       ========================================================================== */
    const taskModal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-modal');
    const taskForm = document.getElementById('task-form');
    
    // Add / Edit Modal
    const openTaskModal = (id = null) => {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        
        if (id) {
            // Edit Mode
            const task = tasksList.find(t => t.id === id);
            if(task) {
                document.getElementById('modal-title').textContent = "EDIT TASK";
                document.getElementById('submit-task-btn').textContent = "SAVE CHANGES";
                document.getElementById('task-id').value = task.id;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-desc').value = task.description;
                document.getElementById('task-category').value = task.category;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-date').value = task.dueDate || '';
                document.getElementById('task-time').value = task.dueTime || '';
            }
        } else {
            // Add Mode
            document.getElementById('modal-title').textContent = "ADD NEW TASK";
            document.getElementById('submit-task-btn').textContent = "ADD TASK";
            // Default to today
            const todayStr = new Date().toISOString().split('T')[0];
            document.getElementById('task-date').value = todayStr;
        }
        taskModal.classList.add('active');
    };

    const closeTaskModal = () => taskModal.classList.remove('active');
    document.getElementById('close-task-modal').addEventListener('click', closeTaskModal);
    document.getElementById('cancel-task-modal').addEventListener('click', closeTaskModal);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            category: document.getElementById('task-category').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-date').value,
            dueTime: document.getElementById('task-time').value
        };

        if (id) { updateTask(parseInt(id), taskData); } 
        else { createTask(taskData); }
        
        closeTaskModal();
    });

    // Delete Modal
    const openDeleteModal = (id) => {
        document.getElementById('delete-task-id').value = id;
        deleteModal.classList.add('active');
    };
    const closeDeleteModal = () => deleteModal.classList.remove('active');
    document.getElementById('cancel-delete-modal').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        const id = document.getElementById('delete-task-id').value;
        if(id) deleteTask(parseInt(id));
        closeDeleteModal();
    });

    /* ==========================================================================
       7. TOAST NOTIFICATIONS
       ========================================================================== */
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-trash-alt' : 'fa-info-circle';
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    /* ==========================================================================
       8. VOICE CONTROL (Web Speech API)
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
                     voiceFeedback.innerHTML = '<p class="suggestion">Say:<br><i>"Show pending tasks"</i></p>';
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
            'open notes': 'notes.html', 'open timetable': 'timetable.html',
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
            if (cmd.includes('add task') || cmd.includes('create task')) {
                speak('Opening add task panel');
                openTaskModal();
                handled = true;
            } else if (cmd.includes('show pending') || cmd.includes('pending tasks')) {
                speak('Filtering pending tasks');
                document.getElementById('filter-status').value = 'Pending';
                renderDashboard();
                handled = true;
            } else if (cmd.includes('show completed') || cmd.includes('completed tasks')) {
                speak('Showing completed tasks');
                document.getElementById('filter-status').value = 'Completed';
                renderDashboard();
                handled = true;
            } else if (cmd.includes('show overdue') || cmd.includes('overdue tasks')) {
                speak('Checking overdue tasks');
                document.getElementById('filter-status').value = 'Overdue';
                renderDashboard();
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