/* ======= Logic ======= */
let score = 0;                 // current score
let currentAnswer = 0;         // numeric correct answer
let timeLeft = 10;             // seconds per question
let timer = null;
let running = false;
let highscore = 0;

const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const scoreEl = document.getElementById("score");
const hintEl = document.getElementById("hint");
const startBtn = document.getElementById("start");
const submitBtn = document.getElementById("submit");
const progressCircle = document.getElementById("progressCircle");
const centerText = document.getElementById("centerText");
const highScoreDisplay = document.getElementById("highScoreDisplay");

// circle math: r = 45 -> circumference = 2πr
const R = 45;
const fullDash = 2 * Math.PI * R;
progressCircle.style.strokeDasharray = String(fullDash);
progressCircle.style.strokeDashoffset = '0';

// load saved highscore if exists
if (localStorage.getItem('maths-rush-hs')) {
  highscore = +localStorage.getItem('maths-rush-hs');
  highScoreDisplay.textContent = `HIGH: ${highscore}`;
}

/* Audio safe helper */
let audioCtx = null;
function ensureAudio(){
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e){
    audioCtx = null;
  }
}
function playTone(freq, dur){
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.09;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.stop(audioCtx.currentTime + dur + 0.02);
  } catch(e){}
}

/* small helper for hint text with optional class */
function hint(msg, className=''){
  if(!hintEl) return;
  hintEl.innerHTML = `<span class="${className}">${msg}</span>`;
}

/* division generator that returns perfect division */
function generateDivision(maxResult = 15, maxDivisor = 10){
  const divisor = Math.floor(Math.random() * (maxDivisor - 1)) + 2; // 2..maxDivisor
  const result  = Math.floor(Math.random() * maxResult) + 1;        // 1..maxResult
  const dividend = divisor * result;
  return { a: dividend, b: divisor, answer: result };
}

/* Create a new question and reset timer */
function newQuestion(){
  // variety: larger numbers for more challenge
  const a = Math.floor(Math.random() * 15) + 5; // 5..19
  const b = Math.floor(Math.random() * 15) + 5; // 5..19
  const ops = ["+","-","×","÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let qText = '';
  switch(op){
    case "+":
      currentAnswer = a + b;
      qText = `${a} + ${b}`;
      break;
    case "-":
      const [n1, n2] = a >= b ? [a,b] : [b,a];
      currentAnswer = n1 - n2;
      qText = `${n1} - ${n2}`;
      break;
    case "×":
      currentAnswer = a * b;
      qText = `${a} × ${b}`;
      break;
    case "÷":
      const div = generateDivision(15, 10);
      currentAnswer = div.answer;
      qText = `${div.a} ÷ ${div.b}`;
      break;
  }

  questionEl.textContent = qText;
  answerEl.value = "";
  answerEl.focus();
  resetTimer();
}

/* Timer functions */
function clearTimer(){
  if (timer) { clearInterval(timer); timer = null; }
}
function resetTimer(){
  clearTimer();
  timeLeft = 10;
  updateTimerVisual();
  timer = setInterval(()=>{
    timeLeft--;
    updateTimerVisual();
    if (timeLeft <= 0){
      clearTimer();
      // timeout behavior
      hint(`[TIMEOUT] Correct value was ${currentAnswer}`, 'feedback-time');
      ensureAudio();
      playTone(150, 0.35);
      // small pause so user sees feedback
      setTimeout(()=> {
        if (running) newQuestion();
      }, 1200);
    }
  }, 1000);
}

function updateTimerVisual(){
  centerText.textContent = String(Math.max(0, timeLeft));
  // offset grows as time decays: 0 offset -> full circle visible
  const pct = Math.max(0, Math.min(1, timeLeft / 10));
  const offset = fullDash * (1 - pct);
  progressCircle.style.strokeDashoffset = String(offset);

  if (timeLeft <= 3){
    progressCircle.classList.add('low-time-indicator');
    centerText.style.color = 'var(--wrong)';
  } else {
    progressCircle.classList.remove('low-time-indicator');
    centerText.style.color = 'var(--accent)';
  }
}

/* Answer checking */
function checkAnswer(){
  if(!running) return;
  const raw = answerEl.value;
  if (raw === null || raw === '') { hint('Input required.', 'feedback-wrong'); return; }
  const val = Number(raw);
  if (Number.isNaN(val)){
    hint('Invalid number', 'feedback-wrong'); return;
  }

  clearTimer();

  // for division we expect integer results (we generate integer division)
  if (Math.abs(val - currentAnswer) < 0.01){
    const gained = 10 + Math.max(0, timeLeft);
    score += gained;
    scoreEl.textContent = `SCORE: ${score}`;
    hint(`[CORRECT] +${gained} pts`, 'feedback-right');
    ensureAudio();
    playTone(880, 0.12);

    if (score > highscore){
      highscore = score;
      localStorage.setItem('maths-rush-hs', String(highscore));
      highScoreDisplay.textContent = `HIGH: ${highscore} ✨`;
    }
  } else {
    hint(`[ERROR] Value was ${currentAnswer}`, 'feedback-wrong');
    ensureAudio();
    playTone(220, 0.28);
  }

  // next question after short delay
  setTimeout(()=> {
    if (running) newQuestion();
  }, 900);
}

/* Start / stop logic */
function startGame(){
  if (running) return;
  running = true;
  score = 0;
  scoreEl.textContent = `SCORE: ${score}`;
  startBtn.textContent = 'STOP PROTOCOL';
  answerEl.disabled = false;
  submitBtn.disabled = false;
  hint("EXECUTE CALCULATION BEFORE TIMEOUT!", 'feedback-right');
  ensureAudio();
  newQuestion();
  answerEl.focus();
}

function stopGame(){
  running = false;
  clearTimer();
  startBtn.textContent = 'Start Protocol';
  answerEl.disabled = true;
  submitBtn.disabled = true;
  questionEl.textContent = 'Awaiting Query...';
  hint('Protocol halted. Press Start to resume.');
  centerText.textContent = '10';
  progressCircle.style.strokeDashoffset = '0';
}

/* Event wiring */
startBtn.addEventListener('click', ()=> {
  // try to resume audio context on first gesture
  try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
  if (running) stopGame(); else startGame();
});
submitBtn.addEventListener('click', checkAnswer);
answerEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkAnswer();
});

// accessibility: allow 1-4 keys to focus quickly (optional)
document.addEventListener('keydown', (e) => {
  if (!running) return;
  if (['1','2','3','4'].includes(e.key)){
    answerEl.focus();
  }
});