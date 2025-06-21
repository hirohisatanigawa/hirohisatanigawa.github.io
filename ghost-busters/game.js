"use strict";
class GhostBustersGame {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = false;
        this.isPaused = false;
        this.ghosts = [];
        this.ghostIdCounter = 0;
        this.hearts = [];
        this.heartIdCounter = 0;
        this.gameLoop = null;
        this.spawnLoop = null;
        this.selectedDifficulty = 'normal';
        this.gameStarted = false;
        this.characterTypes = [
            // よく出るキャラ (60%)
            { emoji: '👻', name: 'ふつうのゴースト', rarity: 'common', baseScore: 10, spawnChance: 25 },
            { emoji: '🧙‍♀️', name: 'まじょ', rarity: 'common', baseScore: 15, spawnChance: 20 },
            { emoji: '🧙‍♂️', name: 'まじょつかい', rarity: 'common', baseScore: 15, spawnChance: 15 },
            // たまに出るキャラ (25%)
            { emoji: '🎃', name: 'ハロウィンかぼちゃ', rarity: 'uncommon', baseScore: 25, spawnChance: 12 },
            { emoji: '🧟‍♀️', name: 'ゾンビガール', rarity: 'uncommon', baseScore: 30, spawnChance: 8 },
            { emoji: '🧟‍♂️', name: 'ゾンビボーイ', rarity: 'uncommon', baseScore: 30, spawnChance: 5 },
            // あまり出ないキャラ (10%)
            { emoji: '🧛‍♀️', name: 'バンパイアガール', rarity: 'rare', baseScore: 50, spawnChance: 3 },
            { emoji: '🧛‍♂️', name: 'バンパイアボーイ', rarity: 'rare', baseScore: 50, spawnChance: 3 },
            { emoji: '💀', name: 'がいこつ', rarity: 'rare', baseScore: 60, spawnChance: 2 },
            { emoji: '🕷️', name: 'おおきなくも', rarity: 'rare', baseScore: 40, spawnChance: 2 },
            // レアキャラ (4%)
            { emoji: '🐺', name: 'おおかみおとこ', rarity: 'epic', baseScore: 100, spawnChance: 1.5 },
            { emoji: '🦇', name: 'きゅうけつこうもり', rarity: 'epic', baseScore: 80, spawnChance: 1.5 },
            { emoji: '👹', name: 'あかおに', rarity: 'epic', baseScore: 120, spawnChance: 1 },
            // 超レアキャラ (1%)
            { emoji: '🐉', name: 'りゅう', rarity: 'legendary', baseScore: 500, spawnChance: 0.3, specialEffect: 'すごい！' },
            { emoji: '🔥', name: 'ほのおのせいれい', rarity: 'legendary', baseScore: 300, spawnChance: 0.4, specialEffect: 'きれい！' },
            { emoji: '⚡', name: 'かみなりのせいれい', rarity: 'legendary', baseScore: 400, spawnChance: 0.3, specialEffect: 'びりびり！' }
        ];
        this.difficultyConfigs = {
            easy: {
                baseSpeed: 0.8,
                spawnInterval: 1800,
                maxGhosts: 4,
                scoreMultiplier: 1,
                directionChangeFrequency: 4000,
                complexMovement: false,
                aggressiveness: 0.3 // プレイヤーに向かう確率
            },
            normal: {
                baseSpeed: 1.2,
                spawnInterval: 1200,
                maxGhosts: 6,
                scoreMultiplier: 1.5,
                directionChangeFrequency: 2500,
                complexMovement: true,
                aggressiveness: 0.5
            },
            hard: {
                baseSpeed: 2.0,
                spawnInterval: 600,
                maxGhosts: 9,
                scoreMultiplier: 2,
                directionChangeFrequency: 1000,
                complexMovement: true,
                aggressiveness: 0.7
            }
        };
        // 難易度設定を初期化
        this.difficultySettings = this.difficultyConfigs[this.selectedDifficulty];
        this.initializeElements();
        this.setupEventListeners();
        this.setupMouseTracking();
    }
    initializeElements() {
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.gameOverDiv = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        this.crosshair = document.getElementById('crosshair');
        this.difficultySelectionDiv = document.getElementById('difficultySelection');
        this.easyBtn = document.getElementById('easyBtn');
        this.normalBtn = document.getElementById('normalBtn');
        this.hardBtn = document.getElementById('hardBtn');
        this.backBtn = document.getElementById('backBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.historyBtn = document.getElementById('historyBtn');
        this.historyModal = document.getElementById('historyModal');
        this.historyList = document.getElementById('historyList');
        this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        // 初期状態は難易度選択画面を表示
        this.showDifficultySelection();
    }
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.backBtn.addEventListener('click', () => this.backToDifficultySelection());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.gameArea.addEventListener('click', (e) => this.handleGameAreaClick(e));
        this.easyBtn.addEventListener('click', () => this.selectDifficulty('easy'));
        this.normalBtn.addEventListener('click', () => this.selectDifficulty('normal'));
        this.hardBtn.addEventListener('click', () => this.selectDifficulty('hard'));
        this.historyBtn.addEventListener('click', () => this.showScoreHistory());
        this.closeHistoryBtn.addEventListener('click', () => this.hideScoreHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearScoreHistory());
    }
    setupMouseTracking() {
        this.gameArea.addEventListener('mousemove', (e) => {
            const rect = this.gameArea.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.crosshair.style.left = (x - 15) + 'px';
            this.crosshair.style.top = (y - 15) + 'px';
        });
        this.gameArea.addEventListener('mouseenter', () => {
            this.crosshair.style.opacity = '1';
        });
        this.gameArea.addEventListener('mouseleave', () => {
            this.crosshair.style.opacity = '0';
        });
    }
    getDifficultySettings(difficulty) {
        return this.difficultyConfigs[difficulty];
    }
    selectRandomCharacter() {
        const random = Math.random() * 100;
        let cumulativeChance = 0;
        for (const character of this.characterTypes) {
            cumulativeChance += character.spawnChance;
            if (random <= cumulativeChance) {
                return character;
            }
        }
        // フォールバック（基本的には到達しない）
        return this.characterTypes[0];
    }
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        this.difficultySettings = this.getDifficultySettings(difficulty);
        this.updateCharacterScoreTable();
        this.hideDifficultySelection();
        this.showGameControls();
    }
    showDifficultySelection() {
        this.difficultySelectionDiv.style.display = 'block';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'none';
        this.backBtn.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.gameStarted = false;
    }
    hideDifficultySelection() {
        this.difficultySelectionDiv.style.display = 'none';
    }
    showGameControls() {
        this.startBtn.style.display = 'inline-block';
        this.backBtn.style.display = 'inline-block';
        this.resetBtn.style.display = 'none';
    }
    backToDifficultySelection() {
        if (this.isGameRunning) {
            this.stopGameLoops();
            this.clearGameArea();
            this.isGameRunning = false;
        }
        this.gameOverDiv.style.display = 'none';
        this.showDifficultySelection();
    }
    resetGame() {
        this.stopGameLoops();
        this.clearGameArea();
        this.score = 0;
        this.lives = 3;
        this.ghosts = [];
        this.ghostIdCounter = 0;
        this.hearts = [];
        this.heartIdCounter = 0;
        this.updateUI();
        this.isGameRunning = false;
        this.isPaused = false;
        this.gameOverDiv.style.display = 'none';
        // ゲーム開始前の状態に戻す
        this.startBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.backBtn.style.display = 'inline-block';
        this.startBtn.textContent = 'ゲームスタート！';
    }
    startGame() {
        this.isGameRunning = true;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.ghosts = [];
        this.ghostIdCounter = 0;
        this.hearts = [];
        this.heartIdCounter = 0;
        this.gameStarted = true;
        this.updateUI();
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';
        this.backBtn.style.display = 'none';
        this.resetBtn.style.display = 'inline-block';
        this.gameOverDiv.style.display = 'none';
        this.clearGameArea();
        this.startGameLoops();
    }
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '再開' : '一時停止';
    }
    restartGame() {
        this.stopGameLoops();
        this.clearGameArea();
        this.startGame();
    }
    startGameLoops() {
        this.gameLoop = setInterval(() => {
            if (!this.isPaused) {
                this.updateGame();
            }
        }, 16);
        this.spawnLoop = setInterval(() => {
            if (!this.isPaused && this.ghosts.length < this.difficultySettings.maxGhosts) {
                this.spawnGhost();
            }
            // ハートアイテムを出現させる（8%の確率）
            if (!this.isPaused && Math.random() < 0.08 && this.hearts.length === 0) {
                this.spawnHeart();
            }
        }, this.difficultySettings.spawnInterval);
    }
    stopGameLoops() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.spawnLoop) {
            clearInterval(this.spawnLoop);
            this.spawnLoop = null;
        }
    }
    updateGame() {
        this.moveGhosts();
        this.moveHearts();
        this.checkGhostCollisions();
        this.checkHeartExpiration();
    }
    spawnGhost() {
        const character = this.selectRandomCharacter();
        const ghostElement = document.createElement('div');
        ghostElement.className = 'ghost';
        ghostElement.textContent = character.emoji;
        // レア度に応じてクラスを追加
        ghostElement.classList.add(`rarity-${character.rarity}`);
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const playerElement = document.getElementById('player');
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        const minDistance = 150; // プレイヤーから最低150px離す
        do {
            x = Math.random() * (gameAreaRect.width - 60);
            y = Math.random() * (gameAreaRect.height - 100);
            attempts++;
            // プレイヤーとの距離をチェック
            if (playerElement) {
                const playerRect = playerElement.getBoundingClientRect();
                const playerCenterX = playerRect.left + playerRect.width / 2 - gameAreaRect.left;
                const playerCenterY = playerRect.top + playerRect.height / 2 - gameAreaRect.top;
                const distance = Math.sqrt(Math.pow(x + 30 - playerCenterX, 2) +
                    Math.pow(y + 30 - playerCenterY, 2));
                if (distance >= minDistance) {
                    break; // 十分離れている
                }
            }
            else {
                break; // プレイヤーが見つからない場合はそのまま配置
            }
        } while (attempts < maxAttempts);
        ghostElement.style.left = x + 'px';
        ghostElement.style.top = y + 'px';
        const ghost = {
            id: this.ghostIdCounter++,
            element: ghostElement,
            x: x,
            y: y,
            speed: this.difficultySettings.baseSpeed + (Math.random() * 0.5),
            direction: Math.random() * Math.PI * 2,
            changeDirectionTimer: Date.now() + this.difficultySettings.directionChangeFrequency,
            characterType: character
        };
        ghostElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hitGhost(ghost);
        });
        this.ghosts.push(ghost);
        this.gameArea.appendChild(ghostElement);
    }
    spawnHeart() {
        const heartElement = document.createElement('div');
        heartElement.className = 'heart-item';
        heartElement.textContent = '❤️';
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const x = Math.random() * (gameAreaRect.width - 60);
        const y = Math.random() * (gameAreaRect.height - 100);
        heartElement.style.left = x + 'px';
        heartElement.style.top = y + 'px';
        const heart = {
            id: this.heartIdCounter++,
            element: heartElement,
            x: x,
            y: y,
            speed: 0.3, // ゆっくり移動
            direction: Math.random() * Math.PI * 2,
            changeDirectionTimer: Date.now() + 3000 // 3秒後に方向変更
        };
        heartElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.collectHeart(heart);
        });
        this.hearts.push(heart);
        this.gameArea.appendChild(heartElement);
        // 10秒後に自動的に消える
        setTimeout(() => {
            const index = this.hearts.findIndex(h => h.id === heart.id);
            if (index !== -1) {
                this.removeHeart(index);
            }
        }, 10000);
    }
    moveGhosts() {
        const currentTime = Date.now();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const playerElement = document.getElementById('player');
        this.ghosts.forEach(ghost => {
            // プレイヤーに向かう積極的な動き
            if (playerElement && Math.random() < this.difficultySettings.aggressiveness) {
                const playerRect = playerElement.getBoundingClientRect();
                const ghostRect = ghost.element.getBoundingClientRect();
                // プレイヤーへの方向を計算
                const playerCenterX = playerRect.left + playerRect.width / 2 - gameAreaRect.left;
                const playerCenterY = playerRect.top + playerRect.height / 2 - gameAreaRect.top;
                const ghostCenterX = ghost.x + 30;
                const ghostCenterY = ghost.y + 30;
                const angleToPlayer = Math.atan2(playerCenterY - ghostCenterY, playerCenterX - ghostCenterX);
                // 現在の方向とプレイヤーへの方向を混合
                const mixRatio = 0.7; // プレイヤー方向への寄与度
                ghost.direction = ghost.direction * (1 - mixRatio) + angleToPlayer * mixRatio;
            }
            // ランダム方向変更（難易度によって頻度が変わる）
            if (currentTime > ghost.changeDirectionTimer && this.difficultySettings.complexMovement) {
                if (Math.random() < 0.2) { // 20%の確率で方向変更（少し減らした）
                    ghost.direction += (Math.random() - 0.5) * Math.PI * 0.3;
                }
                ghost.changeDirectionTimer = currentTime + this.difficultySettings.directionChangeFrequency;
            }
            // 基本移動
            let deltaX = Math.cos(ghost.direction) * ghost.speed;
            let deltaY = Math.sin(ghost.direction) * ghost.speed;
            // 複雑な動き（むずかしい・ふつうの場合）
            if (this.difficultySettings.complexMovement) {
                // 波状運動を追加（少し抑制）
                const waveOffset = Math.sin(currentTime * 0.003 + ghost.id) * 0.3;
                deltaX += waveOffset;
                deltaY += waveOffset;
                // 時々急加速（頻度を増加）
                if (Math.random() < 0.02) {
                    deltaX *= 1.8;
                    deltaY *= 1.8;
                }
            }
            ghost.x += deltaX;
            ghost.y += deltaY;
            // 境界での反射
            if (ghost.x <= 0 || ghost.x >= gameAreaRect.width - 60) {
                ghost.direction = Math.PI - ghost.direction;
                ghost.x = Math.max(0, Math.min(ghost.x, gameAreaRect.width - 60));
            }
            if (ghost.y <= 0 || ghost.y >= gameAreaRect.height - 60) {
                ghost.direction = -ghost.direction;
                ghost.y = Math.max(0, Math.min(ghost.y, gameAreaRect.height - 60));
            }
            ghost.element.style.left = ghost.x + 'px';
            ghost.element.style.top = ghost.y + 'px';
        });
    }
    moveHearts() {
        const currentTime = Date.now();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        this.hearts.forEach(heart => {
            // ランダム方向変更
            if (currentTime > heart.changeDirectionTimer) {
                if (Math.random() < 0.3) { // 30%の確率で方向変更
                    heart.direction += (Math.random() - 0.5) * Math.PI * 0.5;
                }
                heart.changeDirectionTimer = currentTime + 3000;
            }
            // 基本移動（ゆっくり）
            const deltaX = Math.cos(heart.direction) * heart.speed;
            const deltaY = Math.sin(heart.direction) * heart.speed;
            heart.x += deltaX;
            heart.y += deltaY;
            // 境界での反射
            if (heart.x <= 0 || heart.x >= gameAreaRect.width - 60) {
                heart.direction = Math.PI - heart.direction;
                heart.x = Math.max(0, Math.min(heart.x, gameAreaRect.width - 60));
            }
            if (heart.y <= 0 || heart.y >= gameAreaRect.height - 60) {
                heart.direction = -heart.direction;
                heart.y = Math.max(0, Math.min(heart.y, gameAreaRect.height - 60));
            }
            heart.element.style.left = heart.x + 'px';
            heart.element.style.top = heart.y + 'px';
        });
    }
    checkHeartExpiration() {
        // ハートの期限切れチェック（既にsetTimeoutで処理されているので、ここでは特に何もしない）
    }
    collectHeart(heart) {
        // ライフを1増加（最大5まで）
        if (this.lives < 5) {
            this.lives++;
            this.updateUI();
            // 回復エフェクト
            this.showHeartPopup(heart.x, heart.y, '+1 ライフ');
            this.playHeartSound();
            heart.element.classList.add('heart-collect-effect');
        }
        // ハートを削除
        setTimeout(() => {
            const index = this.hearts.findIndex(h => h.id === heart.id);
            if (index !== -1) {
                this.removeHeart(index);
            }
        }, 300);
    }
    removeHeart(index) {
        const heart = this.hearts[index];
        if (heart && heart.element.parentNode) {
            heart.element.parentNode.removeChild(heart.element);
        }
        this.hearts.splice(index, 1);
    }
    showHeartPopup(x, y, text) {
        const popup = document.createElement('div');
        popup.className = 'heart-popup';
        popup.textContent = text;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        this.gameArea.appendChild(popup);
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1500);
    }
    checkGhostCollisions() {
        const playerRect = document.getElementById('player').getBoundingClientRect();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        this.ghosts.forEach((ghost, index) => {
            const ghostRect = ghost.element.getBoundingClientRect();
            if (this.isColliding(playerRect, ghostRect)) {
                this.loseLife();
                this.removeGhost(index);
            }
        });
    }
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom);
    }
    hitGhost(ghost) {
        const basePoints = ghost.characterType.baseScore;
        const points = Math.floor(basePoints * this.difficultySettings.scoreMultiplier);
        this.score += points;
        this.updateUI();
        // レア度に応じてポップアップの色や表示を変える
        let popupText = `+${points}`;
        if (ghost.characterType.specialEffect) {
            popupText += ` ${ghost.characterType.specialEffect}`;
        }
        this.showScorePopup(ghost.x, ghost.y, popupText, ghost.characterType.rarity);
        ghost.element.classList.add('hit-effect');
        setTimeout(() => {
            const index = this.ghosts.findIndex(g => g.id === ghost.id);
            if (index !== -1) {
                this.removeGhost(index);
            }
        }, 300);
        // レア度に応じて異なる効果音
        this.playHitSound(ghost.characterType.rarity);
    }
    showScorePopup(x, y, text, rarity) {
        const popup = document.createElement('div');
        popup.className = `score-popup rarity-${rarity}`;
        popup.textContent = text;
        popup.style.left = x + 'px';
        popup.style.top = y + 'px';
        this.gameArea.appendChild(popup);
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1500); // レアキャラは少し長く表示
    }
    removeGhost(index) {
        const ghost = this.ghosts[index];
        if (ghost && ghost.element.parentNode) {
            ghost.element.parentNode.removeChild(ghost.element);
        }
        this.ghosts.splice(index, 1);
    }
    loseLife() {
        this.lives--;
        this.updateUI();
        // ライフ減少の視覚効果
        this.showLifeLossEffects();
        // ダメージ音を再生
        this.playDamageSound();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    showLifeLossEffects() {
        // 画面を赤く点滅させる
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'damage-flash';
        document.body.appendChild(flashOverlay);
        // プレイヤーキャラクターにダメージエフェクト
        const player = document.getElementById('player');
        if (player) {
            player.classList.add('player-damage');
            setTimeout(() => {
                player.classList.remove('player-damage');
            }, 1000);
        }
        // ライフ表示にダメージエフェクト
        const livesElement = document.getElementById('lives');
        if (livesElement) {
            livesElement.classList.add('lives-damage');
            setTimeout(() => {
                livesElement.classList.remove('lives-damage');
            }, 800);
        }
        // ダメージポップアップ表示
        this.showDamagePopup();
        // フラッシュエフェクトを削除
        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
        }, 300);
    }
    showDamagePopup() {
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = '-1 ライフ';
        // プレイヤーキャラクターの近くに表示
        const player = document.getElementById('player');
        if (player) {
            const playerRect = player.getBoundingClientRect();
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            popup.style.left = (playerRect.left - gameAreaRect.left + 30) + 'px';
            popup.style.top = (playerRect.top - gameAreaRect.top - 30) + 'px';
        }
        this.gameArea.appendChild(popup);
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 1500);
    }
    handleGameAreaClick(e) {
        if (!this.isGameRunning || this.isPaused)
            return;
        this.playMissSound();
    }
    gameOver() {
        this.isGameRunning = false;
        this.stopGameLoops();
        this.clearGameArea();
        // スコアを記録
        this.saveScore(this.score);
        this.finalScoreElement.textContent = this.score.toString();
        this.gameOverDiv.style.display = 'block';
        this.pauseBtn.style.display = 'none';
        this.resetBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
        this.backBtn.style.display = 'inline-block';
        this.startBtn.textContent = 'もう一度プレイ';
    }
    clearGameArea() {
        this.ghosts.forEach(ghost => {
            if (ghost.element.parentNode) {
                ghost.element.parentNode.removeChild(ghost.element);
            }
        });
        this.ghosts = [];
        this.hearts.forEach(heart => {
            if (heart.element.parentNode) {
                heart.element.parentNode.removeChild(heart.element);
            }
        });
        this.hearts = [];
        const popups = this.gameArea.querySelectorAll('.score-popup, .heart-popup');
        popups.forEach(popup => popup.remove());
    }
    updateUI() {
        this.scoreElement.textContent = this.score.toString();
        this.livesElement.textContent = this.lives.toString();
    }
    updateCharacterScoreTable() {
        const characterTable = document.getElementById('characterTable');
        if (characterTable) {
            const scoreElements = characterTable.querySelectorAll('.character-score');
            scoreElements.forEach(element => {
                const baseScore = parseInt(element.getAttribute('data-base-score') || '0');
                const actualScore = Math.floor(baseScore * this.difficultySettings.scoreMultiplier);
                element.textContent = `${actualScore}点`;
            });
        }
    }
    playHitSound(rarity = 'common') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        // レア度に応じて音程を変える
        let frequency;
        let duration;
        switch (rarity) {
            case 'legendary':
                frequency = 1200; // 高音
                duration = 0.3;
                break;
            case 'epic':
                frequency = 1000;
                duration = 0.25;
                break;
            case 'rare':
                frequency = 900;
                duration = 0.2;
                break;
            case 'uncommon':
                frequency = 750;
                duration = 0.15;
                break;
            default: // common
                frequency = 600;
                duration = 0.1;
                break;
        }
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, audioContext.currentTime + duration);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    playMissSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    playHeartSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        // 回復音（やさしい音）
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }
    playDamageSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        // ダメージ音（低い警告音）
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    // スコア履歴管理機能
    saveScore(score) {
        const record = {
            score: score,
            difficulty: this.selectedDifficulty,
            date: new Date().toLocaleDateString('ja-JP'),
            timestamp: Date.now()
        };
        const existingRecords = this.getScoreHistory();
        existingRecords.push(record);
        // 最新20件のみ保持
        const sortedRecords = existingRecords
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);
        localStorage.setItem('ghostbusters-scores', JSON.stringify(sortedRecords));
    }
    getScoreHistory() {
        try {
            const data = localStorage.getItem('ghostbusters-scores');
            return data ? JSON.parse(data) : [];
        }
        catch (error) {
            console.error('スコア履歴の取得に失敗しました:', error);
            return [];
        }
    }
    showScoreHistory() {
        const records = this.getScoreHistory();
        this.renderScoreHistory(records);
        this.historyModal.style.display = 'block';
    }
    hideScoreHistory() {
        this.historyModal.style.display = 'none';
    }
    renderScoreHistory(records) {
        if (records.length === 0) {
            this.historyList.innerHTML = '<div class="no-records">まだスコア記録がありません</div>';
            return;
        }
        // スコア順でソート
        const sortedRecords = records.sort((a, b) => b.score - a.score);
        let html = '';
        sortedRecords.forEach((record, index) => {
            const difficultyText = {
                'easy': 'かんたん',
                'normal': 'ふつう',
                'hard': 'むずかしい'
            }[record.difficulty];
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            html += `
                <div class="score-record ${rankClass}">
                    <div class="rank-medal">${medal}</div>
                    <div class="score-info">
                        <div class="score-points">${record.score}点</div>
                        <div class="score-details">
                            <span class="difficulty">${difficultyText}</span>
                            <span class="date">${record.date}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        this.historyList.innerHTML = html;
    }
    clearScoreHistory() {
        if (confirm('本当にスコア履歴をすべて削除しますか？')) {
            localStorage.removeItem('ghostbusters-scores');
            this.renderScoreHistory([]);
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new GhostBustersGame();
});