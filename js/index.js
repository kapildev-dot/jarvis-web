document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       A. MOBILE NAVIGATION
       ========================================================================== */
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('active');
        
        // Toggle icon between bars and times
        const icon = mobileMenuBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });


    /* ==========================================================================
       B. SMOOTH NAVIGATION (Handled largely by CSS, ensuring JS backup)
       ========================================================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });


    /* ==========================================================================
       F. DYNAMIC GREETING
       ========================================================================== */
    const greetingElement = document.getElementById('dynamic-greeting');
    const hour = new Date().getHours();
    let greetingText = "GOOD EVENING";

    if (hour >= 5 && hour < 12) {
        greetingText = "GOOD MORNING";
    } else if (hour >= 12 && hour < 18) {
        greetingText = "GOOD AFTERNOON";
    }

    if (greetingElement) {
        greetingElement.textContent = greetingText;
    }


    /* ==========================================================================
       C & D & E. AI CORE INTERACTION & VOICE CONTROL PREVIEW & SYSTEM STATUS
       ========================================================================== */
    const aiCore = document.getElementById('ai-core');
    const voiceFeedback = document.getElementById('voice-feedback');
    const globalStatusText = document.getElementById('global-system-status');
    const statusDot = document.querySelector('.status-dot');

    // Hover logic (Slight glow & animation speed increase)
    aiCore.addEventListener('mouseenter', () => {
        aiCore.classList.add('ai-core-active');
        // Speed up rings via JS style override
        document.querySelector('.ring-1').style.animationDuration = '4s';
        document.querySelector('.ring-2').style.animationDuration = '3s';
        document.querySelector('.ring-3').style.animationDuration = '5s';
    });

    aiCore.addEventListener('mouseleave', () => {
        aiCore.classList.remove('ai-core-active');
        // Restore ring speeds
        document.querySelector('.ring-1').style.animationDuration = '8s';
        document.querySelector('.ring-2').style.animationDuration = '6s';
        document.querySelector('.ring-3').style.animationDuration = '10s';
    });

    // Allow keyboard activation for accessibility
    aiCore.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerVoicePreview();
        }
    });

    // Voice Preview Logic
    aiCore.addEventListener('click', triggerVoicePreview);

    let isListening = false;

    function triggerVoicePreview() {
        if (isListening) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            voiceFeedback.textContent = "Microphone unavailable in this browser.";
            updateSystemStatus("MICROPHONE UNAVAILABLE", "red");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            voiceFeedback.textContent = "LISTENING...";
            voiceFeedback.style.color = "var(--primary-cyan)";
            updateSystemStatus("LISTENING", "var(--primary-cyan)");
            
            // Add extra pulse effect to core when listening
            aiCore.style.boxShadow = "0 0 60px rgba(0, 240, 255, 0.6)";
        };

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript;
            voiceFeedback.textContent = `You said: "${command}"`;
            voiceFeedback.style.color = "var(--text-white)";
            
            // Artificial delay before Jarvis responds
            setTimeout(() => {
                respondWithVoice("Voice control is ready.");
            }, 500);
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error", event.error);
            voiceFeedback.textContent = "Microphone access failed.";
            voiceFeedback.style.color = "var(--text-gray)";
            updateSystemStatus("SYSTEM ONLINE", "var(--primary-cyan)");
            aiCore.style.boxShadow = "none";
        };

        recognition.onend = () => {
            isListening = false;
            updateSystemStatus("SYSTEM ONLINE", "var(--primary-cyan)");
            aiCore.style.boxShadow = "none";
            
            // Reset text after a few seconds if no speech response overrides it
            setTimeout(() => {
                if (voiceFeedback.textContent.includes("You said") || voiceFeedback.textContent.includes("Microphone access")) {
                    voiceFeedback.textContent = "Your study assistant is waiting.";
                    voiceFeedback.style.color = "var(--text-gray)";
                }
            }, 6000);
        };

        try {
            recognition.start();
        } catch (error) {
            voiceFeedback.textContent = "Microphone unavailable.";
        }
    }

    function respondWithVoice(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Attempt to find a futuristic/robotic voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Samantha') || v.name.includes('Daniel'));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            utterance.pitch = 0.9;
            utterance.rate = 1.0;
            
            utterance.onstart = () => {
                voiceFeedback.textContent = text;
                voiceFeedback.style.color = "var(--primary-cyan)";
            };

            utterance.onend = () => {
                setTimeout(() => {
                    voiceFeedback.textContent = "Your study assistant is waiting.";
                    voiceFeedback.style.color = "var(--text-gray)";
                }, 2000);
            };

            window.speechSynthesis.speak(utterance);
        }
    }

    function updateSystemStatus(text, color) {
        if (globalStatusText) {
            globalStatusText.textContent = text;
        }
        if (statusDot) {
            statusDot.style.backgroundColor = color;
        }
    }
});