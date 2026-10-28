document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. GLOBAL STATE & SAMPLE DATA
       ========================================================================== */
    const STORAGE_KEY = 'jarvisNotes';
    let notes = [];
    let activeTag = null;
    let autoSaveTimer = null;

    const sampleNotes = [
        {
            id: 1,
            title: "DBMS Transactions",
            subject: "DBMS",
            content: "<h2>ACID Properties</h2><p>A transaction is a single logical unit of work. ACID properties guarantee database reliability:</p><ul><li><b>Atomicity:</b> All or nothing execution.</li><li><b>Consistency:</b> Preserves database invariants.</li><li><b>Isolation:</b> Concurrently executed transactions do not interfere.</li><li><b>Durability:</b> Committed data persists across crashes.</li></ul>",
            tags: ["transaction", "serializability", "concurrency"],
            isPinned: true,
            isFavorite: true,
            createdAt: "2026-09-15",
            updatedAt: "2026-09-18 10:30"
        },
        {
            id: 2,
            title: "Python OOP Concepts",
            subject: "Python",
            content: "<h2>Classes and MRO</h2><p>Python leverages multiple inheritance using the C3 linearization algorithm (Method Resolution Order).</p><p>Key pillars include Encapsulation, Polymorphism, and Dunder methods such as <code>__init__</code> and <code>__repr__</code>.</p>",
            tags: ["class", "object", "inheritance"],
            isPinned: false,
            isFavorite: true,
            createdAt: "2026-09-16",
            updatedAt: "2026-09-18 14:15"
        },
        {
            id: 3,
            title: "CSS Z-Index & Stacking Context",
            subject: "Web Programming",
            content: "<p>The <code>z-index</code> property specifies the z-order of positioned elements. A stacking context is formed by elements with opacity &lt; 1, transform properties, or explicit positioning.</p>",
            tags: ["css", "positioning"],
            isPinned: false,
            isFavorite: false,
            createdAt: "2026-09-17",
            updatedAt: "2026-09-17 18:00"
        },
        {
            id: 4,
            title: "Explicit Cursor in PL/SQL",
            subject: "PL/SQL",
            content: "<p>Explicit cursors are constructed for queries returning more than one row. Lifecycle steps:</p><ol><li>DECLARE cursor_name IS query</li><li>OPEN cursor_name</li><li>FETCH cursor_name INTO variables</li><li>CLOSE cursor_name</li></ol>",
            tags: ["cursor", "database", "oracle"],
            isPinned: true,
            isFavorite: false,
            createdAt: "2026-09-17",
            updatedAt: "2026-09-19 09:20"
        },
        {
            id: 5,
            title: "Network Models: OSI vs TCP/IP",
            subject: "Advanced Networks",
            content: "<h2>Model Comparison</h2><p>OSI is a 7-layer theoretical reference framework, while TCP/IP is a 4-layer practical protocol stack used across the global internet.</p>",
            tags: ["osi", "tcp-ip", "networking"],
            isPinned: false,
            isFavorite: false,
            createdAt: "2026-09-18",
            updatedAt: "2026-09-18 11:45"
        },
        {
            id: 6,
            title: "AI in Education",
            subject: "Artificial Intelligence",
            content: "<p>Application of Large Language Models (LLMs) and Adaptive Learning Algorithms in personal tutoring, student dashboard automation, and knowledge synthesis.</p>",
            tags: ["ai", "education", "machine-learning"],
            isPinned: false,
            isFavorite: true,
            createdAt: "2026-09-19",
            updatedAt: "2026-09-19 12:10"
        }
    ];

    /* ==========================================================================
       2. INITIALIZATION
       ========================================================================== */
    const init = () => {
        updateDateTime();
        setInterval(updateDateTime, 60000);
        loadNotes();
        setupEventListeners();
        setupKeyboardShortcuts();
    };

    /* ==========================================================================
       3. DATE, TIME, GREETING & NAVIGATION
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

    // Mobile Sidebar Toggle
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    };
    if (mobileBtn) mobileBtn.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    // Notifications Dropdown
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
       4. LOCAL STORAGE & DATA MANAGEMENT
       ========================================================================== */
    const loadNotes = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                notes = JSON.parse(stored);
            } catch (err) {
                notes = sampleNotes;
                saveNotes();
            }
        } else {
            notes = sampleNotes;
            saveNotes();
        }
        renderAll();
    };

    const saveNotes = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    };

    const getSubjectColor = (subject) => {
        const colorMap = {
            "Web Programming": "var(--subj-web)",
            "DBMS": "var(--subj-dbms)",
            "Python": "var(--subj-python)",
            "Advanced Networks": "var(--subj-networks)",
            "PL/SQL": "var(--subj-plsql)",
            "Artificial Intelligence": "var(--subj-ai)",
            "Other": "var(--subj-other)"
        };
        return colorMap[subject] || "var(--primary-cyan)";
    };

    const formatTimestamp = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    /* ==========================================================================
       5. CRUD OPERATIONS
       ========================================================================== */
    const createNote = (data) => {
        const newNote = {
            id: Date.now(),
            title: data.title,
            subject: data.subject,
            content: data.content,
            tags: data.tags,
            isPinned: false,
            isFavorite: false,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: formatTimestamp()
        };
        notes.unshift(newNote);
        saveNotes();
        renderAll();
        showToast('Note created successfully', 'success');
        addNotification('NOTE CREATED', `${newNote.title} saved successfully.`);
    };

    const updateNote = (id, data) => {
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title: data.title,
                subject: data.subject,
                content: data.content,
                tags: data.tags,
                updatedAt: formatTimestamp()
            };
            saveNotes();
            renderAll();
            showToast('Note updated successfully', 'success');
            addNotification('NOTE UPDATED', `${notes[index].title} updated.`);
        }
    };

    const deleteNote = (id) => {
        const note = notes.find(n => n.id === id);
        const title = note ? note.title : 'Note';
        notes = notes.filter(n => n.id !== id);
        saveNotes();
        renderAll();
        showToast('Note deleted', 'error');
        addNotification('NOTE DELETED', `${title} was removed.`);
    };

    const togglePin = (id) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            note.isPinned = !note.isPinned;
            note.updatedAt = formatTimestamp();
            saveNotes();
            renderAll();
            showToast(note.isPinned ? 'Note pinned' : 'Note unpinned', 'success');
            if (note.isPinned) addNotification('NOTE PINNED', `${note.title} pinned.`);
        }
    };

    const toggleFavorite = (id) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            note.isFavorite = !note.isFavorite;
            note.updatedAt = formatTimestamp();
            saveNotes();
            renderAll();
            showToast(note.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'star');
        }
    };

    /* ==========================================================================
       6. FILTERING, SEARCH & SORT
       ========================================================================== */
    const getFilteredAndSortedNotes = () => {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        const subjectFilter = document.getElementById('filter-subject').value;
        const scopeFilter = document.getElementById('filter-scope').value;
        const sortMode = document.getElementById('sort-notes').value;

        let filtered = notes.filter(note => {
            // Text Search
            const textToSearch = `${note.title} ${note.subject} ${note.tags.join(' ')} ${note.content.replace(/<[^>]*>?/gm, '')}`.toLowerCase();
            const matchesQuery = query === '' || textToSearch.includes(query);

            // Subject Filter
            const matchesSubject = subjectFilter === 'All' || note.subject === subjectFilter;

            // Scope Filter (Pinned / Favorite)
            let matchesScope = true;
            if (scopeFilter === 'Pinned') matchesScope = note.isPinned;
            if (scopeFilter === 'Favorites') matchesScope = note.isFavorite;

            // Active Tag filter
            const matchesTag = !activeTag || note.tags.some(t => t.toLowerCase() === activeTag.toLowerCase());

            return matchesQuery && matchesSubject && matchesScope && matchesTag;
        });

        // Sorting Logic (Pinned notes always priority on top)
        filtered.sort((a, b) => {
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }

            if (sortMode === 'RecentlyUpdated') {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
            if (sortMode === 'RecentlyCreated') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortMode === 'AZ') {
                return a.title.localeCompare(b.title);
            }
            if (sortMode === 'ZA') {
                return b.title.localeCompare(a.title);
            }
            return 0;
        });

        return filtered;
    };

    /* ==========================================================================
       7. RENDERING LOGIC
       ========================================================================== */
    const renderAll = () => {
        const filteredNotes = getFilteredAndSortedNotes();
        renderNotesContainer(filteredNotes);
        updateStatistics();
        renderRecentNotes();
        renderSubjectKnowledge();
        renderKnowledgeChart();
    };

    const renderNotesContainer = (items) => {
        const container = document.getElementById('notes-container');
        const emptyState = document.getElementById('empty-state');
        container.innerHTML = '';

        if (items.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        items.forEach(note => {
            const card = document.createElement('div');
            card.className = `note-card ${note.isPinned ? 'is-pinned' : ''}`;
            card.style.setProperty('--accent-color', getSubjectColor(note.subject));
            card.setAttribute('data-id', note.id);

            // Strip HTML for short preview
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = note.content;
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            // Render tags
            const tagsHtml = note.tags.map(t => `<span class="tag-badge" data-tag="${t}">#${t}</span>`).join('');

            card.innerHTML = `
                <div class="note-top-bar">
                    <span class="note-subject-pill">${note.subject}</span>
                    <div class="note-quick-pins">
                        <button class="note-pin-btn ${note.isPinned ? 'active' : ''}" title="${note.isPinned ? 'Unpin' : 'Pin'} Note" data-action="pin">
                            <i class="fas fa-thumbtack"></i>
                        </button>
                        <button class="note-fav-btn ${note.isFavorite ? 'active' : ''}" title="${note.isFavorite ? 'Unfavorite' : 'Favorite'}" data-action="fav">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>

                <h3 class="note-title">${note.title}</h3>
                <p class="note-excerpt">${plainText}</p>

                <div class="note-tags-list">
                    ${tagsHtml}
                </div>

                <div class="note-footer">
                    <span>Updated: ${note.updatedAt.split(' ')[0]}</span>
                    <div class="note-footer-actions">
                        <button class="btn-card-action edit-action" title="Edit Note" data-action="edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-card-action delete-action" title="Delete Note" data-action="delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;

            // Card click handlers
            card.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-action]');
                const tagBadge = e.target.closest('.tag-badge');

                if (tagBadge) {
                    e.stopPropagation();
                    setTagFilter(tagBadge.getAttribute('data-tag'));
                    return;
                }

                if (actionBtn) {
                    e.stopPropagation();
                    const action = actionBtn.getAttribute('data-action');
                    if (action === 'pin') togglePin(note.id);
                    if (action === 'fav') toggleFavorite(note.id);
                    if (action === 'edit') openEditModal(note.id);
                    if (action === 'delete') openDeleteModal(note.id);
                    return;
                }

                openNoteViewer(note.id);
            });

            container.appendChild(card);
        });
    };

    const updateStatistics = () => {
        const total = notes.length;
        const pinned = notes.filter(n => n.isPinned).length;
        const favorites = notes.filter(n => n.isFavorite).length;

        // Calculate "This Week" (created in last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const thisWeek = notes.filter(n => new Date(n.createdAt) >= sevenDaysAgo).length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-pinned').textContent = pinned;
        document.getElementById('stat-favorites').textContent = favorites;
        document.getElementById('stat-week').textContent = thisWeek;
    };

    const renderRecentNotes = () => {
        const list = document.getElementById('recent-notes-list');
        list.innerHTML = '';

        // Sort by updatedAt descending
        const recents = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4);

        if (recents.length === 0) {
            list.innerHTML = `<div style="font-size:0.8rem; color:var(--text-gray); text-align:center; padding:1rem;">No recent records.</div>`;
            return;
        }

        recents.forEach(note => {
            const item = document.createElement('div');
            item.className = 'recent-note-item';
            item.innerHTML = `
                <div class="recent-note-info">
                    <span class="recent-title">${note.title}</span>
                    <span class="recent-time">${note.subject} • ${note.updatedAt}</span>
                </div>
                <i class="fas fa-arrow-right" style="font-size:0.75rem; color:var(--primary-cyan);"></i>
            `;
            item.addEventListener('click', () => openNoteViewer(note.id));
            list.appendChild(item);
        });
    };

    const renderSubjectKnowledge = () => {
        const list = document.getElementById('subject-knowledge-list');
        list.innerHTML = '';

        const counts = {};
        notes.forEach(n => {
            counts[n.subject] = (counts[n.subject] || 0) + 1;
        });

        const subjectsList = ["Web Programming", "DBMS", "Python", "Advanced Networks", "PL/SQL", "Artificial Intelligence"];

        subjectsList.forEach(subj => {
            const count = counts[subj] || 0;
            const item = document.createElement('div');
            item.className = 'subject-item';
            item.innerHTML = `
                <div class="subject-name">
                    <span class="subject-dot" style="background:${getSubjectColor(subj)};"></span>
                    <span>${subj}</span>
                </div>
                <span class="subject-count">${count} Notes</span>
            `;
            item.addEventListener('click', () => {
                document.getElementById('filter-subject').value = subj;
                renderAll();
            });
            list.appendChild(item);
        });
    };

    const renderKnowledgeChart = () => {
        const container = document.getElementById('knowledge-bars-container');
        container.innerHTML = '';

        const counts = {};
        notes.forEach(n => {
            counts[n.subject] = (counts[n.subject] || 0) + 1;
        });

        const activeSubjects = Object.keys(counts);
        document.getElementById('kb-subjects-count').textContent = activeSubjects.length;
        document.getElementById('kb-pin-fav-count').textContent = `${notes.filter(n => n.isPinned).length} / ${notes.filter(n => n.isFavorite).length}`;

        if (notes.length === 0) return;

        const maxCount = Math.max(...Object.values(counts), 1);

        activeSubjects.forEach(sub => {
            const count = counts[sub];
            const pct = Math.round((count / maxCount) * 100);
            const color = getSubjectColor(sub);

            const row = document.createElement('div');
            row.className = 'chart-bar-row';
            row.innerHTML = `
                <div class="chart-bar-label">
                    <span>${sub}</span>
                    <span>${count}</span>
                </div>
                <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${pct}%; background:${color};"></div>
                </div>
            `;
            container.appendChild(row);
        });
    };

    /* ==========================================================================
       8. TAG FILTERING
       ========================================================================== */
    const setTagFilter = (tag) => {
        activeTag = tag;
        const banner = document.getElementById('active-tag-banner');
        document.getElementById('active-tag-name').textContent = `#${tag}`;
        banner.style.display = 'flex';
        renderAll();
    };

    document.getElementById('clear-tag-btn').addEventListener('click', () => {
        activeTag = null;
        document.getElementById('active-tag-banner').style.display = 'none';
        renderAll();
    });

    /* ==========================================================================
       9. MODALS & RICH TEXT FORMATTING
       ========================================================================== */
    const editorModal = document.getElementById('editor-modal');
    const viewerModal = document.getElementById('viewer-modal');
    const deleteModal = document.getElementById('delete-modal');
    const noteForm = document.getElementById('note-form');
    const contentEditor = document.getElementById('note-content-editor');
    const autoSaveIndicator = document.getElementById('auto-save-status');

    // Toolbar formatting commands
    document.querySelectorAll('.toolbar-btn[data-command]').forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.getAttribute('data-command');
            const val = btn.getAttribute('data-val') || null;
            document.execCommand(command, false, val);
            contentEditor.focus();
        });
    });

    // Custom code block wrapper
    document.getElementById('btn-format-code').addEventListener('click', () => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const selectedText = selection.toString();
        if (selectedText) {
            document.execCommand('insertHTML', false, `<code class="code-block">${selectedText}</code>`);
        } else {
            document.execCommand('insertHTML', false, `<code class="code-block">code_snippet</code>`);
        }
    });

    // Open New Note Modal
    const openNewNoteModal = () => {
        noteForm.reset();
        document.getElementById('note-id').value = '';
        contentEditor.innerHTML = '';
        document.getElementById('editor-modal-title').textContent = 'NEW NOTE';
        autoSaveIndicator.innerHTML = '<i class="fas fa-circle"></i> READY';
        autoSaveIndicator.classList.remove('saving');
        editorModal.classList.add('active');
        document.getElementById('note-title-input').focus();
    };

    // Open Edit Modal
    const openEditModal = (id) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        document.getElementById('note-id').value = note.id;
        document.getElementById('note-title-input').value = note.title;
        document.getElementById('note-subject-input').value = note.subject;
        contentEditor.innerHTML = note.content;
        document.getElementById('note-tags-input').value = note.tags.join(', ');

        document.getElementById('editor-modal-title').textContent = 'EDIT NOTE';
        autoSaveIndicator.innerHTML = '<i class="fas fa-circle"></i> SAVED';
        autoSaveIndicator.classList.remove('saving');

        if (viewerModal.classList.contains('active')) {
            viewerModal.classList.remove('active');
        }

        editorModal.classList.add('active');
    };

    // Open Note Viewer
    const openNoteViewer = (id) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        document.getElementById('viewer-subject').textContent = note.subject;
        document.getElementById('viewer-subject').style.color = getSubjectColor(note.subject);
        document.getElementById('viewer-title').textContent = note.title;

        // Tags
        const tagsContainer = document.getElementById('viewer-tags');
        tagsContainer.innerHTML = note.tags.map(t => `<span class="tag-badge" data-tag="${t}">#${t}</span>`).join('');
        tagsContainer.querySelectorAll('.tag-badge').forEach(badge => {
            badge.addEventListener('click', () => {
                viewerModal.classList.remove('active');
                setTagFilter(badge.getAttribute('data-tag'));
            });
        });

        // Content & Timestamps
        document.getElementById('viewer-content').innerHTML = note.content;
        document.getElementById('viewer-created').textContent = `Created: ${note.createdAt}`;
        document.getElementById('viewer-updated').textContent = `Updated: ${note.updatedAt}`;

        // Viewer Pin & Favorite buttons state
        const pinBtn = document.getElementById('viewer-pin-btn');
        const favBtn = document.getElementById('viewer-fav-btn');

        pinBtn.innerHTML = `<i class="fas fa-thumbtack"></i> ${note.isPinned ? 'UNPIN' : 'PIN'}`;
        favBtn.innerHTML = `<i class="fas fa-star"></i> ${note.isFavorite ? 'UNFAVORITE' : 'FAVORITE'}`;

        pinBtn.onclick = () => {
            togglePin(note.id);
            openNoteViewer(note.id); // re-sync viewer
        };
        favBtn.onclick = () => {
            toggleFavorite(note.id);
            openNoteViewer(note.id); // re-sync viewer
        };

        document.getElementById('viewer-edit-btn').onclick = () => openEditModal(note.id);
        document.getElementById('viewer-del-btn').onclick = () => openDeleteModal(note.id);

        viewerModal.classList.add('active');
    };

    // Open Delete Modal
    const openDeleteModal = (id) => {
        document.getElementById('delete-note-id').value = id;
        deleteModal.classList.add('active');
    };

    // Close Modals
    const closeAllModals = () => {
        editorModal.classList.remove('active');
        viewerModal.classList.remove('active');
        deleteModal.classList.remove('active');
        if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };

    document.getElementById('close-editor-modal').addEventListener('click', closeAllModals);
    document.getElementById('cancel-editor-btn').addEventListener('click', closeAllModals);
    document.getElementById('close-viewer-modal').addEventListener('click', closeAllModals);
    document.getElementById('cancel-delete-modal').addEventListener('click', closeAllModals);

    // Save/Submit Note Form
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('note-id').value;
        const title = document.getElementById('note-title-input').value.trim();
        const subject = document.getElementById('note-subject-input').value;
        const content = contentEditor.innerHTML.trim();
        const rawTags = document.getElementById('note-tags-input').value;

        if (!title || !content || content === '<br>') {
            showToast('Title and content are required', 'error');
            return;
        }

        const tags = rawTags
            .split(',')
            .map(t => t.trim().replace(/^#/, ''))
            .filter(t => t.length > 0);

        const data = { title, subject, content, tags };

        if (id) {
            updateNote(parseInt(id), data);
        } else {
            createNote(data);
        }

        closeAllModals();
    });

    // Confirm Delete Action
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        const id = parseInt(document.getElementById('delete-note-id').value);
        if (id) {
            deleteNote(id);
            closeAllModals();
        }
    });

    // Auto-Save feature on typing
    const triggerAutoSaveDraft = () => {
        const currentId = document.getElementById('note-id').value;
        if (!currentId) return; // Only auto-save existing records

        autoSaveIndicator.innerHTML = '<i class="fas fa-circle"></i> SAVING...';
        autoSaveIndicator.classList.add('saving');

        if (autoSaveTimer) clearTimeout(autoSaveTimer);

        autoSaveTimer = setTimeout(() => {
            const note = notes.find(n => n.id === parseInt(currentId));
            if (note) {
                note.title = document.getElementById('note-title-input').value.trim() || note.title;
                note.subject = document.getElementById('note-subject-input').value;
                note.content = contentEditor.innerHTML.trim() || note.content;
                note.updatedAt = formatTimestamp();
                saveNotes();
                renderAll();
                autoSaveIndicator.innerHTML = '<i class="fas fa-circle"></i> SAVED';
                autoSaveIndicator.classList.remove('saving');
            }
        }, 1500);
    };

    contentEditor.addEventListener('input', triggerAutoSaveDraft);
    document.getElementById('note-title-input').addEventListener('input', triggerAutoSaveDraft);

    /* ==========================================================================
       10. EVENT LISTENERS & SHORTCUTS
       ========================================================================== */
    const setupEventListeners = () => {
        document.getElementById('btn-new-note').addEventListener('click', openNewNoteModal);
        document.getElementById('btn-empty-create').addEventListener('click', openNewNoteModal);

        // Search & Filters
        document.getElementById('search-input').addEventListener('input', renderAll);
        document.getElementById('filter-subject').addEventListener('change', renderAll);
        document.getElementById('filter-scope').addEventListener('change', renderAll);
        document.getElementById('sort-notes').addEventListener('change', renderAll);

        // View Toggles
        const gridBtn = document.getElementById('view-grid-btn');
        const listBtn = document.getElementById('view-list-btn');
        const container = document.getElementById('notes-container');

        gridBtn.addEventListener('click', () => {
            gridBtn.classList.add('active');
            listBtn.classList.remove('active');
            container.classList.remove('list-view');
            container.classList.add('grid-view');
        });

        listBtn.addEventListener('click', () => {
            listBtn.classList.add('active');
            gridBtn.classList.remove('active');
            container.classList.remove('grid-view');
            container.classList.add('list-view');
        });
    };

    const setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                closeAllModals();
            }
            // Ctrl+N -> New Note
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                openNewNoteModal();
            }
            // Ctrl+F -> Focus Search
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const search = document.getElementById('search-input');
                search.focus();
                search.select();
            }
        });
    };

    /* ==========================================================================
       11. TOASTS & NOTIFICATIONS
       ========================================================================== */
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-trash-alt';
        if (type === 'star') icon = 'fa-star';

        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const notificationStore = [];
    const addNotification = (title, desc) => {
        notificationStore.unshift({ title, desc });
        const badge = document.getElementById('notif-badge-count');
        const list = document.getElementById('notif-list');

        badge.textContent = notificationStore.length;
        badge.style.display = 'flex';

        list.innerHTML = notificationStore.slice(0, 5).map(n => `
            <div class="notif-item">
                <span class="notif-item-title">${n.title}</span>
                <span class="notif-item-desc">${n.desc}</span>
            </div>
        `).join('');
    };

    /* ==========================================================================
       12. VOICE CONTROL (WEB SPEECH API)
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
            voiceFeedback.innerHTML = '<p class="suggestion" style="color:var(--danger)">Speech API unavailable in this browser.</p>';
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
                if (!voiceFeedback.innerHTML.includes('YOU SAID')) {
                    voiceFeedback.innerHTML = '<p class="suggestion">Try saying:<br><i>"Create note" or "Search DBMS"</i></p>';
                }
            }, 3000);
        };

        try { recognition.start(); } catch (e) {}
    };

    const handleVoiceCommand = (cmd) => {
        let handled = false;

        // Navigation
        const routes = {
            'open dashboard': '../pages/dashboard.html',
            'open study': '../pages/study.html',
            'open tasks': '../pages/tasks.html',
            'open timetable': '../pages/timetable.html',
            'open flashcards': '../pages/flashcards.html',
            'open ai assistant': '../pages/ai-assistant.html'
        };

        for (const [key, path] of Object.entries(routes)) {
            if (cmd.includes(key)) {
                speak(`Opening ${key.replace('open ', '')}`);
                setTimeout(() => window.location.href = path, 1000);
                handled = true;
                break;
            }
        }

        if (!handled) {
            if (cmd.includes('create note') || cmd.includes('new note')) {
                speak('Opening new note editor');
                openNewNoteModal();
                handled = true;
            } else if (cmd.includes('show pinned')) {
                speak('Filtering pinned notes');
                document.getElementById('filter-scope').value = 'Pinned';
                renderAll();
                handled = true;
            } else if (cmd.includes('show favorites')) {
                speak('Filtering favorite notes');
                document.getElementById('filter-scope').value = 'Favorites';
                renderAll();
                handled = true;
            } else if (cmd.includes('show all notes') || cmd.includes('all notes')) {
                speak('Displaying all notes');
                document.getElementById('filter-scope').value = 'All';
                document.getElementById('filter-subject').value = 'All';
                document.getElementById('search-input').value = '';
                activeTag = null;
                document.getElementById('active-tag-banner').style.display = 'none';
                renderAll();
                handled = true;
            } else if (cmd.startsWith('search')) {
                const query = cmd.replace('search', '').trim();
                speak(`Searching for ${query}`);
                document.getElementById('search-input').value = query;
                renderAll();
                handled = true;
            }
        }

        if (!handled) {
            speak('COMMAND NOT RECOGNIZED');
            voiceFeedback.innerHTML = `<p class="suggestion" style="color:var(--danger)">COMMAND NOT RECOGNIZED</p>`;
        }
    };

    if (aiOrb) {
        aiOrb.addEventListener('click', startListening);
        aiOrb.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startListening();
            }
        });
    }

    // Launch Application
    init();
});