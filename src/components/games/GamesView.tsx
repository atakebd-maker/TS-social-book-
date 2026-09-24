import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Award,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

type GameType = 'snake' | 'memory' | 'tictactoe' | 'trivia';

// ==================== 1. RETRO SNAKE GAME ====================
const GRID_SIZE = 16;

const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<[number, number][]>([
    [7, 7],
    [7, 6],
    [7, 5]
  ]);
  const [food, setFood] = useState<[number, number]>([3, 3]);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('tssb_snake_high') || 0);
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const dirRef = useRef(direction);
  dirRef.current = direction;

  const generateFood = (currentSnake: [number, number][]): [number, number] => {
    let newFood: [number, number];
    while (true) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      const onSnake = currentSnake.some(([sr, sc]) => sr === r && sc === c);
      if (!onSnake) {
        newFood = [r, c];
        break;
      }
    }
    return newFood;
  };

  const restartGame = () => {
    const initialSnake: [number, number][] = [
      [7, 7],
      [7, 6],
      [7, 5]
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    dirRef.current = 'RIGHT';
    setFood(generateFood(initialSnake));
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const key = e.key;
      if ((key === 'ArrowUp' || key === 'w' || key === 'W') && dirRef.current !== 'DOWN') {
        setDirection('UP');
      } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && dirRef.current !== 'UP') {
        setDirection('DOWN');
      } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && dirRef.current !== 'RIGHT') {
        setDirection('LEFT');
      } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && dirRef.current !== 'LEFT') {
        setDirection('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        let newHead: [number, number] = [head[0], head[1]];

        if (dirRef.current === 'UP') newHead[0] -= 1;
        if (dirRef.current === 'DOWN') newHead[0] += 1;
        if (dirRef.current === 'LEFT') newHead[1] -= 1;
        if (dirRef.current === 'RIGHT') newHead[1] += 1;

        // Wall collisions
        if (
          newHead[0] < 0 ||
          newHead[0] >= GRID_SIZE ||
          newHead[1] < 0 ||
          newHead[1] >= GRID_SIZE
        ) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prev;
        }

        // Self collision
        if (prev.some(([r, c]) => r === newHead[0] && c === newHead[1])) {
          setIsGameOver(true);
          setIsPlaying(false);
          return prev;
        }

        const nextSnake: [number, number][] = [newHead, ...prev];

        // Food eaten
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          const newScore = score + 10;
          setScore(newScore);
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('tssb_snake_high', String(newScore));
          }
          setFood(generateFood(nextSnake));
        } else {
          nextSnake.pop();
        }

        return nextSnake;
      });
    }, 130);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, food, score, highScore]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between w-full max-w-sm px-4 py-2 bg-slate-100 rounded-2xl">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
          <span>Score:</span>
          <span className="text-blue-600 text-base">{score}</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-amber-600 text-sm">
          <Trophy className="w-4 h-4" />
          <span>Best: {highScore}</span>
        </div>
      </div>

      {/* Snake Grid Board */}
      <div className="relative bg-slate-900 border-4 border-slate-800 rounded-2xl p-1 shadow-xl">
        <div
          className="grid gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: '288px',
            height: '288px'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const r = Math.floor(idx / GRID_SIZE);
            const c = idx % GRID_SIZE;
            const isHead = snake[0][0] === r && snake[0][1] === c;
            const isBody = snake.slice(1).some(([sr, sc]) => sr === r && sc === c);
            const isFood = food[0] === r && food[1] === c;

            return (
              <div
                key={idx}
                className={`rounded-xs transition-all duration-75 ${
                  isHead
                    ? 'bg-emerald-400 ring-2 ring-emerald-300 z-10'
                    : isBody
                    ? 'bg-emerald-600'
                    : isFood
                    ? 'bg-rose-500 rounded-full animate-pulse'
                    : 'bg-slate-950/40'
                }`}
              />
            );
          })}
        </div>

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 text-center z-20">
            {isGameOver ? (
              <>
                <h3 className="text-rose-400 font-extrabold text-xl mb-1">Game Over!</h3>
                <p className="text-slate-300 text-xs mb-3">You scored {score} points</p>
                <button
                  onClick={restartGame}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="text-white font-extrabold text-xl mb-1">Retro Snake 🐍</h3>
                <p className="text-slate-300 text-xs mb-4">
                  Use arrow keys or touch buttons to eat red apples!
                </p>
                <button
                  onClick={restartGame}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Game</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Touch D-Pad Controls for mobile */}
      <div className="flex flex-col items-center gap-1.5 pt-1">
        <button
          onClick={() => {
            if (dirRef.current !== 'DOWN') setDirection('UP');
          }}
          className="w-12 h-11 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-xl flex items-center justify-center text-slate-800 shadow-xs"
          aria-label="Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (dirRef.current !== 'RIGHT') setDirection('LEFT');
            }}
            className="w-12 h-11 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-xl flex items-center justify-center text-slate-800 shadow-xs"
            aria-label="Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (dirRef.current !== 'UP') setDirection('DOWN');
            }}
            className="w-12 h-11 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-xl flex items-center justify-center text-slate-800 shadow-xs"
            aria-label="Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (dirRef.current !== 'LEFT') setDirection('RIGHT');
            }}
            className="w-12 h-11 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-xl flex items-center justify-center text-slate-800 shadow-xs"
            aria-label="Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 2. MEMORY CARD MATCH ====================
const MEMORY_EMOJIS = ['🚀', '💎', '🎮', '🍕', '🌟', '🐱', '🎧', '🏆'];

interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryMatchGame: React.FC = () => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const deck: MemoryCard[] = [];
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
    // Shuffle
    pairs.sort(() => Math.random() - 0.5);

    pairs.forEach((emoji, idx) => {
      deck.push({
        id: idx,
        emoji,
        isFlipped: false,
        isMatched: false
      });
    });

    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip card
    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const firstCard = newCards.find((c) => c.id === newFlipped[0])!;
      const secondCard = newCards.find((c) => c.id === newFlipped[1])!;

      if (firstCard.emoji === secondCard.emoji) {
        // Matched!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isMatched: true }
                : c
            )
          );
          setFlippedCards([]);
          setMatchedPairs((p) => {
            const nextP = p + 1;
            if (nextP === MEMORY_EMOJIS.length) {
              setIsWon(true);
            }
            return nextP;
          });
        }, 500);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCard.id || c.id === secondCard.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between w-full max-w-sm px-4 py-2 bg-slate-100 rounded-2xl">
        <div className="text-xs font-bold text-slate-700">
          Moves: <span className="text-blue-600 font-extrabold text-sm">{moves}</span>
        </div>
        <div className="text-xs font-bold text-slate-700">
          Matched: <span className="text-emerald-600 font-extrabold text-sm">{matchedPairs}/8</span>
        </div>
        <button
          onClick={initGame}
          className="p-1.5 bg-white text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-2xs"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-2.5 w-full max-w-sm">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.isMatched || card.isFlipped}
            className={`h-20 sm:h-22 rounded-2xl font-bold text-3xl flex items-center justify-center transition-all duration-300 transform ${
              card.isMatched
                ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-800 scale-95 opacity-90'
                : card.isFlipped
                ? 'bg-blue-50 border-2 border-blue-400 rotate-0 shadow-md'
                : 'bg-linear-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md active:scale-95'
            }`}
          >
            {card.isFlipped || card.isMatched ? card.emoji : '❓'}
          </button>
        ))}
      </div>

      {isWon && (
        <div className="w-full max-w-sm p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <div className="text-2xl">🎉 🏆</div>
          <h4 className="font-extrabold text-emerald-800 text-sm">Congratulations! You Won!</h4>
          <p className="text-xs text-emerald-700">You completed the memory challenge in {moves} moves.</p>
          <button
            onClick={initGame}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== 3. TIC-TAC-TOE GAME ====================
const TicTacToeGame: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [mode, setMode] = useState<'ai' | 'friend'>('ai');
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every((s) => s !== null)) {
      return { winner: 'Tie', line: [] };
    }
    return null;
  };

  const winInfo = calculateWinner(board);
  const winner = winInfo?.winner;

  const handleClick = (idx: number) => {
    if (board[idx] || winner) return;

    const newBoard = [...board];
    newBoard[idx] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);

    const winCheck = calculateWinner(newBoard);
    if (winCheck) {
      if (winCheck.winner === 'X') setScores((s) => ({ ...s, x: s.x + 1 }));
      else if (winCheck.winner === 'O') setScores((s) => ({ ...s, o: s.o + 1 }));
      else if (winCheck.winner === 'Tie') setScores((s) => ({ ...s, ties: s.ties + 1 }));
    }
  };

  // Simple AI Bot Move for Player O
  useEffect(() => {
    if (mode === 'ai' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const available = board
          .map((val, idx) => (val === null ? idx : null))
          .filter((v): v is number => v !== null);

        if (available.length > 0) {
          // Check if AI can win immediately or block X
          const pick = available[Math.floor(Math.random() * available.length)];
          const newBoard = [...board];
          newBoard[pick] = 'O';
          setBoard(newBoard);
          setIsXNext(true);

          const winCheck = calculateWinner(newBoard);
          if (winCheck) {
            if (winCheck.winner === 'X') setScores((s) => ({ ...s, x: s.x + 1 }));
            else if (winCheck.winner === 'O') setScores((s) => ({ ...s, o: s.o + 1 }));
            else if (winCheck.winner === 'Tie') setScores((s) => ({ ...s, ties: s.ties + 1 }));
          }
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isXNext, mode, winner, board]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-full max-w-xs">
        <button
          onClick={() => {
            setMode('ai');
            resetGame();
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'ai' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
          }`}
        >
          🤖 vs Smart Bot
        </button>
        <button
          onClick={() => {
            setMode('friend');
            resetGame();
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mode === 'friend' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
          }`}
        >
          👥 2 Players
        </button>
      </div>

      {/* Score Header */}
      <div className="flex items-center justify-around w-full max-w-xs py-2 bg-slate-100 rounded-2xl text-xs font-bold text-slate-700">
        <div className="text-blue-600">Player (X): {scores.x}</div>
        <div className="text-slate-500">Ties: {scores.ties}</div>
        <div className="text-rose-600">{mode === 'ai' ? 'Bot (O)' : 'Player (O)'}: {scores.o}</div>
      </div>

      {/* Status */}
      <div className="text-xs font-bold text-slate-600">
        {winner ? (
          winner === 'Tie' ? (
            <span className="text-slate-700 font-extrabold text-sm">Game Tied! 🤝</span>
          ) : (
            <span className="text-emerald-600 font-extrabold text-sm">Winner: Player {winner}! 🏆</span>
          )
        ) : (
          <span>Next Turn: <strong className={isXNext ? 'text-blue-600' : 'text-rose-600'}>{isXNext ? 'X' : 'O'}</strong></span>
        )}
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2 w-full max-w-xs p-3 bg-slate-200 rounded-3xl">
        {board.map((val, idx) => {
          const isWinningCell = winInfo?.line.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className={`h-24 sm:h-26 rounded-2xl text-3xl font-black flex items-center justify-center transition-all ${
                isWinningCell
                  ? 'bg-emerald-500 text-white shadow-md animate-bounce'
                  : 'bg-white hover:bg-slate-50 text-slate-800 shadow-xs active:scale-95'
              } ${val === 'X' ? 'text-blue-600' : val === 'O' ? 'text-rose-600' : ''}`}
            >
              {val}
            </button>
          );
        })}
      </div>

      <button
        onClick={resetGame}
        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
      >
        <RotateCcw className="w-4 h-4" />
        <span>New Round</span>
      </button>
    </div>
  );
};

// ==================== 4. SPEED BRAIN TRIVIA ====================
const TRIVIA_QUESTIONS = [
  {
    q: 'Which protocol is standard for secure web browsing?',
    options: ['HTTP', 'HTTPS', 'FTP', 'SSH'],
    answer: 1
  },
  {
    q: 'What year was the World Wide Web introduced to the public?',
    options: ['1985', '1991', '1999', '2004'],
    answer: 1
  },
  {
    q: 'Which language runs natively inside every modern web browser?',
    options: ['Python', 'JavaScript', 'C++', 'Java'],
    answer: 1
  },
  {
    q: 'In social networks, what does hashtag (#) primarily serve as?',
    options: ['Password hash', 'Topic indexer & metadata', 'Hidden private key', 'File extension'],
    answer: 1
  },
  {
    q: 'What is the full form of AI?',
    options: ['Automated Interface', 'Artificial Intelligence', 'Algorithmic Integration', 'App Internet'],
    answer: 1
  }
];

const TriviaGame: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = TRIVIA_QUESTIONS[currentIndex];

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === currentQ.answer) {
      setScore((s) => s + 20);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-2xl text-xs font-bold">
        <span className="text-slate-600">Question {currentIndex + 1} of {TRIVIA_QUESTIONS.length}</span>
        <span className="text-blue-600">Score: {score} pts</span>
      </div>

      {!isFinished ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
            {currentQ.q}
          </h3>

          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQ.answer;
              let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-800';

              if (selectedAnswer !== null) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-50 border-rose-500 text-rose-800 font-bold';
                } else {
                  btnStyle = 'border-slate-200 opacity-60 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left p-3 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-all ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {selectedAnswer !== null && (
                    <span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      ) : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <button
              onClick={handleNext}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {currentIndex + 1 < TRIVIA_QUESTIONS.length ? 'Next Question →' : 'View Results'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs space-y-3">
          <div className="text-3xl">🎉</div>
          <h3 className="font-extrabold text-slate-900 text-lg">Quiz Complete!</h3>
          <p className="text-sm text-slate-600">
            You scored <strong className="text-blue-600">{score}</strong> / 100 points
          </p>
          <button
            onClick={restartQuiz}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN GAMES VIEW CONTAINER ====================
export const GamesView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('snake');

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 space-y-6">
      {/* Top Banner */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">Social Games Center</h1>
            <p className="text-xs text-blue-100">Play instant retro &amp; brain games directly on TS Social Book!</p>
          </div>
        </div>
      </div>

      {/* Game Selection Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setSelectedGame('snake')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            selectedGame === 'snake'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-lg mb-1">🐍</div>
          <div className="text-xs font-bold">Retro Snake</div>
          <div className={`text-[10px] ${selectedGame === 'snake' ? 'text-blue-200' : 'text-slate-500'}`}>Arcade Classic</div>
        </button>

        <button
          onClick={() => setSelectedGame('memory')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            selectedGame === 'memory'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-lg mb-1">🧠</div>
          <div className="text-xs font-bold">Memory Match</div>
          <div className={`text-[10px] ${selectedGame === 'memory' ? 'text-blue-200' : 'text-slate-500'}`}>Card Pairs</div>
        </button>

        <button
          onClick={() => setSelectedGame('tictactoe')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            selectedGame === 'tictactoe'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-lg mb-1">❌⭕</div>
          <div className="text-xs font-bold">Tic-Tac-Toe</div>
          <div className={`text-[10px] ${selectedGame === 'tictactoe' ? 'text-blue-200' : 'text-slate-500'}`}>AI &amp; 2-Player</div>
        </button>

        <button
          onClick={() => setSelectedGame('trivia')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            selectedGame === 'trivia'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}
        >
          <div className="text-lg mb-1">⚡</div>
          <div className="text-xs font-bold">Speed Trivia</div>
          <div className={`text-[10px] ${selectedGame === 'trivia' ? 'text-blue-200' : 'text-slate-500'}`}>Brain Challenge</div>
        </button>
      </div>

      {/* Selected Game Playground Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-8">
        {selectedGame === 'snake' && <SnakeGame />}
        {selectedGame === 'memory' && <MemoryMatchGame />}
        {selectedGame === 'tictactoe' && <TicTacToeGame />}
        {selectedGame === 'trivia' && <TriviaGame />}
      </div>
    </div>
  );
};
