// Simple XOwars Game - Clean and Easy to Understand
class SimpleXOwars {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameMode = 'local';
        this.difficulty = 'medium';
        this.gameActive = true;
        this.gameStartTime = Date.now();
        this.moveCount = 0;
        this.moveHistory = [];
        
        // Statistics
        this.stats = this.loadStats();
        
        // Multiplayer
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.roomCode = '';
        this.mySymbol = 'X'; // Track which symbol this player is using
        this.isMyTurn = true; // Track if it's this player's turn
        
        this.initializeGame();
    }

    initializeGame() {
        this.updateParticles();
        this.bindEvents();
        this.updateStatsDisplay();
        this.startGameTimer();
    }

    // ==================== UI Functions ====================
    
    updateParticles() {
        const particlesContainer = document.getElementById('particles');
        particlesContainer.innerHTML = '';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (6 + Math.random() * 3) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    bindEvents() {
        // Game board clicks
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.addEventListener('click', () => this.makeMove(index));
        });

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
    const mode = e.target.dataset.mode;
                const difficulty = e.target.dataset.difficulty;
                
                if (mode) {
                    this.selectMode(mode);
                } else if (difficulty) {
                    this.selectDifficulty(difficulty);
                }
  });
});

        // Color changes
        document.getElementById('xColor').addEventListener('change', this.updateColors.bind(this));
        document.getElementById('oColor').addEventListener('change', this.updateColors.bind(this));

        // Chat enter key
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    selectMode(mode) {
        this.gameMode = mode;
        this.resetGame();
        
        // Update active button
        document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Show/hide relevant sections
        const multiplayerSection = document.getElementById('multiplayerSection');
        const chatSection = document.getElementById('chatSection');
        const difficultySelection = document.getElementById('difficultySelection');
        
        if (mode === 'online') {
            multiplayerSection.classList.add('show');
            chatSection.classList.add('show');
            difficultySelection.classList.remove('show');
        } else if (mode === 'ai') {
            multiplayerSection.classList.remove('show');
            chatSection.classList.remove('show');
            difficultySelection.classList.add('show');
        } else {
            multiplayerSection.classList.remove('show');
            chatSection.classList.remove('show');
            difficultySelection.classList.remove('show');
        }
    }

    selectDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        // Update active button
        document.querySelectorAll('.mode-btn[data-difficulty]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
    }

    updateColors() {
        const xColor = document.getElementById('xColor').value;
        const oColor = document.getElementById('oColor').value;
        
        document.documentElement.style.setProperty('--primary-neon', xColor);
        document.documentElement.style.setProperty('--secondary-neon', oColor);
    }

    // ==================== Game Logic ====================
    
    makeMove(index) {
        if (!this.gameActive || this.board[index] !== '') return;
        
        // In online mode, check if it's player's turn
        if (this.gameMode === 'online' && this.connection && !this.isMyTurn) {
            console.log('Not your turn!');
            return;
        }
        
        // In online mode, ensure player uses their assigned symbol
        if (this.gameMode === 'online' && this.connection && this.currentPlayer !== this.mySymbol) {
            console.log('Wrong symbol!');
            return;
        }

        this.board[index] = this.currentPlayer;
        this.moveCount++;
        this.moveHistory.push({ index, player: this.currentPlayer });
        
        this.updateCell(index, this.currentPlayer);
        
        if (this.checkWin()) {
            this.endGame(this.currentPlayer);
            return;
        }
        
        if (this.moveCount === 9) {
            this.endGame('draw');
            return;
        }
        
        this.switchPlayer();
        
        // Update turn status for online mode
        if (this.gameMode === 'online' && this.connection) {
            this.isMyTurn = false;
            this.connection.send({
                type: 'move',
                index: index,
                player: this.board[index],
                moveCount: this.moveCount,
                gameActive: this.gameActive
            });
        }
        
        // AI move
        if (this.gameMode === 'ai' && this.currentPlayer === 'O' && this.gameActive) {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    updateCell(index, player) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = player;
        cell.classList.add(player);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        document.getElementById('currentTurn').textContent = this.currentPlayer;
    }

    checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        
        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return this.board[a] && 
                   this.board[a] === this.board[b] && 
                   this.board[a] === this.board[c];
  });
}

    endGame(winner) {
        this.gameActive = false;
        
        if (winner === 'draw') {
            this.stats.draws++;
            this.showWinOverlay('🤝 Draw! 🤝', 'Draw');
        } else {
            if (winner === 'X') {
                this.stats.wins++;
    } else {
                this.stats.losses++;
            }
            this.showWinOverlay(`🎉 ${winner} Wins! 🎉`, winner);
        }
        
        this.saveStats();
        this.updateStatsDisplay();
    }

    showWinOverlay(message, winner) {
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        
        document.getElementById('winText').textContent = message;
        document.getElementById('winTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('winMoves').textContent = this.moveCount;
        document.getElementById('winMode').textContent = 
            this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
        
        // Add dramatic effect
        this.triggerWinEffect();
        
        document.getElementById('winOverlay').classList.add('active');
    }

    triggerWinEffect() {
        // Screen flash effect
        document.body.style.animation = 'winFlash 0.5s ease-out';
        
        // Make game board cells glow
        document.querySelectorAll('.cell').forEach(cell => {
            cell.style.animation = 'cellWinGlow 1s ease-out';
        });
        
        // Create extra particles
        this.createWinParticles();
        
        // Simulate victory sound with visual feedback
        this.simulateWinSound();
        
        // Reset animations after they complete
        setTimeout(() => {
            document.body.style.animation = '';
            document.querySelectorAll('.cell').forEach(cell => {
                cell.style.animation = '';
            });
        }, 1000);
    }

    createWinParticles() {
        const container = document.body;
        
        // Create 20 extra victory particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '12px';
            particle.style.height = '12px';
            particle.style.borderRadius = '50%';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = window.innerHeight + 'px';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';
            particle.style.animation = `victoryParticle ${2 + Math.random() * 2}s ease-out`;
            
            container.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 4000);
  }
}

    simulateWinSound() {
        // Create visual sound waves
        const soundWaves = document.createElement('div');
        soundWaves.style.position = 'fixed';
        soundWaves.style.top = '50%';
        soundWaves.style.left = '50%';
        soundWaves.style.width = '4px';
        soundWaves.style.height = '4px';
        soundWaves.style.border = '2px solid var(--success-neon)';
        soundWaves.style.borderRadius = '50%';
        soundWaves.style.transform = 'translate(-50%, -50%)';
        soundWaves.style.animation = 'soundWave 0.8s ease-out';
        soundWaves.style.pointerEvents = 'none';
        soundWaves.style.zIndex = '9999';
        
        document.body.appendChild(soundWaves);
        
        setTimeout(() => {
            if (soundWaves.parentNode) {
                soundWaves.parentNode.removeChild(soundWaves);
  }
        }, 800);
}

    // ==================== AI Logic ====================
    
    makeAIMove() {
        let move;
        
        switch (this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getMediumMove();
                break;
            case 'hard':
                move = this.getBestMove();
                break;
        }
        
        if (move !== -1) {
            this.makeMove(move);
        }
    }

    getRandomMove() {
        const availableMoves = this.board
            .map((cell, index) => cell === '' ? index : null)
            .filter(val => val !== null);
        
        return availableMoves.length > 0 
            ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
            : -1;
    }

    getMediumMove() {
        // 50% chance to play optimally, 50% random
        return Math.random() < 0.5 ? this.getBestMove() : this.getRandomMove();
  }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                let score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
      if (score > bestScore) {
        bestScore = score;
                    bestMove = i;
      }
            }
        }
        
    return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinForBoard(board);
        
        if (winner === 'O') return 1;
        if (winner === 'X') return -1;
        if (board.every(cell => cell !== '')) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    let score = this.minimax(board, depth + 1, false);
                    board[i] = '';
        bestScore = Math.max(score, bestScore);
      }
            }
    return bestScore;
  } else {
    let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    let score = this.minimax(board, depth + 1, true);
                    board[i] = '';
        bestScore = Math.min(score, bestScore);
      }
            }
    return bestScore;
  }
}

    checkWinForBoard(board) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
}

    // ==================== Game Controls ====================
    
    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameStartTime = Date.now();
        this.moveCount = 0;
        this.moveHistory = [];
        
        // Reset online multiplayer state
        if (this.gameMode === 'online') {
            this.isMyTurn = (this.mySymbol === 'X');
            
            // Send reset notification to opponent
            if (this.connection) {
                this.connection.send({
                    type: 'reset'
                });
            }
        } else {
            this.isMyTurn = true;
        }
        
        // Clear board visually
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('X', 'O');
        });
        
        document.getElementById('currentTurn').textContent = this.currentPlayer;
        document.getElementById('winOverlay').style.display = 'none';
        
        this.startGameTimer();
    }

    undoMove() {
        if (this.moveHistory.length === 0 || !this.gameActive) return;
        
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.index] = '';
        this.moveCount--;
        
        const cell = document.querySelector(`[data-index="${lastMove.index}"]`);
        cell.textContent = '';
        cell.classList.remove('X', 'O');
        
        // Undo AI move too if in AI mode
        if (this.gameMode === 'ai' && this.moveHistory.length > 0) {
            const aiMove = this.moveHistory.pop();
            this.board[aiMove.index] = '';
            this.moveCount--;
            
            const aiCell = document.querySelector(`[data-index="${aiMove.index}"]`);
            aiCell.textContent = '';
            aiCell.classList.remove('X', 'O');
        }
        
        this.currentPlayer = 'X';
        document.getElementById('currentTurn').textContent = 'X';
    }

    // ==================== Multiplayer ====================
    
    createRoom() {
        if (this.peer) {
            this.peer.destroy();
        }

        this.roomCode = this.generateRoomCode();
        this.peer = new Peer(this.roomCode);
        this.isHost = true;
        this.mySymbol = 'X'; // Host is always X
        this.isMyTurn = true; // Host starts first
        
        this.peer.on('open', () => {
            document.getElementById('roomDisplay').textContent = `Room Code: ${this.roomCode}`;
            document.getElementById('roomDisplay').style.display = 'block';
            document.getElementById('statusDisplay').textContent = 'Waiting for opponent...';
            this.updateConnectionStatus(true, 'Waiting for player');
        });
        
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.setupConnection();
            document.getElementById('statusDisplay').textContent = 'Player connected!';
            this.updateConnectionStatus(true, 'Connected');
            
            // Send initial game state to the joining player
            this.connection.send({
                type: 'gameState',
                hostSymbol: 'X',
                guestSymbol: 'O',
                currentPlayer: this.currentPlayer,
                board: this.board,
                moveCount: this.moveCount,
                gameActive: this.gameActive
            });
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            document.getElementById('statusDisplay').textContent = 'Connection error. Try again.';
            this.updateConnectionStatus(false, 'Error');
        });
    }

    joinRoom() {
        const roomCode = document.getElementById('roomCode').value.trim();
        if (!roomCode) return;
        
        if (this.peer) {
            this.peer.destroy();
        }
        
        this.peer = new Peer();
        this.isHost = false;
        this.mySymbol = 'O'; // Guest is always O
        this.isMyTurn = false; // Guest waits for host to start
        
        this.peer.on('open', () => {
            this.connection = this.peer.connect(roomCode);
            this.setupConnection();
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            document.getElementById('statusDisplay').textContent = 'Failed to join room. Check code.';
            this.updateConnectionStatus(false, 'Error');
        });
    }

    setupConnection() {
        this.connection.on('open', () => {
            document.getElementById('statusDisplay').textContent = 'Connected to opponent!';
            this.updateConnectionStatus(true, 'Connected');
            this.resetGame();
        });
        
        this.connection.on('data', (data) => {
            if (data.type === 'move') {
                // Validate the move
                if (this.board[data.index] !== '' || !this.gameActive) return;
                
                this.board[data.index] = data.player;
                this.updateCell(data.index, data.player);
                this.moveCount = data.moveCount;
                this.isMyTurn = true; // Now it's my turn
                
                if (this.checkWin()) {
                    this.endGame(data.player);
                } else if (this.moveCount === 9) {
                    this.endGame('draw');
                } else {
                    this.switchPlayer();
                }
            } else if (data.type === 'gameState') {
                // Initialize game state for joining player
                this.mySymbol = data.guestSymbol;
                this.currentPlayer = data.currentPlayer;
                this.board = data.board;
                this.moveCount = data.moveCount;
                this.gameActive = data.gameActive;
                this.isMyTurn = (this.currentPlayer === this.mySymbol);
                this.updateBoard();
            } else if (data.type === 'chat') {
                this.addChatMessage(data.message, false);
            } else if (data.type === 'reset') {
                this.resetGame();
            }
        });
        
        this.connection.on('close', () => {
            document.getElementById('statusDisplay').textContent = 'Opponent disconnected';
            this.updateConnectionStatus(false, 'Disconnected');
        });
        
        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            document.getElementById('statusDisplay').textContent = 'Connection lost';
            this.updateConnectionStatus(false, 'Error');
        });
    }

    updateBoard() {
        // Update the visual board to match the current state
        for (let i = 0; i < 9; i++) {
            if (this.board[i]) {
                this.updateCell(i, this.board[i]);
            } else {
                const cell = document.querySelector(`[data-index="${i}"]`);
                cell.textContent = '';
                cell.classList.remove('X', 'O');
            }
        }
        document.getElementById('currentTurn').textContent = this.currentPlayer;
    }

    updateConnectionStatus(connected, text) {
        const statusDot = document.getElementById('statusDot');
        const connectionText = document.getElementById('connectionText');
        
        if (connected) {
            statusDot.classList.add('connected');
  } else {
            statusDot.classList.remove('connected');
        }
        
        connectionText.textContent = text;
    }

    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
}

    // ==================== Chat System ====================
    
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message || !this.connection) return;
        
        this.addChatMessage(message, true);
        this.connection.send({
            type: 'chat',
            message: message
        });
        
        input.value = '';
  }

    addChatMessage(message, isOwn) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        messageDiv.textContent = message;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ==================== Statistics ====================
    
    loadStats() {
        const saved = localStorage.getItem('xowars_stats');
        return saved ? JSON.parse(saved) : { wins: 0, losses: 0, draws: 0 };
}

    saveStats() {
        localStorage.setItem('xowars_stats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        document.getElementById('winsCount').textContent = this.stats.wins;
        document.getElementById('lossesCount').textContent = this.stats.losses;
        document.getElementById('drawsCount').textContent = this.stats.draws;
    }

    // ==================== Timer ====================
    
    startGameTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.gameActive) {
                const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('gameTimer').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
}

// ==================== Global Functions ====================

function showGamePage() {
    document.getElementById('descriptionPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';
}

function showDescriptionPage() {
    document.getElementById('descriptionPage').style.display = 'block';
    document.getElementById('gamePage').style.display = 'none';
}

function resetGame() {
    if (window.game) {
        window.game.resetGame();
    }
}

function undoMove() {
    if (window.game) {
        window.game.undoMove();
    }
}

function createRoom() {
    if (window.game) {
        window.game.createRoom();
    }
}

function joinRoom() {
    if (window.game) {
        window.game.joinRoom();
    }
}

function sendChatMessage() {
    if (window.game) {
        window.game.sendChatMessage();
  }
}

function playAgain() {
    if (window.game) {
        window.game.resetGame();
    }
}

// ==================== Initialize Game ====================

document.addEventListener('DOMContentLoaded', () => {
    window.game = new SimpleXOwars();
});