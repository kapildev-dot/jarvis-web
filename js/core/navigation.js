/**
 * KAPISH JARVIS - Core Navigation System
 * Manages page routing and sidebar states.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Navigation = (function() {
    
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop();
        return page === '' ? 'index.html' : page;
    }

    function isRootPath() {
        const currentPage = getCurrentPage();
        // If we are on index.html or the root directory, we are in the root
        return currentPage === 'index.html' || !window.location.pathname.includes('/pages/');
    }

    function navigateTo(targetHtml) {
        const root = isRootPath();
        
        if (targetHtml === 'index.html') {
            window.location.href = root ? 'index.html' : '../index.html';
        } else {
            // Target is a page in the pages folder
            window.location.href = root ? `pages/${targetHtml}` : targetHtml;
        }
    }

    function initializeNavigation() {
        const currentPage = getCurrentPage();
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        
        // Highlight active link
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.includes(currentPage) && currentPage !== '') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            // Fix href paths dynamically if accessed incorrectly
            if(href && isRootPath() && href !== 'index.html' && !href.startsWith('pages/') && !href.startsWith('#')) {
                item.setAttribute('href', `pages/${href}`);
            } else if (href && !isRootPath() && href === 'index.html') {
                item.setAttribute('href', `../index.html`);
            }
        });

        // Mobile Sidebar Logic
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('active');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                    if (!sidebar.contains(e.target) && e.target !== mobileToggle) {
                        sidebar.classList.remove('active');
                    }
                }
            });
        }
    }

    return {
        getCurrentPage,
        isRootPath,
        navigateTo,
        initialize: initializeNavigation,
        openDashboard: () => navigateTo('dashboard.html'),
        openStudy: () => navigateTo('study.html'),
        openTasks: () => navigateTo('tasks.html'),
        openNotes: () => navigateTo('notes.html'),
        openTimetable: () => navigateTo('timetable.html'),
        openFlashcards: () => navigateTo('flashcards.html'),
        openAIAssistant: () => navigateTo('ai-assistant.html'),
        openSettings: () => navigateTo('settings.html')
    };
})();