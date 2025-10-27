(() => {
  const playerHPBar = document.getElementById('playerHP');
  const enemyHPBar = document.getElementById('enemyHP');
  const puzzleEl = document.getElementById('puzzle');
  const answerInput = document.getElementById('answer');
  const submitBtn = document.getElementById('submitBtn');
  const messageEl = document.getElementById('message');
  const restartBtn = document.getElementById('restartBtn');

  let playerHP = 100;
  let enemyHP = 100;
  let currentAnswer = null;
  let gameOver = false;

  const puzzles = [
    { q: '5 + 7 * 2 = ?', a: 19 },
    { q: '12 / 4 + 5 = ?', a: 8 },
    { q: '3 * (8 - 2) = ?', a: 18 },
    { q: '16 / 4 * 1 = ?', a: 4 },
    { q: 'Next: 2, 4, 8, 16, ?', a: 32 },
    { q: 'Odd one out: CUP, MUG, PLATE, BOWL', a: 'PLATE' },
    { q: 'If P=16, then S = ?', a: 19 },
    { q: 'The number of sides of a Pentagon?', a: 5 }
  ];

  function pickPuzzle() {
    const p = puzzles[Math.floor(Math.random() * puzzles.length)];
    currentAnswer = p.a;
    puzzleEl.textContent = 'QUERY: ' + p.q;
  }

  function updateHP() {
    playerHP = Math.max(0, Math.min(100, playerHP));
    enemyHP = Math.max(0, Math.min(100, enemyHP));
    playerHPBar.style.width = playerHP + '%';
    enemyHPBar.style.width = enemyHP + '%';
    playerHPBar.style.backgroundColor = playerHP < 30 ? '#f44336' : '#4caf50';
    enemyHPBar.style.backgroundColor = enemyHP < 30 ? '#f44336' : '#4caf50';
  }

  function checkGameOver() {
    if(playerHP <= 0) {
      messageEl.innerHTML = '<span class="damage">SYSTEM DEFEATED! 💀</span>';
      endGame();
    } else if(enemyHP <= 0) {
      messageEl.innerHTML = '<span class="heal">ENEMY DECRYPTED! 🎉</span>';
      endGame();
    }
  }

  function enemyTurn() {
    if(gameOver) return;
    const enemySuccessChance = 0.7 + (100 - enemyHP) * 0.001;
    const success = Math.random() < enemySuccessChance;
    if(success) {
      const dmg = Math.floor(Math.random() * 15) + 8;
      playerHP -= dmg;
      messageEl.innerHTML = `<span class="damage">ENEMY HIT! (-${dmg} HP)</span>`;
    } else {
      messageEl.innerHTML = '<span class="miss">ENEMY FAILED LOGIC CHECK.</span>';
    }
    updateHP();
    checkGameOver();
    if(!gameOver) setTimeout(pickPuzzle, 500);
  }

  function endGame() {
    gameOver = true;
    submitBtn.disabled = true;
    submitBtn.style.boxShadow = 'none';
    restartBtn.style.display = 'block';
  }

  submitBtn.addEventListener('click', () => {
    if(gameOver || submitBtn.disabled) return;
    submitBtn.disabled = true;
    const ans = answerInput.value.trim();
    if(ans === '') {
      messageEl.textContent = 'INPUT REQUIRED.';
      submitBtn.disabled = false;
      return;
    }
    // Compare number or string
    let correct = false;
    if(typeof currentAnswer === 'number') correct = Number(ans) === currentAnswer;
    else correct = ans.toLowerCase() === currentAnswer.toString().toLowerCase();

    if(correct) {
      const dmg = Math.floor(Math.random() * 20) + 15;
      enemyHP -= dmg;
      messageEl.innerHTML = `<span class="heal">CRITICAL HIT! (-${dmg} HP)</span>`;
    } else {
      const dmg = Math.floor(Math.random() * 10) + 7;
      playerHP -= dmg;
      messageEl.innerHTML = `<span class="damage">LOGIC ERROR! (-${dmg} HP)</span>`;
    }
    updateHP();
    answerInput.value = '';
    checkGameOver();
    setTimeout(() => {
      submitBtn.disabled = false;
      enemyTurn();
    }, 1500);
  });

  answerInput.addEventListener('keypress', e => { if(e.key === 'Enter') submitBtn.click(); });

  restartBtn.addEventListener('click', () => {
    playerHP = 100;
    enemyHP = 100;
    gameOver = false;
    submitBtn.disabled = false;
    submitBtn.style.boxShadow = '4px 4px 0 #000';
    restartBtn.style.display = 'none';
    messageEl.textContent = 'Awaiting first move...';
    updateHP();
    pickPuzzle();
  });

  updateHP();
  pickPuzzle();
})();