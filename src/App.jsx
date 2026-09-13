import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const wordPool = ["REACT18", "CODE99", "VITE5", "NODEJS", "HTML5", "CSS3", "JAVA8", "BYTE20", "DATA404", "BASE64"];
const colorPool = ["#38bdf8", "#facc15", "#f43f5e", "#22c55e", "#a855f7", "#ec4899", "#fb923c", "#2dd4bf"];

function App() {
  const getRandomWord = () => wordPool[Math.floor(Math.random() * wordPool.length)];
  const getRandomColor = () => colorPool[Math.floor(Math.random() * colorPool.length)];

  const [leftWord, setLeftWord] = useState("REACT18");
  const [leftFilled, setLeftFilled] = useState(Array(7).fill(false));

  const [rightWord, setRightWord] = useState("CODE99");
  const [rightFilled, setRightFilled] = useState(Array(6).fill(false));

  const [totalCompletedWords, setTotalCompletedWords] = useState(0);
  const [garbageCount, setGarbageCount] = useState(0);
  const [maxMatches, setMaxMatches] = useState(0);

  const [currentItem, setCurrentItem] = useState('R');
  const [itemColor, setItemColor] = useState('#38bdf8');

  const [pos, setPos] = useState({ x: 200, y: 80 });
  const [vel, setVel] = useState({ x: 2, y: 1.5 });

  const [feedbackEmoji, setFeedbackEmoji] = useState('🎮');
  const [message, setMessage] = useState('Balanced drop: Mostly matching letters with some garbage items!');

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const arenaRef = useRef(null);

  // Balanced Smart Generator: 70% matching items from words, 30% random garbage items
  const getBalancedItem = useCallback(() => {
    const leftNeeded = leftWord.split('').filter((_, idx) => !leftFilled[idx]);
    const rightNeeded = rightWord.split('').filter((_, idx) => !rightFilled[idx]);
    const allNeeded = [...leftNeeded, ...rightNeeded];

    const randomChance = Math.random();

    if (randomChance < 0.7 && allNeeded.length > 0) {
      return allNeeded[Math.floor(Math.random() * allNeeded.length)];
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return chars[Math.floor(Math.random() * chars.length)];
  }, [leftWord, leftFilled, rightWord, rightFilled]);

  const spawnNewItem = useCallback(() => {
    setCurrentItem(getBalancedItem());
    setItemColor(getRandomColor());
    setPos({ x: 150 + Math.random() * 150, y: 50 + Math.random() * 60 });
    setVel({
      x: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random()),
      y: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random())
    });
  }, [getBalancedItem]);

  useEffect(() => {
    spawnNewItem();
  }, [spawnNewItem]);

  // Timer counter
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Bouncing Physics Loop
  useEffect(() => {
    if (isPaused) return;
    let animationFrameId;
    const updatePhysics = () => {
      if (arenaRef.current) {
        const arenaWidth = arenaRef.current.clientWidth || 600;
        const arenaHeight = arenaRef.current.clientHeight || 250;
        const itemSize = 70;

        setPos(prev => {
          let nx = prev.x + vel.x;
          let ny = prev.y + vel.y;
          let nvx = vel.x;
          let nvy = vel.y;

          if (nx <= 10 || nx >= arenaWidth - itemSize) {
            nvx = -vel.x;
            nx = Math.max(10, Math.min(nx, arenaWidth - itemSize));
          }
          if (ny <= 10 || ny >= arenaHeight - itemSize) {
            nvy = -vel.y;
            ny = Math.max(10, Math.min(ny, arenaHeight - itemSize));
          }

          if (nvx !== vel.x || nvy !== vel.y) {
            setVel({ x: nvx, y: nvy });
          }

          return { x: nx, y: ny };
        });
      }
      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [vel, isPaused]);

  const handleGarbageClick = () => {
    if (isPaused) return;
    const canMatchLeft = leftWord.split('').some((char, idx) => char === currentItem && !leftFilled[idx]);
    const canMatchRight = rightWord.split('').some((char, idx) => char === currentItem && !rightFilled[idx]);

    if (!canMatchLeft && !canMatchRight) {
      setGarbageCount(prev => prev + 1);
      setFeedbackEmoji('🗑️ Trashed');
      setMessage(`Unmatched item '${currentItem}' successfully sent to Garbage!`);
      const updatedScore = score + 15;
      setScore(updatedScore);
      if (updatedScore > highScore) setHighScore(updatedScore);
      spawnNewItem();
    } else {
      setFeedbackEmoji('⚠️ WARNING');
      setMessage(`Cannot trash '${currentItem}'! It matches an empty slot in your target words.`);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleBoxClick = (side) => {
    if (isPaused) return;
    const word = side === 'left' ? leftWord : rightWord;
    const filled = side === 'left' ? leftFilled : rightFilled;

    const targetIndex = word.split('').findIndex((char, idx) => char === currentItem && !filled[idx]);

    if (targetIndex !== -1) {
      const newFilled = [...filled];
      newFilled[targetIndex] = true;

      setMaxMatches(prev => prev + 1);
      const isComplete = newFilled.every(Boolean);

      if (isComplete) {
        setTotalCompletedWords(prev => prev + 1);
        const updatedScore = score + 200;
        setScore(updatedScore);
        if (updatedScore > highScore) setHighScore(updatedScore);
        setFeedbackEmoji('🎉 Word Completed!');

        const newWord = getRandomWord();
        if (side === 'left') {
          setLeftWord(newWord);
          setLeftFilled(Array(newWord.length).fill(false));
          setMessage(`Left word completed! New word '${newWord}' loaded.`);
        } else {
          setRightWord(newWord);
          setRightFilled(Array(newWord.length).fill(false));
          setMessage(`Right word completed! New word '${newWord}' loaded.`);
        }
      } else {
        if (side === 'left') setLeftFilled(newFilled);
        else setRightFilled(newFilled);

        const updatedScore = score + 35;
        setScore(updatedScore);
        if (updatedScore > highScore) setHighScore(updatedScore);

        setFeedbackEmoji('🔥 Perfect Match!');
        setMessage(`Matched '${currentItem}' in ${side.toUpperCase()} box at position ${targetIndex + 1}!`);
      }

      spawnNewItem();
    } else {
      setFeedbackEmoji('😢 Sad / Wrong');
      setMessage(`Item '${currentItem}' does not match here. Use Garbage Box for unmatched items!`);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleReset = () => {
    setLeftWord("REACT18");
    setLeftFilled(Array(7).fill(false));
    setRightWord("CODE99");
    setRightFilled(Array(6).fill(false));
    setTotalCompletedWords(0);
    setGarbageCount(0);
    setMaxMatches(0);
    setScore(0);
    setSecondsElapsed(0);
    setIsPaused(false);
    setFeedbackEmoji('🔄 Reset');
    setMessage('Game has been reset. Balanced drop active!');
    spawnNewItem();
  };

  return (
    <div className="main-layout-container">

      <div className="side-panel-left">
        <div className="left-content-top">
          <h4>💬 Status</h4>
          <div className="status-badge">{feedbackEmoji}</div>
          <p className="status-instruction">{message}</p>

          <div className="instruction-box">
            <h4>📖 How to Play</h4>
            <ul>
              <li><strong>Balanced Drop:</strong> Mostly matching items with some random garbage.</li>
              <li><strong>Match:</strong> Click box if item fits an empty slot.</li>
              <li><strong>Garbage:</strong> Use garbage for unmatched items (+15 pts).</li>
              <li><strong>Goal:</strong> Clear words and score high!</li>
            </ul>
          </div>
        </div>

        {/* Copyright Section with Portfolio Link on Er Rohit */}
        <div className="copyright-box">
          <p>
            © 2026{' '}
            <a href="https://er-rohit.freedev.app/?i=1" target="_blank" rel="noopener noreferrer" className="portfolio-link">
              Er Rohit
            </a>
            . All rights reserved.
          </p>
          <span className="lang-tags">Built with JavaScript, React, HTML5, CSS3 & Node.js</span>
        </div>
      </div>

      <div className="game-container">
        <header className="game-header">
          <h1>Balanced Item Match Game</h1>
          <button className="reset-btn" onClick={handleReset}>🔄 Reset</button>
        </header>

        <div
          className="game-arena-wide"
          ref={arenaRef}
          style={{ borderColor: itemColor, boxShadow: `0 -5px 25px ${itemColor}44` }}
        >
          {isPaused && (
            <div className="pause-overlay">
              <h2>⏸️ GAME PAUSED</h2>
            </div>
          )}
          <div
            className="bouncing-rotating-letter"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              color: itemColor,
              textShadow: `0 0 20px ${itemColor}`
            }}
          >
            {currentItem}
          </div>
        </div>
      </div>

      <div className="side-panel-right">
        <div className="dancing-toy-top">🧸 🪩 ✨</div>
        <h4>📊 Stats</h4>

        <button
          className={`pause-btn ${isPaused ? 'resume' : 'pause'}`}
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? '▶️ Continue' : '⏸️ Pause'}
        </button>

        <div className="stat-card">
          <p className="stat-label">Max Matches</p>
          <p className="stat-value">{maxMatches}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Score</p>
          <p className="stat-value">{score}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High Score</p>
          <p className="stat-value high-score">{highScore}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Time</p>
          <p className="stat-value timer">{formatTime(secondsElapsed)}</p>
        </div>
      </div>

      <button className="garbage-button-overlap" onClick={handleGarbageClick}>
        🗑️ Garbage Box: <span>{garbageCount}</span>
      </button>

      <div className="footer-container">
        <div className="footer-boxes-container">

          <div className="word-box-container" onClick={() => handleBoxClick('left')}>
            <div className="box-header">
              <h3>Target: {leftWord}</h3>
            </div>
            <div className="word-slots">
              {leftWord.split('').map((char, idx) => (
                <span key={idx} className={`slot ${leftFilled[idx] ? 'filled' : ''}`}>
                  {leftFilled[idx] ? char : '_'}
                </span>
              ))}
            </div>
            <button className="action-btn left-btn">Click to Match Left</button>
          </div>

          <div className="word-box-container" onClick={() => handleBoxClick('right')}>
            <div className="box-header">
              <h3>Target: {rightWord}</h3>
            </div>
            <div className="word-slots">
              {rightWord.split('').map((char, idx) => (
                <span key={idx} className={`slot ${rightFilled[idx] ? 'filled' : ''}`}>
                  {rightFilled[idx] ? char : '_'}
                </span>
              ))}
            </div>
            <button className="action-btn right-btn">Click to Match Right</button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default App;