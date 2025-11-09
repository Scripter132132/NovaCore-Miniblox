(function() {
    'use strict';

    // --- Data Storage Helpers ---
    function loadData(key, defaultValue) {
        const saved = localStorage.getItem(`novacore_${key}`);
        return saved ? JSON.parse(saved) : defaultValue;
    }

    function saveData(key, value) {
        localStorage.setItem(`novacore_${key}`, JSON.stringify(value));
    }

    // --- Client State ---
    let totalPlaytime = loadData('playtime', 0);
    let sessionStart = Date.now();
    let menuKeybind = loadData('menuKey', '\\');

    // --- Keystrokes State ---
    let isKeystrokesActive = false;
    let keystrokescontainer = null;
    let keyEventListeners = {}; // Store references to listeners
    const KEY_UP_COLOR = 'rgba(128, 128, 128, 0.7)'; // Translucent Gray for unpressed key

    // --- CSS Block ---
    const style = document.createElement('style');
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    @keyframes slideDownInTop {
        from {opacity: 0; transform: translate(-50%, -70px);}
        to {opacity: 1; transform: translate(-50%, 0);}
    }
    @keyframes slideUpOutTop {
        from {opacity: 1; transform: translate(-50%, 0);}
        to {opacity: 0; transform: translate(-50%, -70px);}
    }
    @keyframes checkPopIn {
        0% {opacity: 0; transform: scale(0);}
        70% {opacity: 1; transform: scale(1.3);}
        100% {opacity: 1; transform: scale(1);}
    }
    @keyframes fadeScaleIn {
        from {opacity: 0; transform: scale(0.75);}
        to {opacity: 1; transform: scale(1);}
    }
    @keyframes strokeDashoffsetAnim {
        0% {stroke-dashoffset: 1000;}
        100% {stroke-dashoffset: 0;}
    }
    @keyframes checkmarkFadeScale {
        0% {opacity: 0; transform: scale(0);}
        100% {opacity: 1; transform: scale(1);}
    }
    @keyframes fadeOut {
        to {opacity: 0;}
    }

    /* --- Keystrokes Module Styles --- */
    .keystroke-key {
        position: absolute;
        color: #ffffff;
        font-weight: bold;
        border-radius: 0;
        background-color: ${KEY_UP_COLOR};
        border: 3px solid #333333;
        font-size: 18px;
        height: 50px;
        width: 50px;
        text-align: center;
        line-height: 50px;
        font-family: 'Roboto Mono', monospace;
        z-index: 10000;
        cursor: grab;
        user-select: none;
        transition: background-color 0.1s ease;
        /* Define the dynamic DOWN color via a CSS variable */
        --key-down-color: hsl(var(--nova-hue), 80%, 30%); /* Darker, saturated version of custom hue */
    }
    #keystrokes-container {
        width: 300px;
        height: 230px;
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        box-shadow: none;
        background-color: transparent;
        z-index: 10000;
        user-select: none;
    }
    /* --- END Keystrokes Module Styles --- */

    /* --- Milestone Notification Style --- */
    #nova-milestone-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #ffd700;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 1.1rem;
        z-index: 9999999;
        opacity: 0;
        transform: translateX(100%);
        transition: opacity 0.5s ease, transform 0.5s ease;
        box-shadow: 0 0 15px #ffd700;
        pointer-events: none;
    }
    #nova-milestone-notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    /* --- END Milestone Notification Style --- */

    /* --- START: CSS Variables for Color Customization --- */
    :root {
        /* Default color for buttons (Cyan/Aqua Blue) */
        --nova-hue: 180;
        --nova-saturation: 100%;
        --nova-lightness: 50%;
    }

    .gold-text {
        color: #FFD700 !important;
        text-shadow:
            0 0 5px rgba(255, 215, 0, 0.8) !important;
            0 0 10px rgba(255, 215, 0, 0.5) !important;
        font-weight: bold !important;
    }

    /* Selectors cover most in-game buttons and UI elements */
    .chakra-button.css-cuh8pi, .chakra-button.css-32lhf4, .chakra-button.css-5ov7ui,
    .chakra-button.css-18wnugv, .chakra-button.css-he6upe, .chakra-button.css-1oxqv3t,
    .chakra-button.css-1dkorm4, .css-10y588r, button.chakra-button.css-livqej,
    button.chakra-button.css-1jg2qv0, div.css-aidfhd, div.css-1kd330l,
    button.chakra-button.css-14mkusw, button.chakra-button.css-8q1apo, .css-1a6laq6,
    button.chakra-button.css-1axaj8o, button.chakra-button.css-xircll, .css-1xy2x8,
    .css-i1x0qw, .css-jnnvp4, .css-hk5viu, .css-55x3n6, .css-n15lby,
    .css-1xqsddr, .css-1ibhl1y, .chakra-stack.css-1c10cfa, .chakra-form-control.css-1kxonj9,
    .chakra-button.css-1dcrejx, .chakra-button.css-1ote1yx, .css-qkv95g, .css-1r8eeg2,
    .chakra-input.css-18whhxd, .chakra-input.css-ypk59i, .chakra-input.css-1oc9k70,
    .css-nizmkx, .css-r7134l, .css-qzh2oi, .chakra-button.css-137k3gn, .chakra-button.css-1n378o7,
    .css-1f34n7d, .css-tncl4j, .css-1tyymsb, .css-ol7umz, .chakra-button.css-12t4nq4 {

        padding: 10px 20px !important;
        /* Using HSL (Hue, Saturation, Lightness) for easy color changes */
        background-color: hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.2) !important;
        color: white !important;
        border: 1px solid hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.6) !important;
        border-radius: 12px !important;
        font-size: 16px !important;
        cursor: pointer !important;
        transition: background-color 0.2s ease, transform 0.2s ease !important;
        outline: none !important;
        box-shadow: 0 0 5px hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.5) !important;
    }

    .chakra-button.css-cuh8pi:hover, .chakra-button.css-32lhf4:hover, .chakra-button.css-5ov7ui:hover,
    .chakra-button.css-18wnugv:hover, .chakra-button.css-he6upe:hover, .chakra-button.css-1oxqv3t:hover,
    .chakra-button.css-1dkorm4:hover, button.chakra-button.css-livqej:hover,
    button.chakra-button.css-1jg2qv0:hover, button.chakra-button.css-14mkusw:hover,
    button.chakra-button.css-8q1apo:hover, button.chakra-button.css-1axaj8o:hover,
    button.chakra-button.css-xircll:hover, .chakra-button.css-1dcrejx:hover,
    .chakra-button.css-1ote1yx:hover, .chakra-button.css-137k3gn:hover,
    .chakra-button.css-1n378o7:hover, .chakra-button.css-12t4nq4:hover {
        background-color: hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.4) !important;
        transform: scale(1.01);
    }

    .chakra-image.css-1je8qb9 {
        display: none !important;
    }

    #nova-intro {
        position: fixed;
        inset: 0;
        background: black;
        z-index: 999999;
        user-select: none;
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .downloaded-btn {
        position: fixed;
        top: 10vh;
        left: 50%;
        transform: translateX(-50%);
        background: #111;
        border: 2px solid #e53935;
        color: white;
        padding: 12px 40px;
        border-radius: 30px;
        font-size: 1.3rem;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 0 12px rgba(229, 57, 53, 0.7);
        animation: slideDownInTop 0.8s ease forwards;
        white-space: nowrap;
        user-select: none;
        z-index: 1000001;
    }

    .checkmark {
        color: #e53935;
        font-size: 1.4rem;
        opacity: 0;
        transform: scale(0);
        animation-fill-mode: forwards;
        animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .client-name-container {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 20px;
        opacity: 0;
        animation-fill-mode: forwards;
        animation-timing-function: ease-out;
        user-select: none;
        z-index: 1000000;
    }

    .client-name-svg {
        width: 300px;
        height: 300px;
        user-select: none;
    }

    #nova-persistent-header {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-weight: 900;
        font-size: 2.5rem;

        /* --- Dynamic Color for Header --- */
        color: hsl(var(--nova-hue), var(--nova-saturation), 70%);
        text-shadow:
            0 0 8px hsl(var(--nova-hue), var(--nova-saturation), 50%),
            0 0 20px hsl(var(--nova-hue), var(--nova-saturation), 50%),
            0 0 30px hsl(var(--nova-hue), var(--nova-saturation), 50%),
            0 0 40px hsl(var(--nova-hue), var(--nova-saturation), 50%),
            0 0 50px hsl(var(--nova-hue), var(--nova-saturation), 50%);
        /* --- End Dynamic Color --- */

        user-select: none;
        z-index: 100000000;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.5s ease;
    }

    #nova-persistent-header.visible {
        opacity: 1;
    }

    #nova-menu-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 10000000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding-top: 40px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease;
        user-select: none;
    }

    #nova-menu-overlay.show {
        opacity: 1;
        pointer-events: auto;
    }

    #nova-menu-header {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 3rem;
        font-weight: 900;
        color: #00ffff;
        text-shadow:
            0 0 8px #00ffff,
            0 0 20px #00ffff,
            0 0 30px #00ffff,
            0 0 40px #00ffff,
            0 0 50px #00ffff;
        user-select: none;
        margin-bottom: 30px;
    }

    #nova-menu-content {
        width: 320px;
        background: #111a;
        border-radius: 16px;
        padding: 24px;
        color: white;
        font-size: 1.1rem;
        box-shadow:
            0 0 10px #00ffff88,
            inset 0 0 8px #00ffff44;
        user-select: none;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .nova-menu-btn {
        background: #000000cc;
        border: 2px solid #00ffff;
        color: #00ffff;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-weight: 700;
        font-size: 1rem;
        padding: 12px 20px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.3s ease, color 0.3s ease;
        user-select: none;
        text-align: center;
    }
    .nova-menu-btn:hover {
        background: #00ffff;
        color: #000;
    }

    #nova-hint-text {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Press Start 2P', cursive;
        color: #00ffff;
        font-size: 1.25rem;
        text-shadow:
            0 0 4px #00ffff,
            0 0 10px #00ffff,
            0 0 14px #00ffff;
        user-select: none;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.8s ease;
        z-index: 9999999;
        white-space: nowrap;
    }

    .counter {
        position: fixed;
        top: 50px;
        left: 50px;
        /* Use HSL variables for the main counter color */
        background: hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.85);
        color: #000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-weight: 700;
        font-size: 1.25rem;
        padding: 8px 14px;
        border-radius: 12px;
        /* Use HSL variables for the box-shadow glow */
        box-shadow:
            0 0 8px hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.7),
            inset 0 0 8px hsla(var(--nova-hue), var(--nova-saturation), var(--nova-lightness), 0.5);
        user-select: none;
        cursor: grab;
        z-index: 999999999;
        width: max-content;
        max-width: 160px;
        text-align: center;
    }
    .counter.dragging {
        cursor: grabbing;
        opacity: 0.85;
        user-select: none;
    }

    /* --- Styles for Playtime Module --- */
    #nova-menu-content {
        max-height: 70vh;
        overflow-y: auto;
        overflow-x: hidden;
    }
    #nova-menu-content::-webkit-scrollbar { width: 8px; }
    #nova-menu-content::-webkit-scrollbar-track { background: #000000aa; border-radius: 8px; }
    #nova-menu-content::-webkit-scrollbar-thumb { background: #00ffff; border-radius: 8px; }
    #nova-menu-content::-webkit-scrollbar-thumb:hover { background: #00dddd; }

    /* Gold Theme Styles */
    #nova-menu-header.gold {
        color: #ffd700;
        text-shadow: 0 0 8px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700, 0 0 40px #ffd700, 0 0 50px #ffd700;
    }
    #nova-menu-content.gold {
        box-shadow: 0 0 10px #ffd70088, inset 0 0 8px #ffd70044;
    }
    #nova-menu-content.gold::-webkit-scrollbar-thumb { background: #ffd700; }
    #nova-menu-content.gold::-webkit-scrollbar-thumb:hover { background: #ffed4e; }
    .nova-menu-btn.gold { border-color: #ffd700; color: #ffd700; }
    .nova-menu-btn.gold:hover { background: #ffd700; color: #000; }

    .nova-menu-btn.static { background: #000; border: 2px solid #444; color: #888; cursor: default; pointer-events: none; border-radius: 10px 10px 0 0; margin-bottom: -2px; }
    .nova-menu-btn.static:hover { background: #000; color: #888; }
    .nova-section { background: #000000aa; border: 2px solid #444; border-radius: 0 0 10px 10px; padding: 15px; margin-bottom: 10px; margin-top: 0; }
    .nova-section.gold { border-color: #ffd700; }
    .nova-info-display { background: #000; border: 2px solid #444; color: #888; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-weight: 700; font-size: 1rem; padding: 12px 20px; border-radius: 10px; user-select: none; text-align: center; cursor: default; }
    .nova-info-display.gold { border-color: #ffd700; color: #ffd700; }

    .gold-text {
        color: #FFD700 !important;
        text-shadow: 0 0 5px rgba(255, 215, 0, 0.8) !important; 0 0 10px rgba(255, 215, 0, 0.5) !important;
        font-weight: bold !important;
    }
    #nova-hint-text {
        text-align: center;
        max-width: 90vw;
        line-height: 1.6;
    }
    `;
    document.head.appendChild(style);

    // --- Helper Functions ---
    function formatPlaytime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const s = seconds % 60;
        const m = minutes % 60;
        const h = hours % 24;
        const d = days;

        return `${d}d ${h}h ${m}m ${s}s`;
    }

    // --- Function to update the keybind ---
    function updateKeybindDisplay(key) {
        menuKeybind = key;
        localStorage.setItem('novaMenuKey', key);

        const keyToDisplay = key === ' ' ? 'Space' : key;

        const keybindButton = document.getElementById('change-keybind-btn');
        if (keybindButton) {
            keybindButton.textContent = `Change Menu Key: ${keyToDisplay}`;
        }

        const hintText = document.getElementById('nova-hint-text');
        if (hintText) {
            hintText.innerHTML = `<span class="gold-text">Novacore</span>: Press ${keyToDisplay} To Open The Menu.`;
        }

        const bindingInput = document.getElementById('binding-input');
        if (bindingInput) {
            bindingInput.value = key;
        }
    }

    function changeMenuKeybind() {
        const keybindButton = document.getElementById('change-keybind-btn');
        const originalText = keybindButton.textContent;
        keybindButton.textContent = 'Press a key...';

        const keyListener = function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'Dead') {
                keybindButton.textContent = originalText;
                document.removeEventListener('keydown', keyListener);
                return;
            }

            const newKey = e.key;
            updateKeybindDisplay(newKey);
            document.removeEventListener('keydown', keyListener);
        };

        document.addEventListener('keydown', keyListener, { once: true });

        setTimeout(() => {
            if (keybindButton.textContent === 'Press a key...') {
                keybindButton.textContent = originalText;
                document.removeEventListener('keydown', keyListener);
            }
        }, 5000);
    }

    // --- UI Elements (Intro) ---
    const overlay = document.createElement('div');
    overlay.id = 'nova-intro';
    const button = document.createElement('div');
    button.className = 'downloaded-btn';
    button.textContent = 'Client Downloaded';

    const clientNameContainer = document.createElement('div');
    clientNameContainer.className = 'client-name-container';
    const clientLogo = document.createElement('img');
    clientLogo.id = 'client-logo';
    clientLogo.src = 'https://raw.githubusercontent.com/Scripter132132/NovaCore-Miniblox/refs/heads/main/NovaCore-Logo.png';
    clientLogo.className = 'client-name-svg';
    clientLogo.style.width = '300px';
    clientLogo.style.height = '300px';
    clientLogo.style.objectFit = 'contain';
    clientNameContainer.appendChild(clientLogo);

    overlay.appendChild(clientNameContainer);
    document.body.appendChild(overlay);

    // Placeholder for checkBtn since it was removed from HTML:
    const checkBtn = document.createElement('span');

    setTimeout(() => { checkBtn.style.animation = 'checkPopIn 0.6s forwards ease'; }, 900);
    setTimeout(() => { button.style.animation = 'slideUpOutTop 0.8s ease forwards'; }, 3200);
    setTimeout(() => { clientNameContainer.style.opacity = '1'; clientNameContainer.style.animation = 'fadeScaleIn 0.8s ease forwards'; }, 4000);
    setTimeout(() => {}, 6300);
    const persistentHeader = document.createElement('div');
    persistentHeader.id = 'nova-persistent-header';
    persistentHeader.textContent = 'Novacore';
    document.body.appendChild(persistentHeader);

    const hintText = document.createElement('div');
    hintText.id = 'nova-hint-text';
    document.body.appendChild(hintText);

    updateKeybindDisplay(menuKeybind);
    // Intro Fade-out
    setTimeout(() => {
        overlay.style.animation = 'fadeOut 1s ease forwards';
        setTimeout(() => {
            overlay.remove();
            persistentHeader.classList.add('visible');
            hintText.style.opacity = '1';
            setTimeout(() => {
                hintText.style.opacity
= '0';
            }, 4000);
        }, 1000);
    }, 7000);
    // --- UI Elements (Menu) ---
    const menuOverlay = document.createElement('div');
    menuOverlay.id = 'nova-menu-overlay';

    const menuHeader = document.createElement('div');
    menuHeader.id = 'nova-menu-header';
    menuHeader.textContent = 'Novacore';
    menuOverlay.appendChild(menuHeader);

    const menuContent = document.createElement('div');
    menuContent.id = 'nova-menu-content';

    const statsBtn = document.createElement('div');
    statsBtn.className = 'nova-menu-btn static';
    statsBtn.textContent = '👾 Playtime With Client';
    menuContent.appendChild(statsBtn);

    const statsSection = document.createElement('div');
    statsSection.className = 'nova-section';
    const playtimeDisplay = document.createElement('div');
    playtimeDisplay.className = 'nova-info-display';
    playtimeDisplay.textContent = '⏱️ 0d 0h 0m 0s';
    statsSection.appendChild(playtimeDisplay);
    menuContent.appendChild(statsSection);

    const bindingBtn = document.createElement('div');
    bindingBtn.className = 'nova-menu-btn static';
    bindingBtn.textContent = 'Set New Keybind';
    menuContent.appendChild(bindingBtn);

    const bindingSection = document.createElement('div');
    bindingSection.className = 'nova-section';
    const bindingInput = document.createElement('input');
    bindingInput.type = 'text';
    bindingInput.id = 'binding-input';
    bindingInput.placeholder = 'Press a key...';
    bindingInput.value = menuKeybind;
    bindingInput.readOnly = true;
    bindingInput.style.width = '100%';
    bindingInput.style.background = '#222';
    bindingInput.style.border = '1px solid #444';
    bindingInput.style.color = '#ffffff';
    bindingInput.style.padding = '10px';
    bindingInput.style.borderRadius = '6px';
    bindingInput.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    bindingInput.style.fontSize = '1rem';
    bindingInput.style.fontWeight = '700';
    bindingInput.style.textAlign = 'center';
    bindingInput.style.outline = 'none';
    bindingInput.style.cursor = 'pointer';
    bindingInput.style.boxSizing = 'border-box';
    bindingSection.appendChild(bindingInput);
    menuContent.appendChild(bindingSection);
    bindingInput.addEventListener('click', () => {
        bindingInput.value = 'Press any key...';
        bindingInput.style.color = '#ff4444';

        const keyHandler = (e) => {
            e.preventDefault();
            const newKey = e.key;
            updateKeybindDisplay(newKey);
            bindingInput.style.color = '#ffffff';

            window.removeEventListener('keydown', keyHandler);
        };
        window.addEventListener('keydown', keyHandler, { once: true });

        setTimeout(() => {
            if (bindingInput.value === 'Press any key...') {
                 updateKeybindDisplay(menuKeybind);
            }
        }, 5000);
    });
    // Standard Modules
    const keystrokesBtn = document.createElement('button');
    keystrokesBtn.className = 'nova-menu-btn';
    keystrokesBtn.textContent = 'Keystrokes';
    menuContent.appendChild(keystrokesBtn);

    const fpsBtn = document.createElement('button');
    fpsBtn.className = 'nova-menu-btn';
    fpsBtn.textContent = 'FPS Counter';
    menuContent.appendChild(fpsBtn);
    const cpsBtn = document.createElement('button');
    cpsBtn.className = 'nova-menu-btn';
    cpsBtn.textContent = 'CPS Counter';
    menuContent.appendChild(cpsBtn);

    const realTimeBtn = document.createElement('button');
    realTimeBtn.className = 'nova-menu-btn';
    realTimeBtn.textContent = 'Real Time';
    menuContent.appendChild(realTimeBtn);

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'nova-menu-btn';
    fullscreenBtn.textContent = 'Auto Fullscreen';
    menuContent.appendChild(fullscreenBtn);
    // Color Customizer Section
    const colorCustomizerContainer = document.createElement('div');
    colorCustomizerContainer.style.padding = '10px 0';

    const colorLabelContainer = document.createElement('div');
    colorLabelContainer.style.display = 'flex';
    colorLabelContainer.style.alignItems = 'center';
    colorLabelContainer.style.justifyContent = 'space-between';
    colorCustomizerContainer.appendChild(colorLabelContainer);

    const colorLabel = document.createElement('div');
    colorLabel.textContent = 'Menu Color (Hue):';
    colorLabel.style.marginBottom = '5px';
    colorLabel.style.color = '#00ffff';
    colorLabelContainer.appendChild(colorLabel);

    const colorDisplay = document.createElement('div');
    colorDisplay.id = 'nova-color-display';
    colorDisplay.style.width = '24px';
    colorDisplay.style.height = '24px';
    colorDisplay.style.borderRadius = '5px';
    colorDisplay.style.border = '2px solid white';
    colorDisplay.style.backgroundColor = 'hsl(180, 100%, 50%)';
    colorLabelContainer.appendChild(colorDisplay);

    const colorSlider = document.createElement('input');
    colorSlider.type = 'range';
    colorSlider.min = '0';
    colorSlider.max = '360';
    colorSlider.value = '180';
    colorSlider.id = 'nova-color-slider';
    colorSlider.style.width = '100%';
    colorSlider.style.cursor = 'pointer';
    colorCustomizerContainer.appendChild(colorSlider);
    menuContent.appendChild(colorCustomizerContainer);

    menuOverlay.appendChild(menuContent);
    document.body.appendChild(menuOverlay);

    const notification = document.createElement('div');
    notification.id = 'nova-milestone-notification';
    document.body.appendChild(notification);
    // --- Playtime & Gold Reward Logic ---
    function updatePlaytimeDisplay() {
        const currentSession = Date.now() - sessionStart;
        const total = totalPlaytime + currentSession;
        playtimeDisplay.textContent = `⏱️ ${formatPlaytime(total)}`;

        const hours = total / (1000 * 60 * 60);
        // --- Milestone Logic ---
        if (hours >= 168) {
            menuHeader.classList.add('gold');
            menuContent.classList.add('gold');
            statsSection.classList.add('gold');
            bindingSection.classList.add('gold');
            playtimeDisplay.classList.add('gold');
            bindingInput.style.borderColor = '#ffd700';
            bindingInput.style.color = '#ffd700';
            document.querySelectorAll('.nova-menu-btn:not(.static)').forEach(btn => btn.classList.add('gold'));
            // Notification Logic
            const goldRewardClaimed = loadData('goldRewardClaimed', false);
            if (!goldRewardClaimed) {
                const notification = document.getElementById('nova-milestone-notification');
                if (notification) {
                    notification.innerHTML = '🏆 10 HOURS PLAYED! Menu theme upgraded to <span class="gold-text" style="font-weight: bold; text-shadow: none;">GOLD</span>!';
                    notification.classList.add('show');

                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 8000);

                    saveData('goldRewardClaimed', true);
                }
            }
        }
    }

    // --- Event Listeners and Module Setup ---
    window.addEventListener('load', () => {
        const slider = document.getElementById('nova-color-slider');
        const display = document.getElementById('nova-color-display');
        const root = document.documentElement;

        if (slider) {
            const initialHue = slider.value;

            root.style.setProperty('--nova-hue', initialHue);

            if (display) {
                display.style.backgroundColor = `hsl(${initialHue}, 100%, 50%)`;
            }

            slider.addEventListener('input', (e) => {
                const newHue = e.target.value;
                root.style.setProperty('--nova-hue', newHue);
                if (display) {
                    display.style.backgroundColor = `hsl(${newHue}, 100%, 50%)`;
                }
            });
        }
    });
    window.addEventListener('keydown', e => {
        if (e.key === menuKeybind) {
            e.preventDefault();
            if (menuOverlay.classList.contains('show')) {
                menuOverlay.classList.remove('show');
                persistentHeader.classList.add('visible');
            } else {
                menuOverlay.classList.add('show');
                persistentHeader.classList.remove('visible');
                updatePlaytimeDisplay();
            }
        }
    });
    fullscreenBtn.addEventListener('click', () => {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error trying to enable fullscreen: ${err.message}`);
            });
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            document.exitFullscreen();
            fullscreenBtn.textContent = 'Auto Fullscreen';
        }
    });
    // --- Keystrokes Logic ---
    function createKey(text, style = {}) {
        const key = document.createElement('div');
        key.textContent = text;
        key.classList.add('keystroke-key');
        Object.assign(key.style, style);
        return key;
    }

    function startKeystrokes() {
        if (isKeystrokesActive) return;
        isKeystrokesActive = true;

        keystrokescontainer = document.createElement('div');
        keystrokescontainer.id = 'keystrokes-container';

        // Load or default position
        const savedLeft = loadData('keystrokesLeft', window.innerWidth / 2);
        const savedTop = loadData('keystrokesTop', window.innerHeight / 2);
        keystrokescontainer.style.left = savedLeft + 'px';
        keystrokescontainer.style.top = savedTop + 'px';

        const wkey = createKey('W', { top: '0px', left: '125px' });
        const akey = createKey('A', { top: '55px', left: '70px' });
        const skey = createKey('S', { top: '55px', left: '125px' });
        const dkey = createKey('D', { top: '55px', left: '180px' });
        const lmb = createKey('LMB', { top: '110px', left: '70px', width: '79px' });
        const rmb = createKey('RMB', { top: '110px', left: '150px', width: '79px' });
        const space = createKey('_____', { top: '170px', left: '70px', width: '160px' });

        keystrokescontainer.append(wkey, akey, skey, dkey, lmb, rmb, space);
        document.body.appendChild(keystrokescontainer);

        // --- Dragging Logic ---
        let isDragging = false;
        let offsetX, offsetY;

        const startDrag = (event) => {
            isDragging = true;
            offsetX = event.clientX - keystrokescontainer.getBoundingClientRect().left;
            offsetY = event.clientY - keystrokescontainer.getBoundingClientRect().top;
            keystrokescontainer.style.cursor = 'grabbing';
        };

        const onDrag = (event) => {
            if (!isDragging) return;
            const newLeft = event.clientX - offsetX;
            const newTop = event.clientY - offsetY;
            keystrokescontainer.style.left = newLeft + 'px';
            keystrokescontainer.style.top = newTop + 'px';
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            keystrokescontainer.style.cursor = 'grab';

            // Save final position
            saveData('keystrokesLeft', parseFloat(keystrokescontainer.style.left));
            saveData('keystrokesTop', parseFloat(keystrokescontainer.style.top));
        };

        keystrokescontainer.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);

        // Save listeners to remove them later
        keyEventListeners.dragListeners = [
            { target: keystrokescontainer, type: 'mousedown', listener: startDrag },
            { target: document, type: 'mousemove', listener: onDrag },
            { target: document, type: 'mouseup', listener: endDrag }
        ];

        // --- Key/Mouse Press Logic ---
        const getDownColor = () => {
             // We get the computed style from one of the key elements (wkey) to read the dynamic CSS variable
            return window.getComputedStyle(wkey).getPropertyValue('--key-down-color');
        };

        const handleKeyDown = (event) => {
            const downColor = getDownColor();
            switch (event.code) {
                case 'KeyW': wkey.style.backgroundColor = downColor; break;
                case 'KeyS': skey.style.backgroundColor = downColor; break;
                case 'KeyA': akey.style.backgroundColor = downColor; break;
                case 'KeyD': dkey.style.backgroundColor = downColor; break;
                case 'Space': space.style.backgroundColor = downColor; break;
            }
        };

        const handleKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW': wkey.style.backgroundColor = KEY_UP_COLOR; break;
                case 'KeyS': skey.style.backgroundColor = KEY_UP_COLOR; break;
                case 'KeyA': akey.style.backgroundColor = KEY_UP_COLOR; break;
                case 'KeyD': dkey.style.backgroundColor = KEY_UP_COLOR; break;
                case 'Space': space.style.backgroundColor = KEY_UP_COLOR; break;
            }
        };

        const handleMouseDown = (event) => {
            const downColor = getDownColor();
            if (event.button === 0) { // Left Click
                lmb.style.backgroundColor = downColor;
            } else if (event.button === 2) { // Right Click
                rmb.style.backgroundColor = downColor;
            }
        };

        const handleMouseUp = (event) => {
            if (event.button === 0) { // Left Click
                lmb.style.backgroundColor = KEY_UP_COLOR;
            } else if (event.button === 2) { // Right Click
                rmb.style.backgroundColor = KEY_UP_COLOR;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        keyEventListeners.keyListeners = [
            { target: document, type: 'keydown', listener: handleKeyDown },
            { target: document, type: 'keyup', listener: handleKeyUp },
            { target: document, type: 'mousedown', listener: handleMouseDown },
            { target: document, type: 'mouseup', listener: handleMouseUp }
        ];

        keystrokesBtn.textContent = 'Hide Keystrokes';
    }

    function stopKeystrokes() {
        if (!isKeystrokesActive) return;
        isKeystrokesActive = false;

        // Remove listeners
        if (keyEventListeners.dragListeners) {
            keyEventListeners.dragListeners.forEach(e => e.target.removeEventListener(e.type, e.listener));
        }
        if (keyEventListeners.keyListeners) {
            keyEventListeners.keyListeners.forEach(e => e.target.removeEventListener(e.type, e.listener));
        }

        if (keystrokescontainer) {
            keystrokescontainer.remove();
            keystrokescontainer = null;
        }

        keystrokesBtn.textContent = 'Keystrokes';
    }

    // --- Add Listeners to Menu Buttons ---
    keystrokesBtn.addEventListener('click', () => {
        if (isKeystrokesActive) {
            stopKeystrokes();
        } else {
            startKeystrokes();
        }
    });

    // --- Time Counters (FPS, CPS, Real Time) ---
    let fpsCounter;
    let fpsInterval, lastFrameTime, frames;
    let isDraggingFPS = false, dragOffsetXFPS = 0, dragOffsetYFPS = 0;
    function createFPSCounter() {
        fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.className = 'counter';
        fpsCounter.textContent = 'FPS: 0';
        document.body.appendChild(fpsCounter);

        fpsCounter.addEventListener('mousedown', e => {
            isDraggingFPS = true;
            dragOffsetXFPS = e.clientX - fpsCounter.getBoundingClientRect().left;
            dragOffsetYFPS = e.clientY - fpsCounter.getBoundingClientRect().top;
            fpsCounter.classList.add('dragging');
            e.preventDefault();
        });
        window.addEventListener('mouseup', () => {
            if (isDraggingFPS) {
                isDraggingFPS = false;
                fpsCounter.classList.remove('dragging');
            }
        });
        window.addEventListener('mousemove', e => {
            if (isDraggingFPS) {
                let newX = e.clientX - dragOffsetXFPS;
                let newY = e.clientY - dragOffsetYFPS;
                const padding = 10;
                newX = Math.min(window.innerWidth - fpsCounter.offsetWidth -
padding,
Math.max(padding, newX));
                newY = Math.min(window.innerHeight - fpsCounter.offsetHeight - padding, Math.max(padding, newY));
                fpsCounter.style.left = newX + 'px';
                fpsCounter.style.top = newY + 'px';
            }
        });
    }

    function startFPSCounter() {
        if (!fpsCounter) createFPSCounter();
        fpsInterval = 1000;
        lastFrameTime = performance.now();
        frames = 0;

        function update() {
            const now = performance.now();
            frames++;
            if (now - lastFrameTime > fpsInterval) {
                const fps = Math.round((frames * 1000) / (now - lastFrameTime));
                fpsCounter.textContent = `FPS: ${fps}`;
                lastFrameTime = now;
                frames = 0;
            }
            if (fpsCounter) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function stopFPSCounter() {
        if (fpsCounter) {
            fpsCounter.remove();
            fpsCounter = null;
        }
    }
    let cpsCounter;
    let cpsClicks = [];
    let isDraggingCPS = false, dragOffsetXCPS = 0, dragOffsetYCPS = 0;
    let cpsIntervalId;
    function createCPSCounter() {
        cpsCounter = document.createElement('div');
        cpsCounter.id = 'cps-counter';
        cpsCounter.className = 'counter';
        cpsCounter.textContent = 'CPS: 0';
        document.body.appendChild(cpsCounter);

        cpsCounter.addEventListener('mousedown', e => {
            isDraggingCPS = true;
            dragOffsetXCPS = e.clientX - cpsCounter.getBoundingClientRect().left;
            dragOffsetYCPS = e.clientY - cpsCounter.getBoundingClientRect().top;
            cpsCounter.classList.add('dragging');
            e.preventDefault();
        });
        window.addEventListener('mouseup', () => {
            if (isDraggingCPS) {
                isDraggingCPS = false;
                cpsCounter.classList.remove('dragging');
            }
        });
        window.addEventListener('mousemove', e => {
            if (isDraggingCPS) {
                let newX = e.clientX - dragOffsetXCPS;
                let newY = e.clientY - dragOffsetYCPS;
                const padding = 10;
                newX = Math.min(window.innerWidth - cpsCounter.offsetWidth -
padding,
Math.max(padding, newX));
                newY = Math.min(window.innerHeight - cpsCounter.offsetHeight - padding, Math.max(padding, newY));
                cpsCounter.style.left = newX + 'px';
                cpsCounter.style.top = newY + 'px';
            }
        });
        window.addEventListener('mousedown', cpsClickListener);
    }

    function cpsClickListener(e) {
        if (e.button === 0) {
            cpsClicks.push(performance.now());
            const cutoff = performance.now() - 1000;
            cpsClicks = cpsClicks.filter(ts => ts >= cutoff);
            updateCPSCounter();
        }
    }

    function updateCPSCounter() {
        if (cpsCounter) {
            cpsCounter.textContent = `CPS: ${cpsClicks.length}`;
        }
    }

    function startCPSCounter() {
        if (!cpsCounter) createCPSCounter();
        cpsClicks = [];
        cpsIntervalId = setInterval(() => {
            const cutoff = performance.now() - 1000;
            cpsClicks = cpsClicks.filter(ts => ts >= cutoff);
            updateCPSCounter();
        }, 100);
    }

    function stopCPSCounter() {
        if (cpsCounter) {
            cpsCounter.remove();
            cpsCounter = null;
        }
        window.removeEventListener('mousedown', cpsClickListener);
        if (cpsIntervalId) clearInterval(cpsIntervalId);
    }

    let fpsShown = false;
    let cpsShown = false;
    fpsBtn.addEventListener('click', () => {
        if (fpsShown) {
            stopFPSCounter();
            fpsBtn.textContent = 'FPS Counter';
            fpsShown = false;
        } else {
            startFPSCounter();
            fpsBtn.textContent = 'Hide FPS Counter';

     fpsShown = true;

        }
    });
    cpsBtn.addEventListener('click', () => {
        if (cpsShown) {
            stopCPSCounter();
            cpsBtn.textContent = 'CPS Counter';
            cpsShown = false;
        } else {
            startCPSCounter();
            cpsBtn.textContent = 'Hide CPS Counter';

     cpsShown = true;

        }
    });
    let realTimeCounter;
    let realTimeTooltip;
    let realTimeInterval;
    let realTimeShown = false;
    function createRealTimeCounter() {
        realTimeCounter = document.createElement('div');
        realTimeCounter.id = 'real-time-counter';
        realTimeCounter.style.position = 'fixed';
        realTimeCounter.style.bottom = '10px';
        realTimeCounter.style.right = '10px';
        realTimeCounter.style.color = '#fff';
        realTimeCounter.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        realTimeCounter.style.fontWeight = '700';
        realTimeCounter.style.fontSize = '22px';
        realTimeCounter.style.userSelect = 'none';
        realTimeCounter.style.zIndex = '9999';
        realTimeCounter.style.cursor = 'default';

        realTimeTooltip = document.createElement('div');
        realTimeTooltip.textContent = "Shows you the time so you don't have to exit Fullscreen";
        realTimeTooltip.style.position = 'absolute';
        realTimeTooltip.style.bottom = 'calc(100% + 8px)';
        realTimeTooltip.style.right = '0';
        realTimeTooltip.style.backgroundColor = 'black';
        realTimeTooltip.style.color = 'white';
        realTimeTooltip.style.padding = '6px 10px';
        realTimeTooltip.style.borderRadius = '6px';
        realTimeTooltip.style.fontSize = '12px';
        realTimeTooltip.style.whiteSpace = 'nowrap';
        realTimeTooltip.style.boxShadow = '0 0 6px rgba(0,0,0,0.8)';
        realTimeTooltip.style.opacity = '0';
        realTimeTooltip.style.pointerEvents = 'none';
        realTimeTooltip.style.transition = 'opacity 0.25s ease';
        realTimeCounter.appendChild(realTimeTooltip);

        realTimeCounter.addEventListener('mouseenter', () => {
            realTimeTooltip.style.opacity = '1';
            realTimeTooltip.style.pointerEvents = 'auto';
        });
        realTimeCounter.addEventListener('mouseleave', () => {
            realTimeTooltip.style.opacity = '0';
            realTimeTooltip.style.pointerEvents = 'none';
        });
        document.body.appendChild(realTimeCounter);
    }

    function updateRealTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ?
        hours : 12;
        realTimeCounter.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
        realTimeCounter.appendChild(realTimeTooltip);
    }

    function startRealTimeCounter() {
        if (!realTimeCounter) createRealTimeCounter();
        updateRealTime();
        realTimeInterval = setInterval(updateRealTime, 1000);
    }

    function stopRealTimeCounter() {
        if (realTimeCounter) {
            realTimeCounter.remove();
            realTimeCounter = null;
        }
        if (realTimeInterval) {
            clearInterval(realTimeInterval);
            realTimeInterval = null;
        }
    }

    realTimeBtn.addEventListener('click', () => {
        if (realTimeShown) {
            stopRealTimeCounter();
            realTimeBtn.textContent = 'Real Time';
            realTimeShown = false;
        } else {
            startRealTimeCounter();
            realTimeBtn.textContent
=
'Hide Real Time';
            realTimeShown = true;
        }
    });
    // --- Background and Coin Logic ---
    const NEW_BACKGROUND_URL = "https://i.redd.it/i-made-some-wallpapers-using-shaders-v0-tgfd02iq0lba1.png?width=2880&format=png&auto=webp&s=b124065d9841d2ec52508000f7e896ec7d244839";
    const BACKGROUND_SELECTORS = ['img.chakra-image.css-rkihvp', 'img.chakra-image.css-mohuzh', '.css-aznra0'];
    function applyCustomBackground(element) {
        for (const selector of BACKGROUND_SELECTORS) {
            if (element.matches(selector)) {
                element.src = NEW_BACKGROUND_URL;
                element.style.objectFit = 'cover';
                element.style.width = '100vw';
                element.style.height = '100vh';
                element.style.position = 'fixed';
                element.style.zIndex = '-1';
                return;
            }
        }
    }

    function startBackgroundObserver() {
        BACKGROUND_SELECTORS.forEach(selector => { document.querySelectorAll(selector).forEach(applyCustomBackground); });
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {

                            applyCustomBackground(node);
                            BACKGROUND_SELECTORS.forEach(selector => { node.querySelectorAll(selector).forEach(applyCustomBackground); });
                        }
                    });

                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    startBackgroundObserver();

    const OLD_COIN_URL = "https://miniblox.io/assets/coin-D__IidTw.png";
    const NEW_COIN_URL = "https://raw.githubusercontent.com/botleast/Textures/refs/heads/main/spinning_coin_vertical.gif";
    setTimeout(() => {
        document.querySelectorAll(`img[src="${OLD_COIN_URL}"]`).forEach(img => { img.src = NEW_COIN_URL; });
    }, 5000);
    // --- FINAL SETUP ---
    window.addEventListener('beforeunload', () => {
        const currentSession = Date.now() - sessionStart;
        totalPlaytime += currentSession;
        saveData('playtime', totalPlaytime);
    });
    setInterval(updatePlaytimeDisplay, 1000);

})();

// ===== FPS Bypass/Booster=====
(function() {
    'use strict';
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
        return setTimeout(function() {
            callback(performance.now());
        }, 0);
    };
})();

