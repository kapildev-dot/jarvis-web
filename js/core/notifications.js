/**
 * KAPISH JARVIS - Core Notification System
 * Centralized Toasts and Modals.
 */

window.JARVIS = window.JARVIS || {};

window.JARVIS.Notifications = (function() {
    let toastContainer = null;
    let modalOverlay = null;

    function initDOM() {
        if (!document.getElementById('jarvis-toast-container')) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'jarvis-toast-container';
            toastContainer.style.cssText = `position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column; gap:10px; z-index:9999; pointer-events:none;`;
            document.body.appendChild(toastContainer);
        } else {
            toastContainer = document.getElementById('jarvis-toast-container');
        }

        if (!document.getElementById('jarvis-global-modal')) {
            modalOverlay = document.createElement('div');
            modalOverlay.id = 'jarvis-global-modal';
            modalOverlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); backdrop-filter:blur(5px); display:none; align-items:center; justify-content:center; z-index:10000; opacity:0; transition:opacity 0.2s ease;`;
            
            modalOverlay.innerHTML = `
                <div class="jarvis-modal-content" style="background:#0a0a12; border:1px solid rgba(0,229,255,0.3); border-radius:12px; padding:25px; width:350px; text-align:center; color:#e0e0ff; font-family:'Roboto', sans-serif;">
                    <h3 id="jarvis-modal-title" style="color:#00e5ff; font-family:'Rajdhani', sans-serif; margin-bottom:10px; font-size:18px;"></h3>
                    <p id="jarvis-modal-desc" style="font-size:14px; color:#8b8b99; margin-bottom:25px;"></p>
                    <div style="display:flex; justify-content:center; gap:15px;">
                        <button id="jarvis-modal-cancel" style="padding:10px 15px; border-radius:6px; cursor:pointer; background:rgba(255,255,255,0.1); border:none; color:white; font-weight:600;">Cancel</button>
                        <button id="jarvis-modal-confirm" style="padding:10px 15px; border-radius:6px; cursor:pointer; background:rgba(0,229,255,0.1); border:1px solid #00e5ff; color:#00e5ff; font-weight:600;">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);
        } else {
            modalOverlay = document.getElementById('jarvis-global-modal');
        }
    }

    function showToast(message, type = 'info') {
        initDOM();
        const toast = document.createElement('div');
        
        let bgColor = '#0a0a12';
        let borderColor = 'rgba(0, 229, 255, 0.3)';
        let color = '#00e5ff';
        let icon = 'fa-circle-info';

        if (type === 'success') { borderColor = '#00ff88'; color = '#00ff88'; icon = 'fa-check-circle'; }
        if (type === 'error' || type === 'danger') { borderColor = '#ff0055'; color = '#ff0055'; icon = 'fa-circle-xmark'; }
        if (type === 'warning') { borderColor = '#ffaa00'; color = '#ffaa00'; icon = 'fa-triangle-exclamation'; }

        toast.style.cssText = `background:${bgColor}; border:1px solid ${borderColor}; color:${color}; padding:12px 20px; border-radius:6px; font-size:14px; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 5px 15px rgba(0,0,0,0.3); transform:translateX(120%); transition:transform 0.3s ease, opacity 0.3s ease;`;
        
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });

        // Animate out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => { if (toastContainer.contains(toast)) toast.remove(); }, 300);
        }, 3000);
    }

    function showConfirmation(options = {}) {
        initDOM();
        return new Promise((resolve) => {
            const titleEl = document.getElementById('jarvis-modal-title');
            const descEl = document.getElementById('jarvis-modal-desc');
            const btnCancel = document.getElementById('jarvis-modal-cancel');
            const btnConfirm = document.getElementById('jarvis-modal-confirm');

            titleEl.innerText = options.title || "Confirm Action";
            descEl.innerText = options.message || "Are you sure you want to proceed?";
            btnConfirm.innerText = options.confirmText || "Confirm";
            btnCancel.innerText = options.cancelText || "Cancel";

            if (options.danger) {
                titleEl.style.color = '#ff0055';
                btnConfirm.style.background = 'rgba(255,0,85,0.1)';
                btnConfirm.style.borderColor = '#ff0055';
                btnConfirm.style.color = '#ff0055';
            } else {
                titleEl.style.color = '#00e5ff';
                btnConfirm.style.background = 'rgba(0,229,255,0.1)';
                btnConfirm.style.borderColor = '#00e5ff';
                btnConfirm.style.color = '#00e5ff';
            }

            modalOverlay.style.display = 'flex';
            setTimeout(() => modalOverlay.style.opacity = '1', 10);

            const cleanup = () => {
                modalOverlay.style.opacity = '0';
                setTimeout(() => modalOverlay.style.display = 'none', 200);
                btnConfirm.removeEventListener('click', onConfirm);
                btnCancel.removeEventListener('click', onCancel);
            };

            const onConfirm = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };

            btnConfirm.addEventListener('click', onConfirm);
            btnCancel.addEventListener('click', onCancel);
        });
    }

    return {
        showToast,
        success: (msg) => showToast(msg, 'success'),
        error: (msg) => showToast(msg, 'error'),
        warning: (msg) => showToast(msg, 'warning'),
        info: (msg) => showToast(msg, 'info'),
        showConfirmation
    };
})();