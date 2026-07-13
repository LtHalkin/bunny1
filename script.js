/* =========================================================
   ANNIVERSARY SITE — SCRIPT
   Stages: 0 hero, 1 quiz, 2 sliding puzzle, 3 secret code, 4 final
   Progress is saved to localStorage so refreshing doesn't reset it.
   ========================================================= */

// ---------- STATE ----------
const STORAGE_KEY = 'anniversaryStage';
let currentStage = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;

const sections = {
  0: document.getElementById('hero-section'),
  1: document.getElementById('puzzle1-section'),
  2: document.getElementById('puzzle2-section'),
  3: document.getElementById('puzzle3-section'),
  4: document.getElementById('final-section'),
};

// ---------- SHOW / HIDE SECTIONS ----------
function goToStage(stage) {
  currentStage = stage;
  localStorage.setItem(STORAGE_KEY, stage);
  Object.values(sections).forEach(s => s.classList.add('hidden'));
  sections[stage].classList.remove('hidden');
  updateProgressTracker(stage);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (stage === 2) initSlidingPuzzle();
  if (stage === 4) initFinalPage();
}

function updateProgressTracker(stage) {
  document.querySelectorAll('.progress-step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'done');
    if (stepNum === stage) step.classList.add('active');
    else if (stepNum < stage) step.classList.add('done');
  });
}

// On load, resume wherever the user left off
window.addEventListener('DOMContentLoaded', () => {
  goToStage(currentStage);
});

// ---------- LOADING SCREEN ----------
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
  }, 900);
});

// ---------- CUSTOM CURSOR ----------
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
document.addEventListener('mousemove', e => {
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top = e.clientY + 'px';
});
document.addEventListener('mouseover', e => {
  if (e.target.closest('button, input, .quiz-option, .puzzle-tile')) {
    cursorRing.classList.add('hover-active');
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('button, input, .quiz-option, .puzzle-tile')) {
    cursorRing.classList.remove('hover-active');
  }
});

// ---------- AMBIENT FLOATING HEARTS / PARTICLES ----------
const ambientLayer = document.getElementById('ambient-layer');
function spawnAmbient() {
  const isHeart = Math.random() > 0.4;
  const el = document.createElement('div');
  el.className = isHeart ? 'floating-heart' : 'glow-particle';
  if (isHeart) el.textContent = '❤';
  el.style.left = Math.random() * 100 + 'vw';
  const duration = 8 + Math.random() * 10;
  el.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
  el.style.animationDuration = duration + 's';
  ambientLayer.appendChild(el);
  setTimeout(() => el.remove(), duration * 1000);
}
setInterval(spawnAmbient, 700);

// ---------- BEGIN BUTTON ----------
document.getElementById('begin-btn').addEventListener('click', () => goToStage(1));

// ---------- CONTINUE BUTTONS (delegated) ----------
document.addEventListener('click', e => {
  if (e.target.classList.contains('continue-btn')) {
    goToStage(parseInt(e.target.dataset.next));
  }
});

/* =========================================================
   PUZZLE 1 — MEMORY QUIZ
   ========================================================= */
const quizData = [
  {
    question: "Where did we first meet?",
    type: 'choice',
    options: ["Cormac's house", "The park", "College", "A friend's party"],
    answer: "Cormac's house"
  },
  {
    question: "What date did we officially get together?",
    type: 'choice',
    options: ["13/02/26", "14/02/26", "01/03/26", "14/03/26"],
    answer: "14/02/26"
  },
  {
    question: "What's our favourite thing to do together?",
    type: 'choice',
    options: ["Yapping", "Watching movies", "Cooking", "Gaming"],
    answer: "Yapping"
  },
  {
    question: "What's our inside joke?",
    type: 'choice',
    options: ["The sky is red", "The moon is a banana", "Ducks are spies", "Pineapple on pizza"],
    answer: "The sky is red"
  },
  {
    question: "What's my favourite thing about you?",
    type: 'text' // any non-empty answer accepted
  }
];

const quizAnswers = {}; // index -> chosen answer

function renderQuiz() {
  const container = document.getElementById('quiz-container');
  container.innerHTML = '';

  quizData.forEach((q, i) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz-question';
    qDiv.dataset.index = i;

    const qText = document.createElement('p');
    qText.className = 'q-text';
    qText.textContent = `${i + 1}. ${q.question}`;
    qDiv.appendChild(qText);

    if (q.type === 'choice') {
      const optWrap = document.createElement('div');
      optWrap.className = 'quiz-options';
      q.options.forEach(opt => {
        const optBtn = document.createElement('div');
        optBtn.className = 'quiz-option';
        optBtn.textContent = opt;
        optBtn.addEventListener('click', () => {
          optWrap.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
          optBtn.classList.add('selected');
          quizAnswers[i] = opt;
        });
        optWrap.appendChild(optBtn);
      });
      qDiv.appendChild(optWrap);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'quiz-text-input';
      input.placeholder = 'Type your answer...';
      input.addEventListener('input', () => { quizAnswers[i] = input.value; });
      qDiv.appendChild(input);
    }

    container.appendChild(qDiv);
  });

  const submitRow = document.createElement('div');
  submitRow.className = 'quiz-submit-row';
  const submitBtn = document.createElement('button');
  submitBtn.className = 'glow-btn';
  submitBtn.textContent = 'Submit Answers';
  submitBtn.addEventListener('click', checkQuiz);
  submitRow.appendChild(submitBtn);
  container.appendChild(submitRow);
}

function checkQuiz() {
  let allCorrect = true;

  quizData.forEach((q, i) => {
    const given = (quizAnswers[i] || '').toString().trim();

    if (q.type === 'text') {
      if (given.length === 0) allCorrect = false;
      return;
    }

    const qDiv = document.querySelector(`.quiz-question[data-index="${i}"]`);
    const options = qDiv.querySelectorAll('.quiz-option');
    const isCorrect = given.toLowerCase() === q.answer.toLowerCase();
    if (!isCorrect) allCorrect = false;

    options.forEach(opt => {
      if (opt.textContent === q.answer) opt.classList.add('correct');
      else if (opt.classList.contains('selected') && !isCorrect) opt.classList.add('incorrect');
    });
  });

  if (allCorrect) {
    setTimeout(() => {
      document.getElementById('quiz-container').classList.add('hidden');
      document.getElementById('quiz-success').classList.remove('hidden');
      launchConfetti();
    }, 500);
  } else {
    setTimeout(() => {
      document.querySelectorAll('.quiz-option.incorrect, .quiz-option.correct').forEach(o => {
        o.classList.remove('incorrect', 'correct');
      });
    }, 1400);
  }
}

renderQuiz();

/* =========================================================
   PUZZLE 2 — 4x4 SLIDING PUZZLE
   ========================================================= */
const GRID_SIZE = 4;
let board = [];          // board[position] = tileValue (0-14 = image pieces, 15 = blank)
let blankPos = GRID_SIZE * GRID_SIZE - 1;
let moveCount = 0;
let timerInterval = null;
let secondsElapsed = 0;
let puzzleStarted = false;
let puzzleSolved = false;

function initSlidingPuzzle() {
  puzzleSolved = false;
  moveCount = 0;
  secondsElapsed = 0;
  puzzleStarted = false;
  clearInterval(timerInterval);
  document.getElementById('move-counter').textContent = '0';
  document.getElementById('timer').textContent = '00:00';
  document.getElementById('puzzle2-success').classList.add('hidden');
  document.getElementById('sliding-puzzle-grid').classList.remove('hidden');
  document.getElementById('shuffle-btn').classList.remove('hidden');

  board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
  blankPos = GRID_SIZE * GRID_SIZE - 1;
  renderPuzzle();
}

function renderPuzzle() {
  const grid = document.getElementById('sliding-puzzle-grid');
  grid.innerHTML = '';
  const size = grid.clientWidth; // square container
  const tileSize = size / GRID_SIZE;

  board.forEach((value, pos) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    tile.dataset.value = value;
    tile.style.width = tileSize + 'px';
    tile.style.height = tileSize + 'px';

    const row = Math.floor(pos / GRID_SIZE);
    const col = pos % GRID_SIZE;
    tile.style.transform = `translate(${col * tileSize}px, ${row * tileSize}px)`;

    if (value === GRID_SIZE * GRID_SIZE - 1) {
      tile.classList.add('blank');
    } else {
      const vRow = Math.floor(value / GRID_SIZE);
      const vCol = value % GRID_SIZE;
      tile.style.backgroundSize = `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`;
      tile.style.backgroundPosition = `${(vCol * 100) / (GRID_SIZE - 1)}% ${(vRow * 100) / (GRID_SIZE - 1)}%`;
      tile.addEventListener('click', () => attemptMove(pos));
    }

    grid.appendChild(tile);
  });
}

function attemptMove(pos) {
  if (puzzleSolved) return;
  const row = Math.floor(pos / GRID_SIZE), col = pos % GRID_SIZE;
  const bRow = Math.floor(blankPos / GRID_SIZE), bCol = blankPos % GRID_SIZE;
  const isAdjacent = (Math.abs(row - bRow) + Math.abs(col - bCol)) === 1;
  if (!isAdjacent) return;

  if (!puzzleStarted) {
    puzzleStarted = true;
    startTimer();
  }

  [board[pos], board[blankPos]] = [board[blankPos], board[pos]];
  blankPos = pos;
  moveCount++;
  document.getElementById('move-counter').textContent = moveCount;
  renderPuzzle();
  checkPuzzleSolved();
}

function checkPuzzleSolved() {
  const solved = board.every((v, i) => v === i);
  if (solved) {
    puzzleSolved = true;
    clearInterval(timerInterval);
    document.querySelectorAll('.puzzle-tile').forEach(t => t.classList.add('solved-glow'));
    setTimeout(() => {
      document.getElementById('puzzle2-success').classList.remove('hidden');
      launchConfetti();
    }, 700);
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const m = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const s = String(secondsElapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${m}:${s}`;
  }, 1000);
}

function shufflePuzzle() {
  clearInterval(timerInterval);
  puzzleStarted = false;
  puzzleSolved = false;
  moveCount = 0;
  secondsElapsed = 0;
  document.getElementById('move-counter').textContent = '0';
  document.getElementById('timer').textContent = '00:00';

  // Perform random valid moves from the solved state to guarantee solvability
  board = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
  blankPos = GRID_SIZE * GRID_SIZE - 1;

  let lastPos = -1;
  for (let i = 0; i < 300; i++) {
    const row = Math.floor(blankPos / GRID_SIZE), col = blankPos % GRID_SIZE;
    const neighbors = [];
    if (row > 0) neighbors.push(blankPos - GRID_SIZE);
    if (row < GRID_SIZE - 1) neighbors.push(blankPos + GRID_SIZE);
    if (col > 0) neighbors.push(blankPos - 1);
    if (col < GRID_SIZE - 1) neighbors.push(blankPos + 1);

    const options = neighbors.filter(n => n !== lastPos);
    const chosen = options[Math.floor(Math.random() * options.length)];

    [board[chosen], board[blankPos]] = [board[blankPos], board[chosen]];
    lastPos = blankPos;
    blankPos = chosen;
  }

  renderPuzzle();
}

document.getElementById('shuffle-btn').addEventListener('click', shufflePuzzle);
window.addEventListener('resize', () => { if (currentStage === 2) renderPuzzle(); });

/* =========================================================
   PUZZLE 3 — SECRET CODE
   Clue 1: "yapping" (the thing we never stop doing)
   Clue 2: "143" (I Love You in text-speak)
   Password: yapping143
   ========================================================= */
const SECRET_PASSWORD = 'yapping143';

document.getElementById('unlock-btn').addEventListener('click', checkSecretCode);
document.getElementById('secret-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') checkSecretCode();
});

function checkSecretCode() {
  const input = document.getElementById('secret-input').value.trim().toLowerCase().replace(/\s+/g, '');
  const errorMsg = document.getElementById('secret-error');

  if (input === SECRET_PASSWORD) {
    errorMsg.classList.add('hidden');
    playDoorAnimation();
  } else {
    errorMsg.classList.remove('hidden');
    const card = document.querySelector('.secret-card');
    card.style.animation = 'none';
    void card.offsetWidth; // restart animation
    card.style.animation = 'sectionFadeIn 0.3s ease';
  }
}

function playDoorAnimation() {
  const overlay = document.getElementById('door-overlay');
  overlay.classList.add('active');
  requestAnimationFrame(() => overlay.classList.add('opening'));

  setTimeout(() => {
    goToStage(4);
    overlay.classList.remove('active', 'opening');
  }, 1500);
}

/* =========================================================
   FINAL PAGE — STARS, TYPEWRITER, MUSIC
   ========================================================= */
let finalPageInitialized = false;
let typewriterTimeout = null;

function initFinalPage() {
  if (!finalPageInitialized) {
    createStars();
    finalPageInitialized = true;
  }
  runTypewriter();
}

function createStars() {
  const container = document.getElementById('stars-container');
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDuration = (2 + Math.random() * 3) + 's';
    container.appendChild(star);
  }
}

function runTypewriter() {
  const source = document.getElementById('letter-content').textContent.trim();
  const target = document.getElementById('typewriter-text');
  target.textContent = '';
  clearTimeout(typewriterTimeout);

  let i = 0;
  function typeChar() {
    if (i < source.length) {
      target.textContent += source.charAt(i);
      i++;
      typewriterTimeout = setTimeout(typeChar, 28);
    }
  }
  typeChar();
}

document.getElementById('read-again-btn').addEventListener('click', runTypewriter);

// Music mute/unmute
const bgMusic = document.getElementById('bg-music');
const muteBtn = document.getElementById('mute-btn');
let musicStarted = false;

muteBtn.addEventListener('click', () => {
  if (!musicStarted) {
    bgMusic.volume = 0.5;
    bgMusic.play().catch(() => {}); // ignore autoplay-block errors
    musicStarted = true;
    muteBtn.textContent = '🔊';
    return;
  }
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
    muteBtn.textContent = '🔊';
  } else {
    bgMusic.pause();
    muteBtn.textContent = '🔇';
  }
});

/* =========================================================
   CONFETTI (canvas-based, lightweight)
   ========================================================= */
const confettiCanvas = document.getElementById('confetti-canvas');
const ctx = confettiCanvas.getContext('2d');
let confettiParticles = [];
let confettiAnimating = false;

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function launchConfetti() {
  const colors = ['#f7c9d3', '#e8a1b3', '#e3d7f4', '#d4af37', '#fdf6f0'];
  confettiParticles = Array.from({ length: 140 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20,
    size: 4 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 3,
    speedX: (Math.random() - 0.5) * 3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
  }));

  if (!confettiAnimating) {
    confettiAnimating = true;
    animateConfetti();
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let stillActive = false;

  confettiParticles.forEach(p => {
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.rotationSpeed;
    if (p.y < confettiCanvas.height + 20) stillActive = true;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  });

  if (stillActive) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimating = false;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}
