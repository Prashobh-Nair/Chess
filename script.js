/* Game State */
const PIECES = {
    w: {
        k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
        p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg'
    },
    b: {
        k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
        p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg'
    }
};

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let gameState = {
    board: [],
    turn: 'w',
    castling: { w: { k: true, q: true }, b: { k: true, q: true } },
    enPassant: null,
    history: [],
    gameOver: false,
    selectedSquare: null,
    validMoves: []
};

/* AI Constants (Piece-Square Tables) - Defined from White's perspective (Rank 8 [Row 0] to Rank 1 [Row 7]) */
/* Index 0 = Rank 8 (Top), Index 7 = Rank 1 (Bottom) */
/* White starts at Bottom (Row 6/7). Promotes at Top (Row 0). */
const PST = {
    p: [
        [0, 0, 0, 0, 0, 0, 0, 0],  // Rank 8 (Promotion)
        [50, 50, 50, 50, 50, 50, 50, 50], // Rank 7
        [10, 10, 20, 30, 30, 20, 10, 10], // Rank 6
        [5, 5, 10, 25, 25, 10, 5, 5],  // Rank 5
        [0, 0, 0, 20, 20, 0, 0, 0],  // Rank 4
        [5, -5, -10, 0, 0, -10, -5, 5],  // Rank 3
        [5, 10, 10, -20, -20, 10, 10, 5],  // Rank 2
        [0, 0, 0, 0, 0, 0, 0, 0]   // Rank 1
    ],
    n: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30], // Centering Knights
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 10, 10, 5, 0, -10],
        [-10, 5, 5, 10, 10, 5, 5, -10],
        [-10, 0, 10, 10, 10, 10, 0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10, 5, 0, 0, 0, 0, 5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 10, 10, 10, 10, 10, 5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [0, 0, 0, 5, 5, 0, 0, 0]
    ],
    q: [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 5, 5, 5, 0, -10],
        [-5, 0, 5, 5, 5, 5, 0, -5],
        [0, 0, 5, 5, 5, 5, 0, -5],
        [-10, 5, 5, 5, 5, 5, 0, -10],
        [-10, 0, 5, 0, 0, 0, 0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    k: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [20, 20, 0, 0, 0, 0, 20, 20],
        [20, 30, 10, 0, 0, 10, 30, 20]
    ]
};
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

/* DOM Elements */
const boardElement = document.getElementById('chessboard');
const statusElement = document.getElementById('game-status');
const themeToggle = document.getElementById('theme-toggle');
const newGameBtn = document.getElementById('new-game-btn');

/* Constants */
const DIRECTIONS = {
    r: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    b: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    k: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
};

/* --- Initialization --- */

function initGame() {
    initBoardFromFEN(INITIAL_FEN);
    gameState.turn = 'w';
    gameState.castling = { w: { k: true, q: true }, b: { k: true, q: true } };
    gameState.enPassant = null;
    gameState.history = [];
    gameState.gameOver = false;
    gameState.selectedSquare = null;
    gameState.validMoves = [];

    updateStatus();
    renderBoard();
}

function initBoardFromFEN(fen) {
    gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
    const [placement] = fen.split(' ');
    let row = 0, col = 0;
    for (const char of placement) {
        if (char === '/') { row++; col = 0; }
        else if (/\d/.test(char)) { col += parseInt(char); }
        else {
            const color = char === char.toUpperCase() ? 'w' : 'b';
            const type = char.toLowerCase();
            gameState.board[row][col] = { type, color, hasMoved: false };
            col++;
        }
    }
}

/* --- Core Engine --- */

function isValidPos(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getPseudoLegalMoves(state, color) {
    const moves = [];
    const { board, castling, enPassant } = state;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.color === color) {
                // Pawn Logic
                if (piece.type === 'p') {
                    const fw = color === 'w' ? -1 : 1;
                    const startRow = color === 'w' ? 6 : 1;
                    // Move 1
                    if (isValidPos(r + fw, c) && !board[r + fw][c]) {
                        moves.push({ from: { row: r, col: c }, to: { row: r + fw, col: c } });
                        // Move 2
                        if (r === startRow && !board[r + fw * 2][c]) {
                            moves.push({ from: { row: r, col: c }, to: { row: r + fw * 2, col: c } });
                        }
                    }
                    // Capture
                    [[fw, 1], [fw, -1]].forEach(offset => {
                        const tr = r + offset[0], tc = c + offset[1];
                        if (isValidPos(tr, tc)) {
                            const target = board[tr][tc];
                            if (target && target.color !== color) {
                                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
                            }
                            // En Passant
                            if (enPassant && tr === enPassant.row && tc === enPassant.col) {
                                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc }, isEnPassant: true });
                            }
                        }
                    });
                }
                // Sliding & King/Knight Logic
                else {
                    const dirs = DIRECTIONS[piece.type];
                    for (let d of dirs) {
                        let tr = r + d[0], tc = c + d[1];
                        while (isValidPos(tr, tc)) {
                            const target = board[tr][tc];
                            if (!target) {
                                moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
                            } else {
                                if (target.color !== color) moves.push({ from: { row: r, col: c }, to: { row: tr, col: tc } });
                                break; // Blocked
                            }
                            if (piece.type === 'n' || piece.type === 'k') break; // Single step
                            tr += d[0]; tc += d[1];
                        }
                    }
                }
            }
        }
    }
    return moves;
}

function isSquareAttacked(state, r, c, attackerColor) {
    const fw = attackerColor === 'w' ? 1 : -1;
    if (isValidPos(r + fw, c - 1)) { const p = state.board[r + fw][c - 1]; if (p && p.color === attackerColor && p.type === 'p') return true; }
    if (isValidPos(r + fw, c + 1)) { const p = state.board[r + fw][c + 1]; if (p && p.color === attackerColor && p.type === 'p') return true; }

    for (let d of DIRECTIONS.n) {
        let tr = r + d[0], tc = c + d[1];
        if (isValidPos(tr, tc)) { const p = state.board[tr][tc]; if (p && p.color === attackerColor && p.type === 'n') return true; }
    }
    for (let d of DIRECTIONS.k) {
        let tr = r + d[0], tc = c + d[1];
        if (isValidPos(tr, tc)) { const p = state.board[tr][tc]; if (p && p.color === attackerColor && p.type === 'k') return true; }
    }
    for (let d of DIRECTIONS.r) {
        let tr = r + d[0], tc = c + d[1];
        while (isValidPos(tr, tc)) {
            const p = state.board[tr][tc];
            if (p) { if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true; break; }
            tr += d[0]; tc += d[1];
        }
    }
    for (let d of DIRECTIONS.b) {
        let tr = r + d[0], tc = c + d[1];
        while (isValidPos(tr, tc)) {
            const p = state.board[tr][tc];
            if (p) { if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true; break; }
            tr += d[0]; tc += d[1];
        }
    }
    return false;
}

function applyMove(state, move) {
    const newState = {
        board: state.board.map(r => r.map(c => c ? { ...c } : null)),
        turn: state.turn === 'w' ? 'b' : 'w',
        castling: { w: { ...state.castling.w }, b: { ...state.castling.b } },
        enPassant: null,
        history: [...state.history],
        gameOver: state.gameOver
    };

    const p = newState.board[move.from.row][move.from.col];

    // Castling
    if (p.type === 'k' && Math.abs(move.to.col - move.from.col) === 2) {
        const isKingside = move.to.col > move.from.col;
        const rookRow = move.from.row;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        const rook = newState.board[rookRow][rookFromCol];
        newState.board[rookRow][rookToCol] = rook;
        newState.board[rookRow][rookFromCol] = null;
        if (rook) rook.hasMoved = true;
    }

    newState.board[move.to.row][move.to.col] = p;
    newState.board[move.from.row][move.from.col] = null;
    p.hasMoved = true;

    if (move.isEnPassant) {
        const fw = p.color === 'w' ? -1 : 1;
        newState.board[move.to.row - fw][move.to.col] = null;
    }

    if (p.type === 'p' && (move.to.row === 0 || move.to.row === 7)) {
        p.type = 'q';
    }

    if (p.type === 'p' && Math.abs(move.to.row - move.from.row) === 2) {
        newState.enPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };
    }

    if (p.type === 'k') { newState.castling[p.color].k = false; newState.castling[p.color].q = false; }
    if (p.type === 'r') {
        const row = p.color === 'w' ? 7 : 0;
        if (move.from.row === row) {
            if (move.from.col === 0) newState.castling[p.color].q = false;
            if (move.from.col === 7) newState.castling[p.color].k = false;
        }
    }

    newState.history.push(move);
    return newState;
}

function getAllLegalMoves(state, color) {
    let moves = getPseudoLegalMoves(state, color);

    const { castling, board } = state;
    if (state.board[color === 'w' ? 7 : 0][4]?.type === 'k' && !isSquareAttacked(state, color === 'w' ? 7 : 0, 4, color === 'w' ? 'b' : 'w')) {
        if (castling[color].k) {
            const row = color === 'w' ? 7 : 0;
            if (!board[row][5] && !board[row][6] && !isSquareAttacked(state, row, 5, color === 'w' ? 'b' : 'w') && !isSquareAttacked(state, row, 6, color === 'w' ? 'b' : 'w')) {
                moves.push({ from: { row, col: 4 }, to: { row, col: 6 } });
            }
        }
        if (castling[color].q) {
            const row = color === 'w' ? 7 : 0;
            if (!board[row][3] && !board[row][2] && !board[row][1] && !isSquareAttacked(state, row, 3, color === 'w' ? 'b' : 'w') && !isSquareAttacked(state, row, 2, color === 'w' ? 'b' : 'w')) {
                moves.push({ from: { row, col: 4 }, to: { row, col: 2 } });
            }
        }
    }

    return moves.filter(m => {
        const simState = applyMove(state, m);
        let kRow, kCol;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = simState.board[r][c]; if (p && p.type === 'k' && p.color === color) { kRow = r; kCol = c; } }
        return !isSquareAttacked(simState, kRow, kCol, simState.turn);
    });
}

function evaluateBoard(state) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = state.board[r][c];
            if (p) {
                const isWhite = p.color === 'w';
                const material = PIECE_VALUES[p.type];
                let pstVal = 0;
                if (PST[p.type]) {
                    const row = isWhite ? r : 7 - r;
                    pstVal = PST[p.type][row][c];
                }
                if (isWhite) score += material + pstVal;
                else score -= (material + pstVal);
            }
        }
    }
    return score;
}

function minimax(state, depth, alpha, beta, isMaximizing) {
    if (depth === 0) return evaluateBoard(state);

    const moves = getAllLegalMoves(state, state.turn);
    if (moves.length === 0) {
        let kRow, kCol;
        const color = state.turn;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = state.board[r][c]; if (p && p.type === 'k' && p.color === color) { kRow = r; kCol = c; } }
        if (isSquareAttacked(state, kRow, kCol, color === 'w' ? 'b' : 'w')) {
            return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth); // Mate preference for faster mate
        }
        return 0;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextState = applyMove(state, move);
            const ev = minimax(nextState, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, ev);
            alpha = Math.max(alpha, ev);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        // Simple move ordering: Captures first (heuristic)
        moves.sort((a, b) => {
            const capA = state.board[a.to.row][a.to.col] ? 10 : 0;
            const capB = state.board[b.to.row][b.to.col] ? 10 : 0;
            return capB - capA;
        });

        for (const move of moves) {
            const nextState = applyMove(state, move);
            const ev = minimax(nextState, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, ev);
            beta = Math.min(beta, ev);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function makeAIMove() {
    if (gameState.gameOver) return;
    statusElement.textContent = "AI Thinking...";
    setTimeout(() => {
        const depth = 3;
        const moves = getAllLegalMoves(gameState, gameState.turn);
        if (moves.length === 0) return;

        let bestMove = null;
        let bestValue = Infinity; // Black minimizes

        for (const move of moves) {
            const nextState = applyMove(gameState, move);
            const value = minimax(nextState, depth - 1, -Infinity, Infinity, true); // Root is Black (Minimizing), next is White (Maximizing)
            if (value < bestValue) { bestValue = value; bestMove = move; }
        }

        if (bestMove) performMove(bestMove);
        else performMove(moves[0]); // Stalemate fallback
    }, 50);
}

/* --- Interaction --- */

function handleSquareClick(row, col) {
    if (gameState.gameOver || gameState.turn !== 'w') return;

    const piece = gameState.board[row][col];
    const move = gameState.validMoves.find(m => m.to.row === row && m.to.col === col);
    if (move) { performMove(move); return; }

    if (piece && piece.color === gameState.turn) {
        if (gameState.selectedSquare && gameState.selectedSquare.row === row && gameState.selectedSquare.col === col) {
            gameState.selectedSquare = null; gameState.validMoves = [];
        } else {
            gameState.selectedSquare = { row, col };
            gameState.validMoves = getAllLegalMoves(gameState, gameState.turn).filter(m => m.from.row === row && m.from.col === col);
        }
        renderBoard();
    } else {
        gameState.selectedSquare = null; gameState.validMoves = []; renderBoard();
    }
}

function performMove(move) {
    gameState = applyMove(gameState, move);
    gameState.selectedSquare = null;
    gameState.validMoves = [];
    renderBoard();
    updateStatus();

    const nextMoves = getAllLegalMoves(gameState, gameState.turn);
    if (nextMoves.length === 0) {
        let kRow, kCol;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (gameState.board[r][c]?.type === 'k' && gameState.board[r][c].color === gameState.turn) { kRow = r; kCol = c; }
        if (isSquareAttacked(gameState, kRow, kCol, gameState.turn === 'w' ? 'b' : 'w')) { statusElement.textContent = `Checkmate! ${gameState.turn === 'w' ? 'Black' : 'White'} wins!`; }
        else { statusElement.textContent = "Draw (Stalemate)!"; }
        gameState.gameOver = true;
        return;
    }

    if (!gameState.gameOver && gameState.turn === 'b') setTimeout(makeAIMove, 100);
}

function renderBoard() {
    boardElement.innerHTML = '';
    let kRow, kCol;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (gameState.board[r][c]?.type === 'k' && gameState.board[r][c].color === gameState.turn) { kRow = r; kCol = c; }
    const inCheck = isSquareAttacked(gameState, kRow, kCol, gameState.turn === 'w' ? 'b' : 'w');

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;

            if (gameState.validMoves.some(m => m.to.row === row && m.to.col === col)) {
                if (gameState.board[row][col]) square.classList.add('valid-capture');
                else square.classList.add('valid-move');
            }
            if (gameState.selectedSquare?.row === row && gameState.selectedSquare?.col === col) square.classList.add('selected');
            const last = gameState.history[gameState.history.length - 1];
            if (last && ((last.from.row === row && last.from.col === col) || (last.to.row === row && last.to.col === col))) square.classList.add('last-move');
            if (inCheck && row === kRow && col === kCol) square.style.background = 'radial-gradient(circle, rgba(255,0,0,0.6) 0%, transparent 70%)';

            const piece = gameState.board[row][col];
            if (piece) {
                const pieceEl = document.createElement('div');
                pieceEl.className = `piece ${piece.color}`;
                // Usage of background-image for SVG rendering
                pieceEl.style.backgroundImage = `url('${PIECES[piece.color][piece.type]}')`;
                pieceEl.style.width = '100%';
                pieceEl.style.height = '100%';
                pieceEl.style.backgroundSize = '85%';
                pieceEl.style.backgroundRepeat = 'no-repeat';
                pieceEl.style.backgroundPosition = 'center';
                // Remove text styling
                pieceEl.textContent = '';
                square.appendChild(pieceEl);
            }
            square.onclick = () => handleSquareClick(row, col);
            boardElement.appendChild(square);
        }
    }
}

function updateStatus() { if (gameState.gameOver) return; statusElement.textContent = gameState.turn === 'w' ? "Your Turn" : "Thinking..."; }
themeToggle.onclick = () => document.body.classList.toggle('dark-mode');
newGameBtn.onclick = initGame;

initGame();
