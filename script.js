const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;
let snake, direction, food, bonus=null, score, highScore=localStorage.getItem("snakeHighScore")||0;
let level, speed, game, isPaused=false, playerName="Guest";

// Sounds
let soundOn=true, musicOn=true;
const sounds = {
  eat: new Audio("sounds/eat.mp3"),
  bonus: new Audio("sounds/bonus.mp3"),
  levelup: new Audio("sounds/levelup.mp3"),
  gameover: new Audio("sounds/gameover.mp3"),
  coin: new Audio("sounds/coin.mp3"),
  error: new Audio("sounds/error.wav")
};
const bgMusic = new Audio("sounds/bgmusic.mp3"); bgMusic.loop=true; bgMusic.volume=0.5;

document.getElementById("highScore").textContent="High Score: "+highScore;

// Leaderboard
function getLeaderboard(){ return JSON.parse(localStorage.getItem("snakeLeaderboard"))||[]; }
function saveLeaderboard(leaderboard){ localStorage.setItem("snakeLeaderboard", JSON.stringify(leaderboard)); }
function updateLeaderboard(){
  let leaderboard=getLeaderboard();
  const list=document.getElementById("leaderboardList");
  list.innerHTML="";
  leaderboard.forEach((entry,index)=>{
    const li=document.createElement("li");
    li.textContent=`${index+1}. ${entry.name} - ${entry.score}`;
    list.appendChild(li);
  });
}

// Sounds play
function playSound(name){ if(soundOn && sounds[name]) sounds[name].play(); }

// Game Init
function initGame(){
  snake=[{x:8*box,y:8*box}];
  direction="RIGHT"; score=0; level=1; speed=200;
  food={x:Math.floor(Math.random()*20)*box, y:Math.floor(Math.random()*20)*box};
  bonus=null; isPaused=false;
  document.getElementById("score").textContent="Score: 0";
  document.getElementById("level").textContent="Level: 1";
}

// Draw Functions
function drawSnake(){ snake.forEach((part,i)=>{ ctx.fillStyle=i===0?"#00ff00":"#0f0"; ctx.fillRect(part.x,part.y,box,box); ctx.strokeStyle="#003300"; ctx.lineWidth=2; ctx.strokeRect(part.x,part.y,box,box); }); }
function drawFood(){ ctx.fillStyle="red"; ctx.fillRect(food.x,food.y,box,box); ctx.strokeStyle="#330000"; ctx.strokeRect(food.x,food.y,box,box); }
function drawBonus(){ if(bonus){ ctx.fillStyle="yellow"; ctx.fillRect(bonus.x,bonus.y,box,box); ctx.strokeStyle="#666600"; ctx.strokeRect(bonus.x,bonus.y,box,box); } }

// Controls
document.addEventListener("keydown", (e)=>{
  if(e.key==="ArrowUp" && direction!="DOWN") direction="UP";
  else if(e.key==="ArrowDown" && direction!="UP") direction="DOWN";
  else if(e.key==="ArrowLeft" && direction!="RIGHT") direction="LEFT";
  else if(e.key==="ArrowRight" && direction!="LEFT") direction="RIGHT";
  else if(e.key==="p"||e.key==="P") togglePause();
  else if(e.key==="c"||e.key==="C") insertCoin();
  else if(e.key==="Enter" && document.getElementById("introScreen").style.display!=="none") hideIntro();
});

// Swipe controls for mobile
let touchStartX=0, touchStartY=0;
canvas.addEventListener("touchstart", function(e){
    const touch = e.touches[0]; touchStartX = touch.clientX; touchStartY = touch.clientY;
}, false);
canvas.addEventListener("touchend", function(e){
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if(Math.abs(dx) > Math.abs(dy)){
        if(dx>0 && direction!="LEFT") direction="RIGHT";
        else if(dx<0 && direction!="RIGHT") direction="LEFT";
    } else {
        if(dy>0 && direction!="UP") direction="DOWN";
        else if(dy<0 && direction!="DOWN") direction="UP";
    }
}, false);

// Game Loop
function gameLoop(){
  if(isPaused) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawFood(); drawBonus(); drawSnake();

  let head={x:snake[0].x, y:snake[0].y};
  if(direction==="LEFT") head.x-=box;
  else if(direction==="RIGHT") head.x+=box;
  else if(direction==="UP") head.y-=box;
  else if(direction==="DOWN") head.y+=box;

  // Collision
  if(head.x<0 || head.x>=canvas.width || head.y<0 || head.y>=canvas.height || snake.some(p=>p.x===head.x && p.y===head.y)){
    clearInterval(game); playSound("gameover"); bgMusic.pause();
    canvas.classList.add("shake");
    setTimeout(()=>{ canvas.classList.remove("shake"); alert("💀 Game Over! Final Score: "+score); addToLeaderboard(playerName,score); if(score>highScore){ highScore=score; localStorage.setItem("snakeHighScore",highScore); } document.getElementById("highScore").textContent="High Score: "+highScore; },500);
    return;
  }

  snake.unshift(head);

  // Food
  if(head.x===food.x && head.y===food.y){
    playSound("eat"); score+=10;
    document.getElementById("score").textContent="Score: "+score;
    food={x:Math.floor(Math.random()*20)*box, y:Math.floor(Math.random()*20)*box};
    if(score%50===0){ level++; speed=Math.max(50,speed-20); playSound("levelup"); document.getElementById("level").textContent="Level: "+level; clearInterval(game); game=setInterval(gameLoop,speed);}
    if(Math.random()<0.3) bonus={x:Math.floor(Math.random()*20)*box, y:Math.floor(Math.random()*20)*box};
  } else if(bonus && head.x===bonus.x && head.y===bonus.y){
    playSound("bonus"); score+=30; document.getElementById("score").textContent="Score: "+score; bonus=null;
  } else { snake.pop(); }
}

// New Game
function newGame(){ initGame(); clearInterval(game); game=setInterval(gameLoop,speed); }
function startGame(){ playerName=document.getElementById("playerNameInput").value || "Guest"; document.getElementById("playerName").textContent="Player: "+playerName; document.getElementById("startMenu").style.display="none"; newGame(); bgMusic.play(); updateLeaderboard(); }

// Pause / Resume
function togglePause(){ isPaused=!isPaused; if(!isPaused) game=setInterval(gameLoop,speed); else clearInterval(game); }

// Sound / Music toggle
function toggleSound(){ soundOn=!soundOn; alert("Sound: "+(soundOn?"ON":"OFF")); }
function toggleMusic(){ musicOn=!musicOn; if(musicOn) bgMusic.play(); else bgMusic.pause(); }

// Leaderboard
function addToLeaderboard(name,score){
  let leaderboard=getLeaderboard(); leaderboard.push({name,score});
  leaderboard.sort((a,b)=>b.score-a.score); leaderboard=leaderboard.slice(0,5);
  saveLeaderboard(leaderboard); updateLeaderboard();
}

// --- Intro + Coins + Free Play ---
let coins=0, freePlay=false;
const coinCounter=document.getElementById("coinCounter");
const watermark=document.getElementById("freePlayWatermark");

function insertCoin(){ coins++; coinCounter.textContent="INSERT COIN: "+coins; playSound("coin"); }
function toggleFreePlay(){ freePlay=!freePlay; const btn=document.getElementById("freePlayBtn"); if(freePlay){ btn.textContent="FREE PLAY: ON"; btn.style.color="#00ff00"; btn.style.borderColor="#00ff00"; coinCounter.textContent="FREE PLAY MODE"; watermark.style.display="block"; } else{ btn.textContent="FREE PLAY: OFF"; btn.style.color="#ff4444"; btn.style.borderColor="#ff4444"; coinCounter.textContent="INSERT COIN: "+coins; watermark.style.display="none"; } }
function hideIntro(){ if(freePlay || coins>0){ if(!freePlay){ coins--; coinCounter.textContent="INSERT COIN: "+coins; } document.getElementById("introScreen").style.display="none"; document.getElementById("startMenu").style.display="flex"; } else playSound("error"); }
                                    
