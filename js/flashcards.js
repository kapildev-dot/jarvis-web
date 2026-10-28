document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. GLOBAL STATE & CONSTANTS
       ========================================================================== */
    const STORAGE_DECKS = 'jarvisFlashcardDecks';
    const STORAGE_CARDS = 'jarvisFlashcards';
    const STORAGE_PROGRESS = 'jarvisFlashcardProgress';
    const STORAGE_QUIZ = 'jarvisQuizHistory';

    let decks = [];
    let cards = [];
    let progress = {
        lastStudyDate: null,
        currentStreak: 0,
        longestStreak: 0,
        studiedToday: 0,
        dailyGoal: 30,
        streakLog: {} // Format: "YYYY-MM-DD": true
    };

    // View States
    let currentMode = 'dashboard'; // dashboard, deck-details, study, quiz
    let studyMode = 'flashcard'; // flashcard, review
    let currentDeckId = null;
    
    // Active Study/Quiz Arrays
    let activeCards = [];
    let currentIndex = 0;
    
    // Quiz State
    let quizState = {
        score: 0,
        total: 0,
        isAnswered: false,
        difficultyFilter: 'Mixed'
    };

    /* ==========================================================================
       2. SAMPLE DATA GENERATION
       ========================================================================== */
    const createSampleData = () => {
        const today = new Date().toISOString().split('T')[0];
        
        decks = [
            { id: 1, name: "DBMS Internals", subject: "DBMS", description: "Database concepts and transaction management.", createdAt: today },
            { id: 2, name: "Python Core", subject: "Python", description: "OOP, generators, and decorators.", createdAt: today },
            { id: 3, name: "Web Basics", subject: "Web Programming", description: "HTML, CSS properties, JavaScript.", createdAt: today },
            { id: 4, name: "Oracle PL/SQL", subject: "PL/SQL", description: "Cursors, triggers, and procedures.", createdAt: today }
        ];

        cards = [
            // DBMS
            { id: 1, deckId: 1, question: "What is a database transaction?", answer: "A logical unit of work that consists of one or more database operations.", category: "Transactions", difficulty: "Medium", hint: "Single logical unit", mastery: 40, reviewCount: 2, nextReview: today },
            { id: 2, deckId: 1, question: "What does ACID stand for?", answer: "Atomicity, Consistency, Isolation, and Durability.", category: "Concepts", difficulty: "Easy", hint: "Four core properties", mastery: 90, reviewCount: 5, nextReview: "2026-09-25" },
            { id: 3, deckId: 1, question: "What is serializability?", answer: "A property of a schedule where concurrent execution is equivalent to some serial execution.", category: "Concurrency", difficulty: "Hard", hint: "Equivalent to serial", mastery: 20, reviewCount: 1, nextReview: today },
            // Python
            { id: 4, deckId: 2, question: "What is a class?", answer: "A blueprint for creating objects, providing initial values for state and implementations of behavior.", category: "OOP", difficulty: "Easy", hint: "Blueprint", mastery: 85, reviewCount: 4, nextReview: "2026-09-22" },
            { id: 5, deckId: 2, question: "What is inheritance?", answer: "A mechanism where one class acquires the properties and behavior of another class.", category: "OOP", difficulty: "Medium", hint: "Parent to child", mastery: 50, reviewCount: 2, nextReview: today },
            // Web
            { id: 6, deckId: 3, question: "What does CSS z-index control?", answer: "The stacking order of positioned elements along the z-axis.", category: "CSS", difficulty: "Medium", hint: "Stacking", mastery: 60, reviewCount: 3, nextReview: "2026-09-20" },
            { id: 7, deckId: 3, question: "What is JavaScript?", answer: "A programming language commonly used to create interactive effects within web browsers.", category: "JS", difficulty: "Easy", hint: "Interactivity", mastery: 95, reviewCount: 6, nextReview: "2026-09-28" },
            // PL/SQL
            { id: 8, deckId: 4, question: "What is an explicit cursor?", answer: "A cursor explicitly declared and controlled by the programmer for processing multi-row queries.", category: "Cursors", difficulty: "Medium", hint: "Programmer controlled", mastery: 30, reviewCount: 1, nextReview: today }
        ];

        saveAllData();
    };

    /* ==========================================================================
       3. DATA LOADING & SAVING
       ========================================================================== */
    const loadAllData = () => {
        const storedDecks = localStorage.getItem(STORAGE_DECKS);
        const storedCards = localStorage.getItem(STORAGE_CARDS);
        const storedProg = localStorage.getItem(STORAGE_PROGRESS);

        if (storedDecks && storedCards) {
            decks = JSON.parse(storedDecks);
            cards = JSON.parse(storedCards);
        } else {
            createSampleData();
        }

        if (storedProg) {
            progress = JSON.parse(storedProg);
        }
        
        checkAndUpdateStreak();
    };

    const saveAllData = () => {
        localStorage.setItem(STORAGE_DECKS, JSON.stringify(decks));
        localStorage.setItem(STORAGE_CARDS, JSON.stringify(cards));
        localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progress));
    };

    const checkAndUpdateStreak = () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (progress.lastStudyDate) {
            const last = new Date(progress.lastStudyDate);
            const current = new Date(today);
            const diffTime = Math.abs(current - last);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Streak continues, do nothing here (updated when study happens)
            } else if (diffDays > 1) {
                // Streak broken
                progress.currentStreak = 0;
                progress.studiedToday = 0;
            } else if (diffDays === 0) {
                // Already studied today
            }
        } else {
            progress.studiedToday = 0;
        }
        saveAllData();
    };

    const logStudyAction = () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (progress.lastStudyDate !== today) {
            progress.currentStreak++;
            if (progress.currentStreak > progress.longestStreak) {
                progress.longestStreak = progress.currentStreak;
            }
            progress.streakLog[today] = true;
            progress.studiedToday = 0; 
            progress.lastStudyDate = today;
        }
        
        progress.studiedToday++;
        saveAllData();
        updateDashboardStats();
        renderGoalAndStreak();
    };

    /* ==========================================================================
       4. INITIALIZATION & ROUTING
       ========================================================================== */
    const init = () => {
        updateClock();
        setInterval(updateClock, 1000);
        loadAllData();
        setupEventListeners();
        setupKeyboardShortcuts();
        showView('dashboard');
    };

    const updateClock = () => {
        const now = new Date();
        document.getElementById('live-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('live-date').textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        
        const hour = now.getHours();
        let greeting = "GOOD EVENING";
        if (hour >= 5 && hour < 12) greeting = "GOOD MORNING";
        else if (hour >= 12 && hour < 18) greeting = "GOOD AFTERNOON";
        const el = document.getElementById('greeting-text');
        if(el) el.textContent = `${greeting}, KAPISH`;
    };

    const showView = (viewName) => {
        currentMode = viewName;
        document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
        
        if (viewName === 'dashboard') {
            document.getElementById('view-dashboard').style.display = 'flex';
            renderDashboard();
        } else if (viewName === 'deck-details') {
            document.getElementById('view-deck-details').style.display = 'block';
            renderDeckDetails();
        } else if (viewName === 'study') {
            document.getElementById('view-study').style.display = 'flex';
            document.getElementById('jarvis-progress').textContent = `${progress.studiedToday}/${progress.dailyGoal}`;
            startStudySession();
        } else if (viewName === 'quiz') {
            document.getElementById('view-quiz').style.display = 'flex';
            runQuizEngine();
        }
    };

    /* ==========================================================================
       5. DASHBOARD RENDERING
       ========================================================================== */
    const renderDashboard = () => {
        updateDashboardStats();
        renderDecksGrid();
        renderReviewQueue();
        renderGoalAndStreak();
    };

    const updateDashboardStats = () => {
        const total = cards.length;
        const mastered = cards.filter(c => c.mastery >= 90).length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const toReview = cards.filter(c => c.nextReview <= todayStr && c.mastery < 90).length;

        document.getElementById('stat-total-cards').textContent = total;
        document.getElementById('stat-mastered').textContent = mastered;
        document.getElementById('stat-to-review').textContent = toReview;
        document.getElementById('stat-streak').textContent = `${progress.currentStreak} DAYS`;
        
        document.getElementById('jarvis-queue-count').textContent = toReview;
        document.getElementById('jarvis-progress').textContent = `${progress.studiedToday}/${progress.dailyGoal}`;
    };

    const calculateDeckMastery = (deckId) => {
        const deckCards = cards.filter(c => c.deckId === deckId);
        if (deckCards.length === 0) return 0;
        const totalMastery = deckCards.reduce((sum, c) => sum + c.mastery, 0);
        return Math.round(totalMastery / deckCards.length);
    };

    const getSubjectIcon = (subject) => {
        const m = {
            "DBMS": "fa-database", "Python": "fa-python", "Web Programming": "fa-code",
            "Advanced Networks": "fa-network-wired", "PL/SQL": "fa-server", "Artificial Intelligence": "fa-brain"
        };
        return m[subject] || "fa-book";
    };

    const renderDecksGrid = () => {
        const container = document.getElementById('decks-grid');
        container.innerHTML = '';

        decks.forEach(deck => {
            const count = cards.filter(c => c.deckId === deck.id).length;
            const mastery = calculateDeckMastery(deck.id);
            const icon = getSubjectIcon(deck.subject);

            const div = document.createElement('div');
            div.className = 'deck-card';
            div.innerHTML = `
                <div class="dc-top">
                    <div class="dc-icon"><i class="fas ${icon}"></i></div>
                    <span class="dc-count">${count} Cards</span>
                </div>
                <div class="dc-title" title="${deck.name}">${deck.name}</div>
                <div class="dc-mastery">
                    <div class="dc-m-lbl"><span>Mastery</span><span>${mastery}%</span></div>
                    <div class="dc-m-bar-bg"><div class="dc-m-bar-fill" style="width: ${mastery}%"></div></div>
                </div>
                <button class="btn-study-deck" data-id="${deck.id}">OPEN DECK</button>
            `;
            container.appendChild(div);
        });

        document.querySelectorAll('.btn-study-deck').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentDeckId = parseInt(e.target.getAttribute('data-id'));
                showView('deck-details');
            });
        });
    };

    const renderReviewQueue = () => {
        const container = document.getElementById('review-queue-list');
        container.innerHTML = '';
        
        const todayStr = new Date().toISOString().split('T')[0];
        const toReview = cards.filter(c => c.nextReview <= todayStr && c.mastery < 90);

        if (toReview.length === 0) {
            container.innerHTML = `<div style="font-size:0.85rem; color:var(--text-gray); padding: 1rem; text-align:center;">No cards ready for review. Great job!</div>`;
            return;
        }

        const subjectCounts = {};
        toReview.forEach(c => {
            const deck = decks.find(d => d.id === c.deckId);
            if(deck) {
                subjectCounts[deck.subject] = (subjectCounts[deck.subject] || 0) + 1;
            }
        });

        Object.entries(subjectCounts).forEach(([subj, count]) => {
            const div = document.createElement('div');
            div.className = 'rq-item';
            div.innerHTML = `<span class="rq-subj">${subj}</span><span class="rq-count">${count} Cards</span>`;
            
            // Clicking a review item auto-starts review mode for the first deck of that subject
            div.addEventListener('click', () => {
                const targetDeck = decks.find(d => d.subject === subj);
                if(targetDeck) {
                    currentDeckId = targetDeck.id;
                    studyMode = 'review';
                    showView('study');
                }
            });
            container.appendChild(div);
        });
    };

    const renderGoalAndStreak = () => {
        // Goal
        const pct = Math.min(100, Math.round((progress.studiedToday / progress.dailyGoal) * 100));
        document.getElementById('goal-text-display').textContent = `${progress.studiedToday} / ${progress.dailyGoal} cards`;
        document.getElementById('goal-pct-display').textContent = `${pct}%`;
        document.getElementById('goal-progress-fill').style.width = `${pct}%`;

        // Streak Calendar
        const cal = document.getElementById('streak-calendar');
        cal.innerHTML = '';
        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        
        // Simple visual mock logic mapping to the last 7 days for the UI
        // In a real app, you'd align specific dates to days of the week.
        const today = new Date();
        const currentDayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Mon, 6=Sun
        
        days.forEach((dayStr, i) => {
            // Check if streak implies this day was studied
            // If currentStreak > (currentDayIdx - i), mark as done
            const diff = currentDayIdx - i;
            let isDone = false;
            
            if (diff >= 0 && diff < progress.currentStreak) isDone = true;
            else if (diff < 0 && (7 + diff) < progress.currentStreak) isDone = true; // wrapped around week
            
            const mark = isDone ? '✓' : '-';
            const cls = isDone ? 'done' : '';
            cal.innerHTML += `
                <div class="streak-day">
                    <span class="s-lbl">${dayStr}</span>
                    <div class="s-circle ${cls}">${mark}</div>
                </div>
            `;
        });
    };

    /* ==========================================================================
       6. DECK DETAILS & MANAGEMENT
       ========================================================================== */
    const renderDeckDetails = () => {
        const deck = decks.find(d => d.id === currentDeckId);
        if (!deck) return showView('dashboard');

        const deckCards = cards.filter(c => c.deckId === deck.id);
        const mastery = calculateDeckMastery(deck.id);

        document.getElementById('dh-subject').textContent = deck.subject;
        document.getElementById('dh-title').textContent = deck.name;
        document.getElementById('dh-desc').textContent = deck.description || "No description provided.";
        document.getElementById('dh-count').textContent = `${deckCards.length} Cards`;
        document.getElementById('dh-mastery').textContent = `Mastery: ${mastery}%`;

        // Reset filter and search
        document.getElementById('search-cards-input').value = '';
        document.querySelectorAll('.dm-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.dm-tab[data-filter="All"]').classList.add('active');

        renderDeckManagementList();
    };

    const getMasteryStatus = (m) => {
        if (m < 40) return { lbl: 'NEEDS REVIEW', cls: 's-need' };
        if (m < 70) return { lbl: 'LEARNING', cls: 's-learn' };
        if (m < 90) return { lbl: 'STRONG', cls: 's-mast' };
        return { lbl: 'MASTERED', cls: 's-mast' };
    };

    const renderDeckManagementList = () => {
        const container = document.getElementById('cards-management-list');
        const filter = document.querySelector('.dm-tab.active').getAttribute('data-filter');
        const search = document.getElementById('search-cards-input').value.toLowerCase();
        
        let deckCards = cards.filter(c => c.deckId === currentDeckId);

        // Apply Search
        if (search) {
            deckCards = deckCards.filter(c => c.question.toLowerCase().includes(search) || c.answer.toLowerCase().includes(search));
        }

        // Apply Filter
        if (filter === 'Review') {
            const todayStr = new Date().toISOString().split('T')[0];
            deckCards = deckCards.filter(c => c.nextReview <= todayStr && c.mastery < 90);
        } else if (filter === 'Mastered') {
            deckCards = deckCards.filter(c => c.mastery >= 90);
        }

        container.innerHTML = '';
        if (deckCards.length === 0) {
            container.innerHTML = `<div class="empty-list">No cards match the current filter.</div>`;
            return;
        }

        deckCards.forEach(c => {
            const status = getMasteryStatus(c.mastery);
            const div = document.createElement('div');
            div.className = 'fc-list-item';
            div.innerHTML = `
                <div class="fcl-q" title="${c.question}">${c.question}</div>
                <div class="fcl-meta">
                    <span>Diff: <strong>${c.difficulty}</strong></span>
                    <span>Review: ${c.nextReview}</span>
                </div>
                <div class="fcl-status">
                    <span class="badge-status ${status.cls}">${status.lbl} (${c.mastery}%)</span>
                </div>
                <div class="fcl-actions">
                    <button class="btn-icon edit" data-id="${c.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon del" data-id="${c.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            container.appendChild(div);
        });

        // Bind actions
        container.querySelectorAll('.btn-icon.edit').forEach(btn => {
            btn.addEventListener('click', (e) => openFlashcardModal(parseInt(e.currentTarget.getAttribute('data-id'))));
        });
        container.querySelectorAll('.btn-icon.del').forEach(btn => {
            btn.addEventListener('click', (e) => openDeleteModal(parseInt(e.currentTarget.getAttribute('data-id'))));
        });
    };

    /* ==========================================================================
       7. FLASHCARD STUDY ENGINE (3D FLIP & SRS)
       ========================================================================== */
    const startStudySession = () => {
        let deckCards = cards.filter(c => c.deckId === currentDeckId);
        
        if (studyMode === 'review') {
            const todayStr = new Date().toISOString().split('T')[0];
            deckCards = deckCards.filter(c => c.nextReview <= todayStr && c.mastery < 100);
        }

        if (deckCards.length === 0) {
            showToast('No cards to study in this mode!', 'success');
            showView('deck-details');
            return;
        }

        activeCards = [...deckCards];
        currentIndex = 0;
        
        renderCurrentFlashcard();
    };

    const renderCurrentFlashcard = () => {
        if (currentIndex >= activeCards.length) {
            showToast('Session Complete! Great job.', 'success');
            showView('deck-details');
            return;
        }

        const card = activeCards[currentIndex];
        
        // Reset 3D Card State
        const inner = document.getElementById('flashcard-inner');
        inner.classList.remove('flipped');
        
        // Populate Data
        document.getElementById('fc-front-text').textContent = card.question;
        document.getElementById('fc-back-text').textContent = card.answer;
        document.getElementById('fc-hint-text').textContent = card.hint ? `Hint: ${card.hint}` : '';

        // Progress
        const pct = Math.round(((currentIndex) / activeCards.length) * 100);
        document.getElementById('study-counter-text').textContent = `CARD ${currentIndex + 1} OF ${activeCards.length}`;
        document.getElementById('study-progress-fill').style.width = `${pct}%`;

        // Reset Controls
        document.getElementById('sc-nav-default').style.display = 'flex';
        document.getElementById('sc-nav-rating').style.display = 'none';
        
        document.getElementById('btn-prev-card').disabled = (currentIndex === 0);
    };

    const flipCard = () => {
        const inner = document.getElementById('flashcard-inner');
        if (!inner.classList.contains('flipped')) {
            inner.classList.add('flipped');
            // Show SRS Rating
            document.getElementById('sc-nav-default').style.display = 'none';
            document.getElementById('sc-nav-rating').style.display = 'flex';
        }
    };

    const handleRating = (rating) => {
        const card = activeCards[currentIndex];
        const now = new Date();
        let daysToAdd = 1;

        // SRS Logic
        if (rating === 'again') {
            card.mastery = Math.max(0, card.mastery - 10);
            daysToAdd = 1;
        } else if (rating === 'hard') {
            card.mastery = Math.min(100, card.mastery + 5);
            daysToAdd = 2;
        } else if (rating === 'good') {
            card.mastery = Math.min(100, card.mastery + 10);
            daysToAdd = 4;
        } else if (rating === 'easy') {
            card.mastery = Math.min(100, card.mastery + 20);
            daysToAdd = 7;
        }

        now.setDate(now.getDate() + daysToAdd);
        card.nextReview = now.toISOString().split('T')[0];
        card.reviewCount += 1;

        // Update main data source
        const globalIdx = cards.findIndex(c => c.id === card.id);
        if(globalIdx > -1) cards[globalIdx] = card;
        
        saveAllData();
        logStudyAction();

        // Move to next
        currentIndex++;
        renderCurrentFlashcard();
    };

    // Shuffle Array helper
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    document.getElementById('btn-shuffle-cards').addEventListener('click', () => {
        const remaining = activeCards.slice(currentIndex);
        shuffleArray(remaining);
        activeCards.splice(currentIndex, remaining.length, ...remaining);
        showToast('Cards shuffled', 'success');
        renderCurrentFlashcard();
    });

    /* ==========================================================================
       8. QUIZ ENGINE
       ========================================================================== */
    const runQuizEngine = () => {
        let deckCards = cards.filter(c => c.deckId === currentDeckId);
        
        if (quizState.difficultyFilter !== 'Mixed') {
            deckCards = deckCards.filter(c => c.difficulty === quizState.difficultyFilter);
        }

        if (deckCards.length < 4) {
            showToast('Need at least 4 cards for a Quiz.', 'error');
            showView('deck-details');
            return;
        }

        // Prepare Quiz
        shuffleArray(deckCards);
        activeCards = deckCards.slice(0, 10); // Max 10 questions
        currentIndex = 0;
        quizState.score = 0;
        quizState.total = activeCards.length;

        document.getElementById('quiz-question-container').style.display = 'block';
        document.getElementById('quiz-results-container').style.display = 'none';

        renderQuizQuestion();
    };

    const renderQuizQuestion = () => {
        if (currentIndex >= quizState.total) {
            showQuizResults();
            return;
        }

        quizState.isAnswered = false;
        const card = activeCards[currentIndex];
        
        // Progress
        const pct = Math.round(((currentIndex) / quizState.total) * 100);
        document.getElementById('quiz-counter-text').textContent = `QUESTION ${currentIndex + 1} OF ${quizState.total}`;
        document.getElementById('quiz-progress-fill').style.width = `${pct}%`;

        document.getElementById('quiz-question-text').textContent = card.question;
        
        // Generate Options
        const optionsGrid = document.getElementById('quiz-options-grid');
        optionsGrid.innerHTML = '';
        document.getElementById('quiz-feedback-box').style.display = 'none';

        // Get 3 random wrong answers
        const wrongPool = cards.filter(c => c.id !== card.id).map(c => c.answer);
        shuffleArray(wrongPool);
        const wrongs = wrongPool.slice(0, 3);
        
        // If we don't have enough distinct answers, fallback
        while(wrongs.length < 3) { wrongs.push("Fallback dummy answer " + Math.random()); }

        const options = [card.answer, ...wrongs];
        shuffleArray(options);

        options.forEach(optText => {
            const btn = document.createElement('button');
            btn.className = 'quiz-opt-btn';
            btn.textContent = optText;
            btn.addEventListener('click', () => handleQuizSelection(btn, optText, card.answer));
            optionsGrid.appendChild(btn);
        });
    };

    const handleQuizSelection = (selectedBtn, selectedText, correctText) => {
        if (quizState.isAnswered) return;
        quizState.isAnswered = true;

        const isCorrect = (selectedText === correctText);
        const options = document.querySelectorAll('.quiz-opt-btn');
        
        // Style buttons
        options.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctText) {
                btn.classList.add('correct');
            } else if (btn === selectedBtn && !isCorrect) {
                btn.classList.add('wrong');
            }
        });

        // Feedback
        const feedback = document.getElementById('quiz-feedback-box');
        const icon = document.getElementById('qf-status-icon');
        const correctBox = document.getElementById('qf-correct-ans-box');
        
        feedback.style.display = 'flex';
        
        if (isCorrect) {
            quizState.score++;
            icon.textContent = '✓ CORRECT';
            icon.className = 'qf-status correct';
            correctBox.style.display = 'none';
        } else {
            icon.textContent = '✕ INCORRECT';
            icon.className = 'qf-status incorrect';
            correctBox.style.display = 'block';
            document.getElementById('qf-correct-text').textContent = correctText;
        }

        logStudyAction();
    };

    document.getElementById('btn-quiz-next').addEventListener('click', () => {
        currentIndex++;
        renderQuizQuestion();
    });

    const showQuizResults = () => {
        document.getElementById('quiz-question-container').style.display = 'none';
        const res = document.getElementById('quiz-results-container');
        res.style.display = 'block';

        const acc = Math.round((quizState.score / quizState.total) * 100);
        document.getElementById('qr-score').textContent = `${quizState.score} / ${quizState.total}`;
        document.getElementById('qr-accuracy').textContent = `${acc}%`;
        document.getElementById('qr-correct').textContent = quizState.score;
        document.getElementById('qr-incorrect').textContent = quizState.total - quizState.score;

        // Save history
        const history = JSON.parse(localStorage.getItem(STORAGE_QUIZ) || '[]');
        history.push({ date: new Date().toISOString(), deckId: currentDeckId, score: quizState.score, total: quizState.total });
        localStorage.setItem(STORAGE_QUIZ, JSON.stringify(history));

        addNotification('QUIZ COMPLETE', `You scored ${quizState.score}/${quizState.total} in ${decks.find(d=>d.id===currentDeckId).name}.`);
    };

    /* ==========================================================================
       9. MODALS & FORMS
       ========================================================================== */
    const modalDeck = document.getElementById('modal-deck');
    const modalFC = document.getElementById('modal-flashcard');
    const modalDel = document.getElementById('modal-delete');
    const modalQuiz = document.getElementById('modal-quiz-config');

    // Close all wrapper
    const closeAllModals = () => {
        modalDeck.classList.remove('active');
        modalFC.classList.remove('active');
        modalDel.classList.remove('active');
        modalQuiz.classList.remove('active');
    };

    document.querySelectorAll('.close-modal, .btn-flat').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Create Deck Form
    document.getElementById('btn-create-deck').addEventListener('click', () => {
        document.getElementById('deck-form').reset();
        modalDeck.classList.add('active');
    });

    document.getElementById('deck-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newDeck = {
            id: Date.now(),
            name: document.getElementById('deck-name').value,
            subject: document.getElementById('deck-subject').value,
            description: document.getElementById('deck-desc').value,
            createdAt: new Date().toISOString().split('T')[0]
        };
        decks.push(newDeck);
        saveAllData();
        renderDashboard();
        closeAllModals();
        showToast('Deck created', 'success');
    });

    // Flashcard Form
    document.getElementById('btn-add-flashcard').addEventListener('click', () => {
        document.getElementById('fc-form').reset();
        document.getElementById('fc-id').value = '';
        document.getElementById('fc-modal-title').textContent = 'ADD FLASHCARD';
        modalFC.classList.add('active');
    });

    const openFlashcardModal = (id) => {
        const c = cards.find(c => c.id === id);
        if(!c) return;
        document.getElementById('fc-id').value = c.id;
        document.getElementById('fc-q').value = c.question;
        document.getElementById('fc-a').value = c.answer;
        document.getElementById('fc-cat').value = c.category;
        document.getElementById('fc-diff').value = c.difficulty;
        document.getElementById('fc-hint').value = c.hint || '';
        document.getElementById('fc-modal-title').textContent = 'EDIT FLASHCARD';
        modalFC.classList.add('active');
    };

    document.getElementById('fc-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('fc-id').value;
        const data = {
            question: document.getElementById('fc-q').value,
            answer: document.getElementById('fc-a').value,
            category: document.getElementById('fc-cat').value,
            difficulty: document.getElementById('fc-diff').value,
            hint: document.getElementById('fc-hint').value
        };

        if (id) {
            const idx = cards.findIndex(c => c.id === parseInt(id));
            if(idx > -1) cards[idx] = { ...cards[idx], ...data };
            showToast('Card updated', 'success');
        } else {
            const newCard = {
                id: Date.now(),
                deckId: currentDeckId,
                ...data,
                mastery: 0,
                reviewCount: 0,
                nextReview: new Date().toISOString().split('T')[0]
            };
            cards.push(newCard);
            showToast('Card added', 'success');
        }
        
        saveAllData();
        renderDeckDetails();
        closeAllModals();
    });

    // Delete Card
    const openDeleteModal = (id) => {
        document.getElementById('del-card-id').value = id;
        modalDel.classList.add('active');
    };
    document.getElementById('confirm-del-btn').addEventListener('click', () => {
        const id = parseInt(document.getElementById('del-card-id').value);
        cards = cards.filter(c => c.id !== id);
        saveAllData();
        renderDeckDetails();
        closeAllModals();
        showToast('Card deleted', 'error');
    });

    /* ==========================================================================
       10. EVENT LISTENERS SETUP
       ========================================================================== */
    const setupEventListeners = () => {
        // Deck Management Nav
        document.getElementById('btn-back-to-dash').addEventListener('click', () => showView('dashboard'));
        
        document.getElementById('search-cards-input').addEventListener('input', renderDeckManagementList);
        document.querySelectorAll('.dm-tab').forEach(t => {
            t.addEventListener('click', (e) => {
                document.querySelectorAll('.dm-tab').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                renderDeckManagementList();
            });
        });

        // Launch Modes
        document.getElementById('btn-start-study').addEventListener('click', () => { studyMode = 'flashcard'; showView('study'); });
        document.getElementById('btn-start-review').addEventListener('click', () => { studyMode = 'review'; showView('study'); });
        document.getElementById('btn-start-quiz').addEventListener('click', () => { modalQuiz.classList.add('active'); });

        document.getElementById('confirm-quiz-start').addEventListener('click', () => {
            quizState.difficultyFilter = document.getElementById('quiz-config-diff').value;
            closeAllModals();
            showView('quiz');
        });

        // Study Nav
        document.getElementById('btn-exit-study').addEventListener('click', () => showView('deck-details'));
        document.getElementById('btn-exit-quiz').addEventListener('click', () => showView('deck-details'));
        document.getElementById('btn-retry-quiz').addEventListener('click', runQuizEngine);
        document.getElementById('btn-quiz-to-deck').addEventListener('click', () => showView('deck-details'));

        document.getElementById('flashcard-3d').addEventListener('click', flipCard);
        document.getElementById('btn-flip-card').addEventListener('click', flipCard);
        
        document.getElementById('btn-prev-card').addEventListener('click', () => {
            if (currentIndex > 0) { currentIndex--; renderCurrentFlashcard(); }
        });
        
        // This is skipped if rating appears, but useful if user skips rating somehow
        document.getElementById('btn-next-card').addEventListener('click', () => {
            if (currentIndex < activeCards.length - 1) { currentIndex++; renderCurrentFlashcard(); }
        });

        // Rating buttons
        document.querySelectorAll('.rate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleRating(btn.getAttribute('data-rate'));
            });
        });

        // Goal additions
        document.querySelectorAll('[data-goal-add]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const add = parseInt(e.target.getAttribute('data-goal-add'));
                progress.dailyGoal += add;
                saveAllData();
                renderGoalAndStreak();
                showToast(`Goal increased to ${progress.dailyGoal}`, 'success');
            });
        });
    };

    const setupKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            // Do not trigger if typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (currentMode === 'study') {
                if (e.code === 'Space') {
                    e.preventDefault();
                    flipCard();
                } else if (e.code === 'ArrowLeft') {
                    if (currentIndex > 0) { currentIndex--; renderCurrentFlashcard(); }
                } else if (e.code === 'ArrowRight') {
                    // Only allow right arrow if not forced to rate
                    if (document.getElementById('sc-nav-rating').style.display !== 'flex') {
                        if (currentIndex < activeCards.length - 1) { currentIndex++; renderCurrentFlashcard(); }
                    }
                }
            } else if (currentMode === 'deck-details') {
                if (e.code === 'KeyQ') { modalQuiz.classList.add('active'); }
                if (e.code === 'KeyR') { studyMode = 'review'; showView('study'); }
            }

            if (e.key === 'Escape') closeAllModals();
        });
    };

    /* ==========================================================================
       11. NOTIFICATIONS & TOASTS
       ========================================================================== */
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-check-circle';
        if(type === 'error') icon = 'fa-trash-alt';
        
        toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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
                     voiceFeedback.innerHTML = '<p class="suggestion">Say:<br><i>"Start quiz"</i></p>';
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
            'open timetable': 'timetable.html', 'open ai assistant': 'ai-assistant.html'
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
            if (cmd.includes('flip') && currentMode === 'study') {
                flipCard(); handled = true;
            } else if (cmd.includes('next card') && currentMode === 'study') {
                if (document.getElementById('sc-nav-rating').style.display !== 'flex') {
                    if (currentIndex < activeCards.length - 1) { currentIndex++; renderCurrentFlashcard(); }
                } else { speak('Please rate your knowledge first.'); }
                handled = true;
            } else if (cmd.includes('previous card') && currentMode === 'study') {
                if (currentIndex > 0) { currentIndex--; renderCurrentFlashcard(); }
                handled = true;
            } else if (cmd.includes('shuffle cards') && currentMode === 'study') {
                document.getElementById('btn-shuffle-cards').click(); handled = true;
            } else if (cmd.includes('show review') || cmd.includes('review cards')) {
                speak('Opening review queue');
                // Auto trigger first review item if available
                const rqItem = document.querySelector('.rq-item');
                if(rqItem) rqItem.click();
                handled = true;
            } else if (cmd.includes('start quiz') && currentMode === 'deck-details') {
                speak('Starting quiz mode');
                document.getElementById('btn-start-quiz').click();
                setTimeout(() => document.getElementById('confirm-quiz-start').click(), 1000);
                handled = true;
            } else if (cmd.includes('start flashcards') && currentMode === 'deck-details') {
                speak('Starting flashcard study');
                document.getElementById('btn-start-study').click();
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