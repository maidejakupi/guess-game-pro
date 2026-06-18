'use strict';

// ── Game State ──────────────────────────────────────────────────────────────
let secretNumber;
let attempts = 0;
let maxNumber = 100;
let gameOver = false;
let guesses = [];
let bestScore = localStorage.getItem('numquest_best') || null;

// ── DOM Refs ──────────────────────────────────────────────────────────────────
const guessInput      = document.getElementById('guessInput');
const guessBtn        = document.getElementById('guessBtn');
const messageText     = document.getElementById('messageText');
const messageIcon     = document.getElementById('messageIcon');
const attemptsDisplay = document.getElementById('attemptsDisplay');
const bestDisplay     = document.getElementById('bestDisplay');
const rangeDisplay    = document.getElementById('rangeDisplay');
const guessHistory    = document.getElementById('guessHistory');
const hintBar         = document.getElementById('hintBar');
const hintGlow        = document.getElementById('hintGlow');
const inputGroup      = document.getElementById('inputGroup');
const actionRow       = document.getElementById('actionRow');
const difficultyBadge = document.getElementById('difficultyBadge');
const settingsBtn     = document.getElementById('settingsBtn');
const settingsPanel   = document.getElementById('settingsPanel');
const shareBtn        = document.getElementById('shareBtn');
const toast           = document.getElementById('toast');
const proximityRing   = document.getElementById('proximityRing');
const winBurst        = document.getElementById('winBurst');
const bgCanvas        = document.getElementById('bgCanvas');

// ── Animated Background ───────────────────────────────────────────────────────
(function initBg() {
    const ctx = bgCanvas.getContext('2d');
    let W, H;
    const orbs = [
        { x: 0.15, y: 0.15, r: 280, c: '139,92,246', phase: 0 },
        { x: 0.85, y: 0.8,  r: 240, c: '45,212,191', phase: 2.1 },
        { x: 0.5,  y: 0.5,  r: 180, c: '251,113,133', phase: 4.2 },
    ];

    function resize() {
        W = bgCanvas.width  = window.innerWidth;
        H = bgCanvas.height = window.innerHeight;
    }

    function draw(t) {
        ctx.clearRect(0, 0, W, H);
        orbs.forEach(o => {
            const drift = Math.sin(t * 0.0004 + o.phase) * 40;
            const x = o.x * W + drift;
            const y = o.y * H + Math.cos(t * 0.0003 + o.phase) * 30;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, o.r);
            grad.addColorStop(0,   `rgba(${o.c},0.12)`);
            grad.addColorStop(0.5, `rgba(${o.c},0.05)`);
            grad.addColorStop(1,   `rgba(${o.c},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, o.r, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
})();

// ── Init ──────────────────────────────────────────────────────────────────────
function initGame() {
    secretNumber = Math.floor(Math.random() * maxNumber) + 1;
    attempts = 0;
    gameOver = false;
    guesses = [];

    attemptsDisplay.textContent = '0';
    rangeDisplay.textContent = `1–${maxNumber}`;
    bestDisplay.textContent = bestScore !== null ? bestScore : '—';

    messageText.textContent = 'Pick a number and take your shot.';
    messageText.className = 'message-text';
    messageIcon.textContent = '🎯';

    guessHistory.innerHTML = '';
    hintBar.style.width = '0%';
    hintGlow.style.opacity = '0';

    proximityRing.className = 'proximity-ring';

    guessInput.value = '';
    guessInput.min = 1;
    guessInput.max = maxNumber;
    guessInput.disabled = false;
    guessBtn.disabled = false;

    inputGroup.hidden = false;
    actionRow.hidden = true;

    guessInput.focus();
}

// ── Core Logic ─────────────────────────────────────────────────────────────────
function checkGuess() {
    if (gameOver) return;

    const raw   = guessInput.value.trim();
    const guess = Number(raw);

    if (raw === '' || isNaN(guess) || guess < 1 || guess > maxNumber) {
        shakeInput();
        setMessage('⚠️', `Enter a number between 1 and ${maxNumber}.`, '');
        return;
    }

    if (guesses.includes(guess)) {
        shakeInput();
        setMessage('🔄', `You already tried ${guess}. Pick a different number!`, '');
        return;
    }

    attempts++;
    guesses.push(guess);
    attemptsDisplay.textContent = attempts;

    const diff      = Math.abs(guess - secretNumber);
    const proximity = Math.max(0, 100 - (diff / maxNumber) * 100);
    updateHintBar(proximity);
    updateProximityRing(diff);

    if (guess === secretNumber) {
        handleWin();
    } else {
        const isHigh  = guess > secretNumber;
        const direction = isHigh ? 'high' : 'low';
        addChip(guess, direction);

        const warmth = getWarmthLabel(diff);
        const icon   = isHigh ? '📉' : '📈';
        const dir    = isHigh ? 'Too high!' : 'Too low!';
        setMessage(icon, `${dir} ${warmth}`, direction);

        guessInput.value = '';
        guessInput.focus();
        bounceIcon();
    }
}

function handleWin() {
    gameOver = true;

    addChip(secretNumber, 'win');

    const rating = getRating(attempts);
    setMessage('🎉', `Got it in ${attempts} attempt${attempts === 1 ? '' : 's'}! ${rating}`, 'win');
    bounceIcon();

    hintBar.style.width = '100%';
    hintGlow.style.opacity = '1';
    proximityRing.className = 'proximity-ring win-ring';

    if (bestScore === null || attempts < Number(bestScore)) {
        bestScore = attempts;
        localStorage.setItem('numquest_best', bestScore);
        bestDisplay.textContent = bestScore;
        showToast('🏆 New best score!');
    }

    guessInput.disabled = true;
    guessBtn.disabled = true;
    inputGroup.hidden = true;
    actionRow.hidden = false;

    launchConfetti();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function setMessage(icon, text, cls) {
    messageIcon.textContent = icon;
    messageText.className = 'message-text fade-swap' + (cls ? ` ${cls}` : '');
    messageText.textContent = text;
}

function bounceIcon() {
    messageIcon.classList.remove('bounce');
    void messageIcon.offsetWidth;
    messageIcon.classList.add('bounce');
}

function addChip(value, type) {
    const chip = document.createElement('span');
    chip.className = `chip ${type}`;
    chip.textContent = type === 'high' ? `${value} ↑` : type === 'low' ? `${value} ↓` : `${value} ✓`;
    guessHistory.appendChild(chip);
}

function updateHintBar(pct) {
    hintBar.style.width = `${pct}%`;
    hintGlow.style.opacity = pct > 5 ? '1' : '0';
    hintGlow.style.right = '0';
}

function updateProximityRing(diff) {
    const pct = diff / maxNumber;
    if      (pct <= 0.02) proximityRing.className = 'proximity-ring scorching';
    else if (pct <= 0.08) proximityRing.className = 'proximity-ring hot';
    else if (pct <= 0.2)  proximityRing.className = 'proximity-ring warm';
    else                  proximityRing.className = 'proximity-ring';
}

function getWarmthLabel(diff) {
    if (diff <= 2)  return '🔥 Scorching hot!';
    if (diff <= 8)  return '🌡 Very warm!';
    if (diff <= 20) return '☀️ Getting warm…';
    if (diff <= 40) return '🌬 A bit cold.';
    return '🥶 Ice cold.';
}

function getRating(n) {
    if (n === 1)  return '🤯 Unbelievable!';
    if (n <= 3)   return '⚡ Lightning fast!';
    if (n <= 6)   return '🔥 Impressive!';
    if (n <= 10)  return '👍 Nice work!';
    if (n <= 15)  return '😅 You got there!';
    return '🙃 Keep practising!';
}

function shakeInput() {
    guessInput.style.animation = 'none';
    void guessInput.offsetWidth;
    guessInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => { guessInput.style.animation = ''; }, 450);
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Confetti burst ─────────────────────────────────────────────────────────────
function launchConfetti() {
    winBurst.innerHTML = '';
    const colors = ['#a78bfa','#5eead4','#fbbf24','#fb7185','#38bdf8','#86efac'];
    const count  = 55;

    for (let i = 0; i < count; i++) {
        const p   = document.createElement('div');
        p.className = 'particle';
        const x   = 30 + Math.random() * 40;
        const dur = 1.5 + Math.random() * 1.5;
        const del = Math.random() * 0.4;
        const size = 5 + Math.random() * 7;
        const isRect = Math.random() > 0.5;

        p.style.cssText = `
            left: ${x}%;
            top: -10px;
            width: ${size}px;
            height: ${isRect ? size * 0.4 : size}px;
            border-radius: ${isRect ? '2px' : '50%'};
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation-duration: ${dur}s;
            animation-delay: ${del}s;
            transform-origin: center;
        `;
        winBurst.appendChild(p);
    }

    setTimeout(() => { winBurst.innerHTML = ''; }, 3200);
}

// ── Reset ──────────────────────────────────────────────────────────────────────
function resetGame() { initGame(); }

// ── Settings ───────────────────────────────────────────────────────────────────
settingsBtn.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
});

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        maxNumber = Number(btn.dataset.max);
        difficultyBadge.textContent = btn.dataset.label;
        settingsPanel.hidden = true;
        bestScore = null;
        localStorage.removeItem('numquest_best');
        initGame();
    });
});

// ── Share ──────────────────────────────────────────────────────────────────────
shareBtn.addEventListener('click', () => {
    const chips = guesses.map(g => {
        if (g === secretNumber) return '🟩';
        return g > secretNumber ? '🟥' : '🟦';
    }).join('');

    const text = `NumQuest — I guessed the number in ${attempts} attempt${attempts === 1 ? '' : 's'}!\n${chips}\nPlay at NumQuest!`;

    if (navigator.share) {
        navigator.share({ text }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
    }
});

// ── Keyboard ───────────────────────────────────────────────────────────────────
guessInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') checkGuess();
});

// ── Start ──────────────────────────────────────────────────────────────────────
initGame();
