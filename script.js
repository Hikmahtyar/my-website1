document.addEventListener('DOMContentLoaded', () => {
    
    // =================================================================
    // FUNGSI INTI (THEME TOGGLE, HEADER, KURSOR)
    // =================================================================
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const isDarkMode = body.classList.contains('dark-theme');
        themeToggle.classList.toggle('bx-sun', !isDarkMode);
        themeToggle.classList.toggle('bx-moon', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark-theme' : 'light-theme');
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme === 'dark-theme') {
        body.classList.add('dark-theme');
        themeToggle.classList.replace('bx-sun', 'bx-moon');
    } else {
        themeToggle.classList.replace('bx-moon', 'bx-sun');
    }

    const header = document.querySelector('.header');
    ScrollTrigger.create({
        trigger: 'body', start: 'top -50px',
        onEnter: () => header.classList.add('scrolled'),
        onLeaveBack: () => header.classList.remove('scrolled'),
    });

    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const mouse = { x: -100, y: -100 }, pos = { x: 0, y: 0 }, speed = 0.1;

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        gsap.to([cursorDot, cursorOutline], { duration: 0.3, opacity: 1 });
    });

    const updateCursor = () => {
        pos.x += (mouse.x - pos.x) * speed; pos.y += (mouse.y - pos.y) * speed;
        gsap.set(cursorDot, { x: mouse.x, y: mouse.y });
        gsap.set(cursorOutline, { x: pos.x, y: pos.y });
        requestAnimationFrame(updateCursor);
    };
    updateCursor();

    document.addEventListener('mouseleave', () => {
        gsap.to([cursorDot, cursorOutline], { duration: 0.3, opacity: 0 });
    });
    
    const hoverables = document.querySelectorAll('a, button, .codex-card, #theme-toggle, .focused-card, .modal-close-btn');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => cursorOutline.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hover'));
    });

    // =================================================================
    // LOGIKA EXPAND DENGAN "FOCUS MODE"
    // =================================================================
    const allCardWrappers = document.querySelectorAll('.codex-gallery .card-wrapper');
    const cards = document.querySelectorAll('.codex-gallery .codex-card');
    let activeCard = null;
    let isAnimating = false;
    const sectionsToPush = document.querySelectorAll('.gallery-section ~ *');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (isAnimating) return;
            const wasActive = card === activeCard;
            if (activeCard) {
                closePanel(activeCard, () => {
                    if (!wasActive) openPanel(card);
                });
            } else {
                openPanel(card);
            }
        });
    });

    function openPanel(card) {
        isAnimating = true;
        
        const cardWrapper = card.parentElement;
        const detailsPanel = cardWrapper.querySelector('.codex-details');
        const timelineItems = detailsPanel.querySelectorAll('.timeline-item');
        
        activeCard = card;

        const otherWrappers = Array.from(allCardWrappers).filter(cw => cw !== cardWrapper);
        gsap.to(otherWrappers, { opacity: 0, pointerEvents: 'none', duration: 0.5 });
        gsap.to(sectionsToPush, { opacity: 0, pointerEvents: 'none', duration: 0.5 });
        
        gsap.set(detailsPanel, {maxHeight: "none"});
        const panelHeight = detailsPanel.getBoundingClientRect().height;
        gsap.set(detailsPanel, {maxHeight: "0px"});
        
        const tl = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                ScrollTrigger.refresh();
            }
        });
        
        tl.add(() => {
            card.classList.add('active');
            detailsPanel.classList.add('active');
            cardWrapper.style.zIndex = '20';
        })
        .to(detailsPanel, { 
            maxHeight: panelHeight,
            opacity: 1, 
            duration: 0.8, 
            ease: 'expo.inOut',
            onComplete: () => {
                createTimelineCurves(detailsPanel.querySelector('.timeline-cv'));
            }
        })
        .to(sectionsToPush, {
            y: panelHeight + (parseFloat(getComputedStyle(detailsPanel).marginTop) || 0) + 120,
            duration: 0.8,
            ease: 'expo.inOut'
        }, "<")
        .to(timelineItems, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'expo.out'
        }, "-=0.6");
    }

    function closePanel(card, callback) {
        isAnimating = true;
        
        const cardWrapper = card.parentElement;
        const detailsPanel = cardWrapper.querySelector('.codex-details');
        const timelineItems = detailsPanel.querySelectorAll('.timeline-item');

        gsap.to(allCardWrappers, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });
        gsap.to(sectionsToPush, { opacity: 1, pointerEvents: 'auto', duration: 0.5 });
        
        const tl = gsap.timeline({
            onComplete: () => {
                detailsPanel.classList.remove('active');
                card.classList.remove('active');
                cardWrapper.style.zIndex = '1';
                activeCard = null;
                isAnimating = false;
                ScrollTrigger.refresh();
                if (callback) callback();
            }
        });

        tl.to(timelineItems, {
            opacity: 0,
            x: (i) => i % 2 === 0 ? -40 : 40,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.in'
        })
        .to(detailsPanel, {
            maxHeight: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'expo.inOut'
        }, "-=0.3")
        .to(sectionsToPush, {
            y: 0,
            duration: 0.8,
            ease: 'expo.inOut'
        }, "<");
    }

    // =================================================================
    // FUNGSI: MEMBUAT GARIS TIMELINE MELENGKUNG DENGAN SVG
    // =================================================================
    function createTimelineCurves(container) {
        if (!container) return;
        
        container.querySelectorAll('.timeline-curve').forEach(curve => curve.remove());

        const items = container.querySelectorAll('.timeline-item:not(:last-child)');
        items.forEach((item) => {
            const nextItem = item.nextElementSibling;
            if (!nextItem) return;

            const startRect = item.getBoundingClientRect();
            const endRect = nextItem.getBoundingClientRect();
            
            if(startRect.height === 0 || endRect.height === 0) return;

            const startPointY = 0;
            const endPointY = endRect.top - startRect.top;

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            const path = document.createElementNS(svgNS, "path");
            
            svg.setAttribute('class', 'timeline-curve');
            svg.setAttribute('viewBox', `0 0 48 ${endPointY}`);
            svg.style.height = `${endPointY}px`;
            
            let d;
            if (item.offsetLeft < 5) {
                d = `M 46 ${startPointY} C 10 ${startPointY + endPointY * 0.3}, 10 ${startPointY + endPointY * 0.7}, 46 ${endPointY}`;
            } else {
                d = `M 2 ${startPointY} C 38 ${startPointY + endPointY * 0.3}, 38 ${startPointY + endPointY * 0.7}, 2 ${endPointY}`;
            }

            path.setAttribute('d', d);
            svg.appendChild(path);
            item.appendChild(svg);
        });
    }

    // =================================================================
    // Sisa Kode JavaScript yang Lain
    // =================================================================
    const indicatorCard = document.getElementById('indicator-card');
    const indicatorModal = document.getElementById('indicator-modal');
    const indicatorOverlay = document.getElementById('indicator-overlay');
    const indicatorCloseBtn = indicatorModal.querySelector('.modal-close-btn');

    indicatorCard.addEventListener('click', () => {
        indicatorOverlay.classList.add('active');
        indicatorModal.classList.add('active');
    });
    const closeIndicatorModal = () => {
        indicatorOverlay.classList.remove('active');
        indicatorModal.classList.remove('active');
    };
    indicatorCloseBtn.addEventListener('click', closeIndicatorModal);
    indicatorOverlay.addEventListener('click', closeIndicatorModal);

    // =================================================================
    // PERBAIKAN: Kode untuk FLIP BUTTON yang sebelumnya hilang
    // =================================================================
    const flipSection = document.querySelector('.flip-section');
    if (flipSection) {
        const flipToContactBtn = document.getElementById('flip-to-contact');
        const flipBackBtn = document.getElementById('flip-back');
        
        if(flipToContactBtn) {
            flipToContactBtn.addEventListener('click', () => flipSection.classList.add('flipped'));
        }
        if(flipBackBtn) {
            flipBackBtn.addEventListener('click', () => flipSection.classList.remove('flipped'));
        }
    }

    // Kode untuk background candlestick
    const bgContainer = document.querySelector('.candlestick-background');
    if (bgContainer) {
        const candleCount = 30;
        for (let i = 0; i < candleCount; i++) {
            const candle = document.createElement('div');
            candle.style.position = 'absolute';
            candle.style.width = '8px';
            const isGreen = Math.random() > 0.5;
            const color = isGreen ? '#26a69a' : '#ef5350';
            candle.style.backgroundColor = color;
            const height = Math.random() * 80 + 20;
            candle.style.height = `${height}px`;
            candle.style.left = `${Math.random() * 100}%`;
            candle.style.top = `${Math.random() * 100}%`;
            bgContainer.appendChild(candle);
            gsap.to(candle, {
                y: (isGreen ? -1 : 1) * (Math.random() * 100 + 50),
                opacity: 0,
                duration: Math.random() * 10 + 5,
                delay: Math.random() * 5,
                repeat: -1,
                ease: 'linear'
            });
        }
    }
    
    // Animasi scroll
    gsap.from(".codex-gallery .card-wrapper", { scrollTrigger: { trigger: ".codex-gallery", start: "top 80%" }, opacity: 0, y: 100, stagger: 0.15, duration: 1, ease: 'power4.out' });
    gsap.from(".focused-content-section", { scrollTrigger: { trigger: ".focused-content-section", start: "top 85%" }, opacity: 0, y: 100, duration: 1, ease: 'power4.out' });
    gsap.from(".flip-section-container", { scrollTrigger: { trigger: ".flip-section-container", start: "top 85%" }, opacity: 0, y: 100, duration: 1, ease: 'power4.out' });

    // Panggil ulang createTimelineCurves saat ukuran window berubah
    window.addEventListener('resize', () => {
        const activeDetails = document.querySelector('.codex-details.active .timeline-cv');
        if (activeDetails) {
            createTimelineCurves(activeDetails);
        }
    });
});