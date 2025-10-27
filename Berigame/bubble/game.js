(() => {
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const nextCanvas=document.getElementById('next');
const nextCtx=nextCanvas.getContext('2d');
const scoreEl=document.getElementById('score');
const levelEl=document.getElementById('level');
const restartBtn=document.getElementById('restart');
const gameOverOverlay=document.getElementById('gameOver');
const playAgain=document.getElementById('playAgain');

// Sounds
const popSound=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_f63e3ff41e.mp3?filename=pop-94319.mp3');
const shootSound=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_327ba9a27f.mp3?filename=blip-94313.mp3');
const loseSound=new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_25b78937a4.mp3?filename=lose-91300.mp3');
const bgMusic=new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_88f6b0b407.mp3'); 
bgMusic.loop=true; bgMusic.volume=0.15; bgMusic.play().catch(()=>{});

// Game variables
let cols, rows, radius, grid, score, level;
const COLORS=['#F05D5D','#FFC300','#4CAF50','#2196F3','#9C27B0'];
const shooter={x:0,y:0,angle:-Math.PI/2,speed:900,bubble:null,nextBubble:null,shooting:false,vx:0,vy:0};
let gameOver=false;

// Particles
const particles=[];
for(let i=0;i<120;i++){particles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*2+1,speed:Math.random()*0.5+0.2});}

function resize(){
  canvas.width=canvas.clientWidth*devicePixelRatio;
  canvas.height=canvas.clientHeight*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
window.addEventListener('resize',resize);

function makeBubble(){return {color:COLORS[Math.floor(Math.random()*COLORS.length)]};}

function init(){
  radius=Math.max(16,Math.min(28,Math.floor(window.innerWidth/40)));
  cols=Math.max(9,Math.floor((canvas.clientWidth-40)/(radius*2)));
  rows=9; grid=[]; score=0; level=1; gameOver=false;
  gameOverOverlay.classList.remove('show');
  for(let r=0;r<rows;r++){
    let row=[]; 
    for(let c=0;c<cols;c++){
      row.push({color:r<4?COLORS[Math.floor(Math.random()*COLORS.length)]:null,occupied:r<4});
    }
    grid.push(row);
  }
  shooter.bubble=makeBubble();
  shooter.nextBubble=makeBubble();
  updateUI();
  resize();
}

function updateUI(){
  scoreEl.textContent=score;
  levelEl.textContent=level;
  drawNext();
}

function drawNext(){
  nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  nextCtx.save();
  nextCtx.translate(nextCanvas.width/2,nextCanvas.height/2);
  nextCtx.beginPath();
  nextCtx.arc(0,0,16,0,Math.PI*2);
  nextCtx.fillStyle=shooter.nextBubble.color;
  nextCtx.shadowColor=shooter.nextBubble.color;
  nextCtx.shadowBlur=8;
  nextCtx.fill();
  nextCtx.shadowBlur=0;
  nextCtx.restore();
}

// Grid conversion
function worldToGrid(x,y){const topPadding=10;let row=Math.floor((y-topPadding)/(radius*1.75));row=Math.max(0,Math.min(rows-1,row));const rowOffset=(row%2===1)?radius:0;let col=Math.floor((x-rowOffset)/(radius*2));col=Math.max(0,Math.min(cols-1,col));return {row,col};}
function gridToWorld(row,col){const topPadding=10;const x=col*radius*2+((row%2===1)?radius:0)+radius;const y=row*radius*1.75+topPadding+radius;return {x,y};}

// Pointer
let pointer={x:0,y:0};
function pointerMove(e){
  const rect=canvas.getBoundingClientRect();
  const t=e.touches?e.touches[0]:e;
  pointer.x=t.clientX-rect.left;
  pointer.y=t.clientY-rect.top;
  shooter.x=canvas.clientWidth/2;
  shooter.y=canvas.clientHeight-40;
  shooter.angle=Math.atan2(pointer.y-shooter.y,pointer.x-shooter.x);
  shooter.angle=Math.max(-Math.PI+0.3,Math.min(-0.3,shooter.angle));
}
canvas.addEventListener('mousemove',pointerMove);
canvas.addEventListener('touchmove',pointerMove,{passive:true});

function shoot(){
  if(shooter.shooting||gameOver)return;
  shootSound.currentTime=0;
  shootSound.play();
  shooter.shooting=true;
  const a=shooter.angle; const s=shooter.speed/devicePixelRatio;
  shooter.vx=Math.cos(a)*s; shooter.vy=Math.sin(a)*s;
  shooter.bubble.x=shooter.x; shooter.bubble.y=shooter.y;
}
canvas.addEventListener('click',shoot);
canvas.addEventListener('touchstart',e=>{e.preventDefault();shoot();},{passive:false});

// Distance
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

// Animate
function animate(){update();draw();requestAnimationFrame(animate);}

function update(){
  if(gameOver) return;
  particles.forEach(p=>{p.y-=p.speed;if(p.y<0){p.y=canvas.clientHeight;p.x=Math.random()*canvas.clientWidth;}});
  if(!shooter.shooting){shooter.x=canvas.clientWidth/2;shooter.y=canvas.clientHeight-40;}
  else{
    shooter.bubble.x+=shooter.vx*(1/60);
    shooter.bubble.y+=shooter.vy*(1/60);
    if(shooter.bubble.x<=radius||shooter.bubble.x>=canvas.clientWidth-radius) shooter.vx*=-1;
    if(shooter.bubble.y<=radius+10){placeBubble(shooter.bubble);}
    else{
      for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){if(grid[r][c].occupied){const p=gridToWorld(r,c);if(distance({x:shooter.bubble.x,y:shooter.bubble.y},p)<=radius*1.9){placeBubble(shooter.bubble);return;}}}}
      if(shooter.bubble.y>canvas.clientHeight-radius){endGame();}
    }
  }
}

// Place bubble
function placeBubble(bubble){
  shooter.shooting=false;
  const pos=worldToGrid(bubble.x,bubble.y);
  let best=null,bestD=Infinity;
  for(let dr=-1;dr<=1;dr++){for(let dc=-1;dc<=1;dc++){
    const r=pos.row+dr,c=pos.col+dc;
    if(r>=0&&r<rows&&c>=0&&c<cols&&!grid[r][c].occupied){
      const w=gridToWorld(r,c);const d=distance({x:bubble.x,y:bubble.y},w);
      if(d<bestD){bestD=d;best={r,c};}}}}
  if(!best) best={r:0,c:Math.floor(cols/2)};
  grid[best.r][best.c].occupied=true;grid[best.r][best.c].color=bubble.color;
  const match=flood(best.r,best.c,bubble.color,{});
  if(match.length>=3){match.forEach(k=>{const [r,c]=k.split(',').map(Number);grid[r][c].occupied=false;});score+=match.length*10;popSound.currentTime=0;popSound.play();}
  shooter.bubble=shooter.nextBubble;shooter.nextBubble=makeBubble();
  updateUI();
  checkGameOver();
}

// Flood fill
function flood(r,c,color,vis){
  const key=r+','+c; if(vis[key])return[]; vis[key]=true;
  if(r<0||r>=rows||c<0||c>=cols)return[]; const cell=grid[r][c]; if(!cell.occupied||cell.color!==color)return[];
  let out=[key];
  const neighbors=(r%2===0)?[[0,1],[0,-1],[1,0],[-1,0],[1,-1],[-1,-1]]:[[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1]];
  neighbors.forEach(d=>{out=out.concat(flood(r+d[0],c+d[1],color,vis));}); return out;
}

function checkGameOver(){for(let r=rows-1;r>=rows-2;r--){for(let c=0;c<cols;c++){if(grid[r][c].occupied){endGame();return;}}}}
function endGame(){if(gameOver)return;gameOver=true;loseSound.play();gameOverOverlay.classList.add('show');}

// Draw bubble
function drawBubble(x,y,color){
  ctx.beginPath();
  ctx.arc(x,y,radius,0,Math.PI*2);
  ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=radius*0.8; ctx.fill(); ctx.shadowBlur=0;
  const g=ctx.createRadialGradient(x-radius*0.3,y-radius*0.4,radius*0.1,x,y,radius*0.8);
  g.addColorStop(0,'rgba(255,255,255,0.8)'); g.addColorStop(0.5,'rgba(255,255,255,0.3)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
  ctx.lineWidth=radius*0.15; ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(x,y,radius*0.6,0,Math.PI*2); ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.stroke();
}

// Draw all
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fill();});
  for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){const cell=grid[r][c];if(cell.occupied){const pos=gridToWorld(r,c);drawBubble(pos.x,pos.y,cell.color);}}}
  if(!shooter.shooting){
    const aimLength=400; const a=shooter.angle;
    const endX=shooter.x+Math.cos(a)*aimLength; const endY=shooter.y+Math.sin(a)*aimLength;
    ctx.beginPath(); ctx.moveTo(shooter.x,shooter.y); ctx.lineTo(endX,endY);
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=3; ctx.setLineDash([8,10]);
    ctx.shadowColor='var(--accent)'; ctx.shadowBlur=8; ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur=0;
    drawBubble(shooter.x,shooter.y,shooter.bubble.color);
  } else drawBubble(shooter.bubble.x,shooter.bubble.y,shooter.bubble.color);
}

restartBtn.addEventListener('click',init); playAgain.addEventListener('click',init);
init(); requestAnimationFrame(animate);
})();