class GarbageMasterGame {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = false;
        this.selectedItem = null;
        this.currentFallingItem = null;
        this.gameSpeed = 5000; // 5秒で落下
        this.fallInterval = null;
        this.dogInterval = null;
        
        // ゴミのデータ定義
        this.garbageItems = [
            // もえるごみ
            { emoji: '🧻', type: 'burnable', name: 'ティッシュ' },
            { emoji: '🍌', type: 'burnable', name: 'バナナ' },
            { emoji: '📝', type: 'burnable', name: 'かみ' },
            { emoji: '🐠', type: 'burnable', name: 'さかな' },
            { emoji: '🌽', type: 'burnable', name: 'とうもろこし' },
            { emoji: '🍙', type: 'burnable', name: 'おにぎり' },
            
            // もえないごみ
            { emoji: '📺', type: 'nonburnable', name: 'テレビ' },
            { emoji: '🛳️', type: 'nonburnable', name: 'ふね' },
            { emoji: '🪴', type: 'nonburnable', name: 'うえき' },
            { emoji: '🐩', type: 'nonburnable', name: 'いぬ' },
            { emoji: '🗿', type: 'nonburnable', name: 'いしぞう' },
            { emoji: '⛓️', type: 'nonburnable', name: 'くさり' },
            
            // あきかん
            { emoji: '🥫', type: 'can', name: 'かんづめ' },
        ];
        
        this.dogEmojis = ['🐕', '🐶', '🦮'];
        
        // 効果音の初期化
        this.initializeAudio();
        
        this.initializeElements();
        this.bindEvents();
        this.showStartScreen();
    }
    
    initializeAudio() {
        // Web Audio APIを使用してビープ音を生成
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    initializeElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.clearScreen = document.getElementById('clear-screen');
        this.fallingItem = document.getElementById('falling-item');
        this.dogCharacter = document.getElementById('dog-character');
        this.scoreValue = document.getElementById('score-value');
        this.hearts = document.querySelectorAll('.heart');
        this.trashBins = document.querySelectorAll('.trash-bin');
        this.gameContainer = document.getElementById('game-container');
        this.feedbackMark = document.getElementById('feedback-mark');
        
        // デバッグ用：要素が正しく取得できているか確認
        console.log('Trash bins found:', this.trashBins.length);
        this.trashBins.forEach((bin, index) => {
            console.log(`Bin ${index}: ID = ${bin.id}`);
        });
    }
    
    bindEvents() {
        // スタート画面
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.startGame());
        document.getElementById('play-again-button').addEventListener('click', () => this.startGame());
        
        // ゴミのタップは不要（削除）
        // this.fallingItem.addEventListener('click', () => this.selectItem());
        
        // ゴミ箱のタップ
        this.trashBins.forEach(bin => {
            // クリックイベント
            bin.addEventListener('click', (e) => {
                console.log(`Trash bin clicked: ${bin.id}`);
                this.throwInTrash(bin.id);
            });
            
            // タッチイベント
            bin.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log(`Trash bin touched: ${bin.id}`);
                this.throwInTrash(bin.id);
            });
        });
    }
    
    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.clearScreen.classList.add('hidden');
    }
    
    startGame() {
        // AudioContextをユーザーインタラクションで初期化
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.score = 0;
        this.lives = 3;
        this.isGameRunning = true;
        this.currentFallingItem = null;
        
        // 画面を隠す
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.clearScreen.classList.add('hidden');
        
        // UIを更新
        this.updateScore();
        this.updateLives();
        
        // ゲーム開始
        this.spawnNextItem();
        this.startDogInterference();
        
        this.playSound('start');
    }
    
    spawnNextItem() {
        if (!this.isGameRunning) return;
        
        // ランダムなゴミを選択
        const randomIndex = Math.floor(Math.random() * this.garbageItems.length);
        this.currentFallingItem = this.garbageItems[randomIndex];
        
        // ゴミを表示
        this.fallingItem.textContent = this.currentFallingItem.emoji;
        this.fallingItem.classList.remove('falling');
        
        // 落下位置をランダムに設定
        const gameArea = document.getElementById('game-area');
        const maxLeft = gameArea.clientWidth - 60;
        const randomLeft = Math.random() * maxLeft;
        this.fallingItem.style.left = randomLeft + 'px';
        this.fallingItem.style.transform = 'none';
        
        // 落下アニメーション開始
        setTimeout(() => {
            this.fallingItem.classList.add('falling');
            this.fallingItem.style.animationDuration = this.gameSpeed + 'ms';
        }, 100);
        
        // 落下時間後にミス処理
        this.fallInterval = setTimeout(() => {
            if (this.isGameRunning && this.currentFallingItem) {
                this.missItem();
            }
        }, this.gameSpeed);
    }
    
    // selectItem関数は不要になったので削除
    
    throwInTrash(binType) {
        console.log(`throwInTrash called with binType: ${binType}`);
        console.log(`isGameRunning: ${this.isGameRunning}, currentFallingItem: `, this.currentFallingItem);
        
        if (!this.isGameRunning || !this.currentFallingItem) {
            console.log('Game not running or no falling item');
            return;
        }
        
        // 落下タイマーをクリア
        if (this.fallInterval) {
            clearTimeout(this.fallInterval);
            this.fallInterval = null;
        }
        
        // 正解判定
        const isCorrect = this.currentFallingItem.type === binType;
        console.log(`Answer is ${isCorrect ? 'correct' : 'wrong'}`);
        
        if (isCorrect) {
            this.correctAnswer();
        } else {
            this.wrongAnswer();
        }
        
        // アイテムをクリア
        this.currentFallingItem = null;
        
        // 次のアイテムを準備
        setTimeout(() => {
            if (this.isGameRunning) {
                this.spawnNextItem();
            }
        }, 1000);
    }
    
    correctAnswer() {
        this.score++;
        this.updateScore();
        
        // エフェクト表示
        this.showCorrectEffect();
        this.showFeedbackMark('⭕');
        this.createSparkles();
        this.playSound('correct');
        
        // クリア判定
        if (this.score >= 20) {
            this.gameWin();
        }
    }
    
    wrongAnswer() {
        this.lives--;
        this.updateLives();
        
        // エフェクト表示
        this.showWrongEffect();
        this.showFeedbackMark('❌');
        this.playSound('wrong');
        
        // ゲームオーバー判定
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    missItem() {
        this.lives--;
        this.updateLives();
        
        this.showWrongEffect();
        this.showFeedbackMark('❌');
        this.playSound('wrong');
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.spawnNextItem();
        }
    }
    
    updateScore() {
        this.scoreValue.textContent = this.score;
    }
    
    updateLives() {
        this.hearts.forEach((heart, index) => {
            if (index < this.lives) {
                heart.classList.remove('lost');
            } else {
                heart.classList.add('lost');
            }
        });
    }
    
    showCorrectEffect() {
        this.gameContainer.classList.add('correct-effect');
        setTimeout(() => {
            this.gameContainer.classList.remove('correct-effect');
        }, 500);
    }
    
    showWrongEffect() {
        this.gameContainer.classList.add('wrong-effect');
        setTimeout(() => {
            this.gameContainer.classList.remove('wrong-effect');
        }, 500);
    }
    
    showFeedbackMark(mark) {
        this.feedbackMark.textContent = mark;
        this.feedbackMark.classList.remove('hidden');
        
        // アニメーションを再スタート
        this.feedbackMark.style.animation = 'none';
        setTimeout(() => {
            this.feedbackMark.style.animation = 'feedbackPop 1s ease-out';
        }, 10);
        
        // 1秒後に隠す
        setTimeout(() => {
            this.feedbackMark.classList.add('hidden');
        }, 1000);
    }
    
    createSparkles() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.textContent = '✨';
                sparkle.style.left = Math.random() * window.innerWidth + 'px';
                sparkle.style.top = Math.random() * window.innerHeight + 'px';
                document.body.appendChild(sparkle);
                
                setTimeout(() => {
                    sparkle.remove();
                }, 1000);
            }, i * 100);
        }
    }
    
    startDogInterference() {
        const spawnDog = () => {
            if (!this.isGameRunning) return;
            
            // 20%の確率で犬が出現
            if (Math.random() < 0.2) {
                const randomDog = this.dogEmojis[Math.floor(Math.random() * this.dogEmojis.length)];
                this.dogCharacter.textContent = randomDog;
                this.dogCharacter.classList.remove('hidden');
                
                setTimeout(() => {
                    this.dogCharacter.classList.add('hidden');
                }, 3000);
            }
            
            // 次の犬の出現をスケジュール
            this.dogInterval = setTimeout(spawnDog, 3000 + Math.random() * 5000);
        };
        
        this.dogInterval = setTimeout(spawnDog, 2000 + Math.random() * 3000);
    }
    
    gameWin() {
        this.isGameRunning = false;
        this.clearIntervals();
        this.clearScreen.classList.remove('hidden');
        this.playSound('win');
        
        // 勝利エフェクト
        this.createSparkles();
        setTimeout(() => this.createSparkles(), 500);
        setTimeout(() => this.createSparkles(), 1000);
    }
    
    gameOver() {
        this.isGameRunning = false;
        this.clearIntervals();
        this.gameOverScreen.classList.remove('hidden');
        this.playSound('gameover');
    }
    
    clearIntervals() {
        if (this.fallInterval) {
            clearTimeout(this.fallInterval);
            this.fallInterval = null;
        }
        if (this.dogInterval) {
            clearTimeout(this.dogInterval);
            this.dogInterval = null;
        }
    }
    
    playSound(type) {
        // Web Audio APIで効果音を生成
        if (this.audioContext) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            let frequency, duration;
            
            switch(type) {
                case 'correct':
                    // 正解音：高めの明るい音
                    frequency = 800;
                    duration = 0.3;
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                case 'wrong':
                    // 間違い音：低めの重い音
                    frequency = 200;
                    duration = 0.5;
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                case 'select':
                    // 選択音：短いピッ音
                    frequency = 600;
                    duration = 0.1;
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                case 'win':
                    // 勝利音：上昇する音
                    frequency = 500;
                    duration = 1.0;
                    oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + duration);
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                case 'gameover':
                    // ゲームオーバー音：下降する音
                    frequency = 400;
                    duration = 1.0;
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                    break;
                default:
                    frequency = 440;
                    duration = 0.2;
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            }
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        }
        
        // バイブレーション（モバイル対応）
        if (navigator.vibrate) {
            switch(type) {
                case 'correct':
                    navigator.vibrate([50, 30, 50]);
                    break;
                case 'wrong':
                case 'gameover':
                    navigator.vibrate([200, 100, 200]);
                    break;
                case 'select':
                    navigator.vibrate(30);
                    break;
                case 'win':
                    navigator.vibrate([100, 50, 100, 50, 200]);
                    break;
            }
        }
        
        console.log(`Playing sound: ${type}`);
    }
}

// ゲーム初期化
document.addEventListener('DOMContentLoaded', () => {
    const game = new GarbageMasterGame();
    
    // タッチデバイス対応（ゴミ箱ボタンは除外）
    document.addEventListener('touchstart', (e) => {
        // ゴミ箱ボタンやゲームボタンの場合は防がない
        if (e.target.closest('.trash-bin') || e.target.closest('button')) {
            return;
        }
        e.preventDefault();
    }, { passive: false });
    
    // ダブルタップズーム無効化
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});