'use strict';

// ── Canvas ─────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = 480, H = 640;

// ── State ──────────────────────────────────────────────────────────────────────
const S = { TITLE: 0, PLAY: 1, GAMEOVER: 2 };
let gameState = S.TITLE;

// ── Input ──────────────────────────────────────────────────────────────────────
const KEY = {};
window.addEventListener('keydown', e => {
    KEY[e.code] = true;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
        e.preventDefault();
});
window.addEventListener('keyup', e => { KEY[e.code] = false; });

// ── Utilities ──────────────────────────────────────────────────────────────────
const rand    = (a, b) => Math.random() * (b - a) + a;
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist    = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ── Game variables ─────────────────────────────────────────────────────────────
let score = 0, hiScore = 0, scrollY = 0, frame = 0, gameOverTimer = 0, generation = 0;
let player;
let airBullets = [], groundBombs = [], airEnemies = [], groundEnemies = [],
    enemyBullets = [], particles = [];

// ── Constants ──────────────────────────────────────────────────────────────────
const SCROLL_SPEED  = 2;
const PLAYER_R      = 13;
const PLAYER_SPD    = 4.5;
const SHOOT_CD      = 140;   // ms
const BOMB_CD       = 800;   // ms
const INVINCIBLE_F  = 120;   // frames

// ── Terrain ────────────────────────────────────────────────────────────────────
const TILE_H    = 80;
const TILE_N    = 60;
const terrain   = [];

function genTerrain() {
    terrain.length = 0;
    for (let i = 0; i < TILE_N; i++) {
        let features = [];
        let n = randInt(2, 5);
        for (let j = 0; j < n; j++) {
            let type = ['forest','road','water','ruins'][randInt(0, 3)];
            let f = { type, x: Math.floor(rand(0, W - 110)), w: Math.floor(rand(55, 130)) };
            if (type === 'ruins')  f.ruinH = [randInt(10,28), randInt(8,24), randInt(12,30)];
            if (type === 'forest') f.trees  = randInt(3, 8);
            features.push(f);
        }
        terrain.push({
            base: `hsl(${randInt(100,130)},${randInt(22,42)}%,${randInt(7,13)}%)`,
            features
        });
    }
}

function drawTerrain() {
    ctx.fillStyle = '#07100a';
    ctx.fillRect(0, 0, W, H);

    let totalH = TILE_H * TILE_N;
    let offset = scrollY % totalH;
    let si     = Math.floor(offset / TILE_H);
    let dy     = -(offset % TILE_H);
    let count  = Math.ceil(H / TILE_H) + 2;

    for (let i = 0; i < count; i++) {
        let t = terrain[(si + i) % TILE_N];
        let y = dy + i * TILE_H;
        ctx.fillStyle = t.base;
        ctx.fillRect(0, y, W, TILE_H);
        for (let f of t.features) drawFeature(f, y);
    }
}

function drawFeature(f, y) {
    switch (f.type) {
        case 'forest':
            ctx.fillStyle = '#0c1c0c';
            ctx.fillRect(f.x, y, f.w, TILE_H);
            ctx.fillStyle = '#162e16';
            for (let k = 0; k < f.trees; k++) {
                ctx.beginPath();
                ctx.arc(f.x + 8 + k * Math.floor(f.w / f.trees),
                        y + 14 + (k % 2) * 16, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case 'road':
            ctx.fillStyle = '#22223a';
            ctx.fillRect(f.x, y, f.w, TILE_H);
            ctx.fillStyle = '#38385a';
            ctx.fillRect(f.x + Math.floor(f.w * 0.46), y, Math.floor(f.w * 0.08), TILE_H);
            break;
        case 'water':
            ctx.fillStyle = '#070728';
            ctx.fillRect(f.x, y + 8, f.w, TILE_H - 16);
            ctx.fillStyle = '#10104a';
            ctx.fillRect(f.x + 5, y + Math.floor(TILE_H / 2) - 1, f.w - 10, 2);
            break;
        case 'ruins':
            ctx.fillStyle = '#261c12';
            for (let k = 0; k < 3; k++) {
                let bx = f.x + Math.floor(k * f.w / 3);
                let bh = f.ruinH[k];
                ctx.fillRect(bx + 2, y + TILE_H - bh - 3, Math.floor(f.w / 3) - 4, bh);
            }
            break;
    }
}

// ── Particles ──────────────────────────────────────────────────────────────────
function spawnExplosion(x, y, color = '#ff8800', n = 12) {
    for (let i = 0; i < n; i++) {
        let angle = rand(0, Math.PI * 2);
        let spd   = rand(0.5, 4);
        particles.push({ x, y,
            vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
            life: randInt(18, 50), maxLife: 50,
            color, r: rand(1.5, 4.5) });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.93; p.vy *= 0.93;
        if (--p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ── Player ─────────────────────────────────────────────────────────────────────
class Player {
    constructor() {
        this.x = W / 2; this.y = H - 100;
        this.hp = 3; this.bombs = 3;
        this.invincible = 0; this.lastShot = 0; this.lastBomb = 0;
        this.shotLevel = 1; this.dead = false;
    }

    update(now) {
        if (this.dead) return;
        if (KEY['ArrowLeft']  || KEY['KeyA']) this.x -= PLAYER_SPD;
        if (KEY['ArrowRight'] || KEY['KeyD']) this.x += PLAYER_SPD;
        if (KEY['ArrowUp']    || KEY['KeyW']) this.y -= PLAYER_SPD;
        if (KEY['ArrowDown']  || KEY['KeyS']) this.y += PLAYER_SPD;
        this.x = clamp(this.x, PLAYER_R, W - PLAYER_R);
        this.y = clamp(this.y, PLAYER_R + 36, H - PLAYER_R);
        if (this.invincible > 0) this.invincible--;

        if ((KEY['Space'] || KEY['KeyX']) && now - this.lastShot > SHOOT_CD) {
            this.lastShot = now;
            this.fireZapper();
        }
        if (KEY['KeyZ'] && this.bombs > 0 && now - this.lastBomb > BOMB_CD) {
            this.lastBomb = now; this.bombs--;
            groundBombs.push(new GroundBomb(this.x, this.y));
        }
    }

    fireZapper() {
        let x = this.x, y = this.y - PLAYER_R;
        if (this.shotLevel >= 3) {
            airBullets.push(new AirBullet(x - 12, y, -1));
            airBullets.push(new AirBullet(x,       y,  0));
            airBullets.push(new AirBullet(x + 12,  y,  1));
        } else if (this.shotLevel === 2) {
            airBullets.push(new AirBullet(x - 8, y, 0));
            airBullets.push(new AirBullet(x + 8, y, 0));
        } else {
            airBullets.push(new AirBullet(x, y, 0));
        }
    }

    hit() {
        if (this.invincible > 0 || this.dead) return;
        this.hp--;
        this.invincible = INVINCIBLE_F;
        spawnExplosion(this.x, this.y, '#ff4488', 8);
        if (this.hp <= 0) { this.dead = true; spawnExplosion(this.x, this.y, '#ff8800', 28); }
    }

    draw() {
        if (this.dead) return;
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Thruster glow
        ctx.fillStyle = '#1133ff';
        ctx.beginPath();
        ctx.ellipse(0, 10, 5, 7 + Math.sin(frame * 0.25) * 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#5588bb';
        ctx.beginPath();
        ctx.moveTo(0, -13); ctx.lineTo(-20, 5); ctx.lineTo(-7, 4);
        ctx.lineTo(-5, 12); ctx.lineTo(5, 12);  ctx.lineTo(7, 4);
        ctx.lineTo(20, 5);
        ctx.closePath(); ctx.fill();

        // Body
        ctx.fillStyle = '#aaccee';
        ctx.beginPath();
        ctx.moveTo(0, -13); ctx.lineTo(-5, 5); ctx.lineTo(0, 9); ctx.lineTo(5, 5);
        ctx.closePath(); ctx.fill();

        // Cockpit
        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.ellipse(0, -4, 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hitbox indicator (subtle)
        ctx.strokeStyle = 'rgba(100,200,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_R - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// ── Air Bullet ─────────────────────────────────────────────────────────────────
class AirBullet {
    constructor(x, y, vxDir) {
        this.x = x; this.y = y;
        this.vx = vxDir * 1.8; this.vy = -9;
        this.dead = false;
    }
    update() { this.x += this.vx; this.y += this.vy; if (this.y < -14) this.dead = true; }
    draw() {
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#44ffff';
        ctx.fillRect(this.x - 2, this.y - 5, 4, 10);
        ctx.restore();
    }
}

// ── Ground Bomb ────────────────────────────────────────────────────────────────
class GroundBomb {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.r = 0; this.maxR = 65;
        this.life = 36; this.maxLife = 36;
        this.dead = false; this.hitSet = new Set();
    }
    update() {
        this.r = (1 - this.life / this.maxLife) * this.maxR;
        if (--this.life <= 0) this.dead = true;
    }
    draw() {
        let a = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = a * 0.15;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ── Air Enemy ──────────────────────────────────────────────────────────────────
class AirEnemy {
    constructor(x, y, type = 'fighter') {
        this.x = x; this.y = y; this.type = type;
        this.f = 0; this.dead = false;
        switch (type) {
            case 'fighter':
                this.hp = 1; this.r = 12;
                this.vx = rand(-1.3, 1.3); this.vy = rand(1.4, 2.6);
                this.shootCd = randInt(90, 150); break;
            case 'heavy':
                this.hp = 3; this.r = 18;
                this.vx = rand(-0.6, 0.6); this.vy = 1.3;
                this.shootCd = 70; break;
            case 'boss':
                this.hp = 80; this.r = 40;
                this.vx = 1.4; this.vy = 0;
                this.targetY = 95;
                this.shootCd = 35; break;
        }
        this.maxHp = this.hp;
    }

    update() {
        this.f++;
        if (this.type === 'boss') {
            if (this.y < this.targetY) this.y += 1.8;
            this.x += this.vx;
            if (this.x < 70 || this.x > W - 70) this.vx *= -1;
        } else {
            this.x += this.vx + Math.sin(this.f * 0.04) * 0.9;
            this.y += this.vy;
            if (this.y > H + 60) { this.dead = true; return; }
        }
        if (this.f % this.shootCd === 0 && player && !player.dead) this.shoot();
    }

    shoot() {
        if (!player) return;
        let spd = this.type === 'boss' ? 3 : 2.5;
        if (this.type === 'boss') {
            let n = this.f % (this.shootCd * 6) < this.shootCd * 3 ? 8 : 4;
            for (let i = 0; i < n; i++) {
                let a = (i / n) * Math.PI * 2 + this.f * 0.04;
                enemyBullets.push(new EnemyBullet(this.x, this.y,
                    Math.cos(a) * spd, Math.sin(a) * spd));
            }
        } else {
            let dx = player.x - this.x, dy = player.y - this.y;
            let len = Math.hypot(dx, dy) || 1;
            enemyBullets.push(new EnemyBullet(this.x, this.y,
                dx / len * spd, dy / len * spd));
        }
    }

    takeDamage() {
        this.hp--;
        spawnExplosion(this.x, this.y, '#ffcc33', 4);
        if (this.hp > 0) return;
        let pts = this.type === 'boss' ? 5000 : this.type === 'heavy' ? 500 : 100;
        score += pts;
        if (score > hiScore) hiScore = score;
        spawnExplosion(this.x, this.y, '#ff8800', this.type === 'boss' ? 32 : 12);
        this.dead = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.type === 'fighter')    drawFighter();
        else if (this.type === 'heavy') drawHeavy();
        else                            this.drawBoss();

        if (this.type !== 'fighter') {
            let bw = this.r * 2;
            ctx.fillStyle = '#400000';
            ctx.fillRect(-this.r, -this.r - 12, bw, 5);
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(-this.r, -this.r - 12, bw * (this.hp / this.maxHp), 5);
        }
        ctx.restore();
    }

    drawBoss() {
        let p = 0.9 + Math.sin(this.f * 0.09) * 0.1;
        ctx.scale(p, p);
        ctx.fillStyle = '#500050';
        ctx.beginPath(); ctx.ellipse(0, 0, 40, 22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#770077';
        // Wings
        ctx.beginPath(); ctx.moveTo(-18,-5); ctx.lineTo(-56,14); ctx.lineTo(-32,22); ctx.lineTo(-10,10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(18,-5);  ctx.lineTo(56,14);  ctx.lineTo(32,22);  ctx.lineTo(10,10);  ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffaaff';
        ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#330033';
        ctx.fillRect(-28, 8, 10, 16); ctx.fillRect(18, 8, 10, 16);
    }
}

function drawFighter() {
    ctx.fillStyle = '#aa2020';
    ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(11,2); ctx.lineTo(0,9); ctx.lineTo(-11,2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ee4444';
    ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(7,2); ctx.lineTo(0,6); ctx.lineTo(-7,2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffaaaa';
    ctx.beginPath(); ctx.arc(0,-1,3,0,Math.PI*2); ctx.fill();
}

function drawHeavy() {
    ctx.fillStyle = '#774400';
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(16,-5); ctx.lineTo(13,12); ctx.lineTo(-13,12); ctx.lineTo(-16,-5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#bb6600';
    ctx.fillRect(-8,-8,16,16);
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
}

// ── Ground Enemy ───────────────────────────────────────────────────────────────
class GroundEnemy {
    constructor(x, y, type = 'turret') {
        this.x = x; this.y = y; this.type = type;
        this.hp = type === 'heavy_turret' ? 5 : 2;
        this.maxHp = this.hp; this.dead = false; this.f = 0; this.r = 16;
        this.vx = type === 'moving_turret' ? (Math.random() < 0.5 ? 1 : -1) * 0.9 : 0;
        this.angle = -Math.PI / 2;
        this.shootCd = type === 'heavy_turret' ? 55 : 85;
    }

    update() {
        this.f++;
        this.y += SCROLL_SPEED;
        if (this.type === 'moving_turret') {
            this.x += this.vx;
            if (this.x < 20 || this.x > W - 20) this.vx *= -1;
        }
        if (player && !player.dead)
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);
        if (this.f % this.shootCd === 0) this.shoot();
        if (this.y > H + 30) this.dead = true;
    }

    shoot() {
        if (!player || player.dead) return;
        let spd = 2;
        enemyBullets.push(new EnemyBullet(this.x, this.y,
            Math.cos(this.angle) * spd, Math.sin(this.angle) * spd));
    }

    bombHit() {
        this.hp -= 2;
        spawnExplosion(this.x, this.y, '#ffdd00', 6);
        if (this.hp > 0) return;
        score += this.type === 'heavy_turret' ? 500 : 300;
        if (score > hiScore) hiScore = score;
        spawnExplosion(this.x, this.y, '#ff8800', 15);
        this.dead = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.type === 'heavy_turret' ? '#553311' : '#223322';
        ctx.fillRect(-15, -8, 30, 16);
        ctx.fillStyle = this.type === 'heavy_turret' ? '#886622' : '#336633';
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.angle) * 18, Math.sin(this.angle) * 18);
        ctx.stroke();
        if (this.maxHp > 2) {
            ctx.fillStyle = '#400000'; ctx.fillRect(-15, -18, 30, 4);
            ctx.fillStyle = '#ff2222'; ctx.fillRect(-15, -18, 30 * (this.hp / this.maxHp), 4);
        }
        ctx.restore();
    }
}

// ── Enemy Bullet ───────────────────────────────────────────────────────────────
class EnemyBullet {
    constructor(x, y, vx, vy) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.r = 4; this.dead = false;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10)
            this.dead = true;
    }
    draw() {
        ctx.save();
        ctx.shadowBlur = 8; ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ── Wave System ────────────────────────────────────────────────────────────────
const WAVES = [
    { at: 300,  fn: () => formation('fighter', 5, 'line') },
    { at: 550,  fn: () => spawnGround('turret') },
    { at: 750,  fn: () => formation('fighter', 6, 'v') },
    { at: 1000, fn: () => spawnGround('moving_turret') },
    { at: 1200, fn: () => formation('heavy', 3, 'line') },
    { at: 1500, fn: () => spawnGround('heavy_turret') },
    { at: 1700, fn: () => formation('fighter', 8, 'v') },
    { at: 2000, fn: () => spawnBoss() },
    { at: 2500, fn: () => formation('fighter', 6, 'line') },
    { at: 2800, fn: () => { spawnGround('turret'); spawnGround('moving_turret'); } },
    { at: 3100, fn: () => formation('heavy', 4, 'line') },
    { at: 3500, fn: () => spawnBoss() },
    { at: 4000, fn: () => { formation('fighter',8,'v'); spawnGround('heavy_turret'); } },
    { at: 4500, fn: () => spawnBoss() },
];
let waveIdx = 0;

function formation(type, n, shape) {
    let gen = generation;
    for (let i = 0; i < n; i++) {
        setTimeout(() => {
            if (gameState !== S.PLAY || generation !== gen) return;
            let x, y;
            if (shape === 'v') {
                x = W / 2 + (i - (n - 1) / 2) * 46;
                y = -22 - Math.abs(i - (n - 1) / 2) * 26;
            } else {
                x = 50 + i * ((W - 100) / Math.max(n - 1, 1));
                y = -22 - i * 8;
            }
            airEnemies.push(new AirEnemy(x, y, type));
        }, i * 200);
    }
}

function spawnGround(type) {
    groundEnemies.push(new GroundEnemy(rand(50, W - 50), -22, type));
}

function spawnBoss() {
    airEnemies.push(new AirEnemy(W / 2, -65, 'boss'));
}

// ── Collision ──────────────────────────────────────────────────────────────────
function checkCollisions() {
    // Air bullets vs air enemies
    for (let b of airBullets) {
        if (b.dead) continue;
        for (let e of airEnemies) {
            if (e.dead) continue;
            if (dist(b, e) < e.r + 5) { b.dead = true; e.takeDamage(); break; }
        }
    }
    // Ground bombs vs ground enemies
    for (let bomb of groundBombs) {
        if (bomb.dead) continue;
        for (let e of groundEnemies) {
            if (e.dead || bomb.hitSet.has(e)) continue;
            if (dist(bomb, e) < bomb.r + e.r) { bomb.hitSet.add(e); e.bombHit(); }
        }
    }
    if (!player || player.dead || player.invincible > 0) return;
    // Enemy bullets vs player
    for (let b of enemyBullets) {
        if (b.dead) continue;
        if (dist(b, player) < b.r + PLAYER_R - 4) { b.dead = true; player.hit(); }
    }
    // Air enemies ramming player
    for (let e of airEnemies) {
        if (e.dead) continue;
        if (dist(e, player) < e.r + PLAYER_R - 5) { player.hit(); e.takeDamage(); }
    }
}

// ── Cleanup ────────────────────────────────────────────────────────────────────
function sweep(arr) {
    for (let i = arr.length - 1; i >= 0; i--)
        if (arr[i].dead) arr.splice(i, 1);
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,16,0.55)';
    ctx.fillRect(0, 0, W, 36);

    ctx.font = 'bold 14px "Courier New",monospace';
    ctx.fillStyle = '#00ffcc';
    ctx.fillText(`SCORE  ${String(score).padStart(7, '0')}`, 10, 23);
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`HI  ${String(hiScore).padStart(7, '0')}`, 210, 23);

    // Lives (mini ships)
    for (let i = 0; i < player.hp; i++) {
        ctx.save();
        ctx.translate(W - 26 - i * 22, 18);
        ctx.scale(0.55, 0.55);
        ctx.fillStyle = '#88aaff';
        ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(-11,6); ctx.lineTo(11,6); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    // Bombs
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffff44';
    ctx.fillText(`B:${player.bombs}`, W - 26 - player.hp * 22 - 44, 24);
}

// ── Title ──────────────────────────────────────────────────────────────────────
function drawTitle() {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.save();
    ctx.shadowBlur = 28; ctx.shadowColor = '#ff00ff';
    ctx.font = 'bold 58px "Courier New",monospace';
    ctx.fillStyle = '#ff44ff';
    ctx.fillText('GAME01', W / 2, 180);
    ctx.restore();

    ctx.font = '15px monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('VERTICAL SCROLLING SHOOTER', W / 2, 220);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#6699cc';
    ctx.fillText('── CONTROLS ──', W / 2, 295);
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Arrow / WASD  ──  Move', W / 2, 324);
    ctx.fillText('Space / X  ──  Zapper  (Air Shot)', W / 2, 350);
    ctx.fillText('Z  ──  Blaster  (Ground Bomb)', W / 2, 376);
    ctx.fillStyle = '#888888';
    ctx.fillText('Air shot cannot hit ground enemies', W / 2, 408);
    ctx.fillText('Ground bomb cannot hit air enemies', W / 2, 428);

    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = Math.sin(Date.now() * 0.004) > 0 ? '#ffffff' : '#888888';
    ctx.fillText('PRESS  ENTER  TO  START', W / 2, 490);
    ctx.textAlign = 'left';
}

// ── Game Over ──────────────────────────────────────────────────────────────────
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.save();
    ctx.shadowBlur = 24; ctx.shadowColor = '#ff2222';
    ctx.font = 'bold 58px "Courier New",monospace';
    ctx.fillStyle = '#ff2222';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 38);
    ctx.restore();

    ctx.font = '22px monospace';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`SCORE : ${score}`, W / 2, H / 2 + 20);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText(`HI-SCORE : ${hiScore}`, W / 2, H / 2 + 54);

    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = Math.sin(Date.now() * 0.004) > 0 ? '#ffffff' : '#666666';
    ctx.fillText('PRESS  ENTER  TO  RETRY', W / 2, H / 2 + 108);
    ctx.textAlign = 'left';
}

// ── Init ───────────────────────────────────────────────────────────────────────
function initGame() {
    score = 0; scrollY = 0; frame = 0; waveIdx = 0; gameOverTimer = 0;
    generation++;
    player = new Player();
    airBullets = []; groundBombs = []; airEnemies = [];
    groundEnemies = []; enemyBullets = []; particles = [];
}

// ── Main Loop ──────────────────────────────────────────────────────────────────
function loop() {
    frame++;
    scrollY += SCROLL_SPEED;

    // Title
    if (gameState === S.TITLE) {
        drawTerrain();
        drawTitle();
        if (KEY['Enter']) { KEY['Enter'] = false; initGame(); gameState = S.PLAY; }
        return requestAnimationFrame(loop);
    }

    // Game Over
    if (gameState === S.GAMEOVER) {
        drawTerrain();
        updateParticles(); drawParticles();
        drawGameOver();
        if (KEY['Enter']) { KEY['Enter'] = false; initGame(); gameState = S.PLAY; }
        return requestAnimationFrame(loop);
    }

    // ── Playing ────────────────────────────────────────────────────────────────
    player.update(performance.now());

    if (player.dead) {
        if (++gameOverTimer > 110) {
            if (score > hiScore) hiScore = score;
            gameState = S.GAMEOVER;
        }
    }

    // Wave triggers
    while (waveIdx < WAVES.length && scrollY >= WAVES[waveIdx].at) {
        WAVES[waveIdx].fn(); waveIdx++;
    }
    // Continuous random filler
    if (frame % 210 === 0) formation('fighter', randInt(2, 4), Math.random() < 0.5 ? 'line' : 'v');
    if (frame % 370 === 0) spawnGround(['turret','moving_turret'][randInt(0, 1)]);

    // Update
    for (let b of airBullets)    b.update();
    for (let b of groundBombs)   b.update();
    for (let e of airEnemies)    if (!e.dead) e.update();
    for (let e of groundEnemies) if (!e.dead) e.update();
    for (let b of enemyBullets)  b.update();
    updateParticles();
    checkCollisions();
    sweep(airBullets); sweep(groundBombs); sweep(airEnemies);
    sweep(groundEnemies); sweep(enemyBullets);

    // Draw
    drawTerrain();

    // Ground layer
    for (let e of groundEnemies) if (!e.dead) e.draw();
    for (let b of groundBombs)   if (!b.dead) b.draw();
    // Air layer
    for (let b of airBullets)    if (!b.dead) b.draw();
    for (let e of airEnemies)    if (!e.dead) e.draw();
    for (let b of enemyBullets)  if (!b.dead) b.draw();
    player.draw();
    drawParticles();
    drawHUD();

    requestAnimationFrame(loop);
}

// ── Boot ───────────────────────────────────────────────────────────────────────
genTerrain();
initGame();
gameState = S.TITLE;
requestAnimationFrame(loop);
