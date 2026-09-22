import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import logoImg from './assets/logo.png'; // Ensure your logo is placed at src/assets/logo.png

const wordPool = [
  "REACT18", "CODE99", "VITE5", "NODEJS", "HTML5", 
  "CSS3", "JAVA8", "BYTE20", "DATA404", "BASE64", 
  "PYTHON", "TYPESCRIPT", "MONGODB", "GITHUB", "LINUX", 
  "DOCKER", "API99", "EXPRESS", "REDUX", "FIREBASE"
];

const colorPool = ["#38bdf8", "#facc15", "#f43f5e", "#22c55e", "#a855f7", "#ec4899", "#fb923c", "#2dd4bf"];

function App() {
  const getRandomWord = () => wordPool[Math.floor(Math.random() * wordPool.length)];
  const getRandomColor = () => colorPool[Math.floor(Math.random() * colorPool.length)];

  const [difficulty, setDifficulty] = useState('easy');

  const [boxes, setBoxes] = useState([
    { id: 'left', word: "REACT18", filled: Array(7).fill(false) },
    { id: 'right', word: "CODE99", filled: Array(6).fill(false) }
  ]);

  const [totalCompletedWords, setTotalCompletedWords] = useState(0);
  const [garbageCount, setGarbageCount] = useState(0);
  const [maxMatches, setMaxMatches] = useState(0);

  const [currentItem, setCurrentItem] = useState('R');
  const [itemColor, setItemColor] = useState('#38bdf8');
  
  const [pos, setPos] = useState({ x: 200, y: 80 });
  const [vel, setVel] = useState({ x: 2, y: 1.5 });

  const [feedbackEmoji, setFeedbackEmoji] = useState('🎮');
  const [message, setMessage] = useState('Match the correct letter to proceed!');

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const arenaRef = useRef(null);

  const handleDifficultyChange = (level) => {
    setDifficulty(level);
    let count = 2;
    if (level === 'normal') count = 3;
    if (level === 'hard') count = 4;

    const newBoxes = [];
    const ids = ['left', 'center-left', 'center-right', 'right'];
    for (let i = 0; i < count; i++) {
      const w = getRandomWord();
      newBoxes.push({
        id: ids[i],
        word: w,
        filled: Array(w.length).fill(false)
      });
    }
    setBoxes(newBoxes);
    setMessage(`Difficulty set to ${level.toUpperCase()}! Find the matching box.`);
    spawnNewItem();
  };

  const getBalancedItem = useCallback(() => {
    let allNeeded = [];
    boxes.forEach(box => {
      const needed = box.word.split('').filter((_, idx) => !box.filled[idx]);
      allNeeded = [...allNeeded, ...needed];
    });

    const randomChance = Math.random();
    if (randomChance < 0.7 && allNeeded.length > 0) {
      return allNeeded[Math.floor(Math.random() * allNeeded.length)];
    }

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return chars[Math.floor(Math.random() * chars.length)];
  }, [boxes]);

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
    const canMatchAny = boxes.some(box => 
      box.word.split('').some((char, idx) => char === currentItem && !box.filled[idx])
    );

    if (!canMatchAny) {
      setGarbageCount(prev => prev + 1);
      setFeedbackEmoji('🗑️ Trashed');
      setMessage(`Unmatched item '${currentItem}' sent to Garbage! Next item incoming.`);
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

  const handleBoxClick = (boxId) => {
    if (isPaused) return;

    const clickedBox = boxes.find(b => b.id === boxId);
    if (!clickedBox) return;

    const targetIndex = clickedBox.word.split('').findIndex((char, idx) => char === currentItem && !clickedBox.filled[idx]);

    if (targetIndex !== -1) {
      setBoxes(prevBoxes => {
        return prevBoxes.map(box => {
          if (box.id !== boxId) return box;

          const newFilled = [...box.filled];
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
            setMessage(`Word completed! New word '${newWord}' loaded.`);
            return { ...box, word: newWord, filled: Array(newWord.length).fill(false) };
          } else {
            const updatedScore = score + 35;
            setScore(updatedScore);
            if (updatedScore > highScore) setHighScore(updatedScore);
            setFeedbackEmoji('🔥 Perfect Match!');
            setMessage(`Matched '${currentItem}' successfully!`);
            return { ...box, filled: newFilled };
          }
        });
      });

      spawnNewItem();
    } else {
      setFeedbackEmoji('❌ Wrong Click');
      setMessage(`Warning: '${currentItem}' does not exist or has no empty slot in this box! Letter keeps bouncing.`);
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const handleReset = () => {
    handleDifficultyChange(difficulty);
    setTotalCompletedWords(0);
    setGarbageCount(0);
    setMaxMatches(0);
    setScore(0);
    setSecondsElapsed(0);
    setIsPaused(false);
    setFeedbackEmoji('🔄 Reset');
  };

  return (
    <div className="main-layout-container">
      
      {/* LEFT SIDE PANEL */}
      <div className="side-panel-left">
        <div className="left-content-top">
          <h4>💬 Status</h4>
          <div className="status-badge">{feedbackEmoji}</div>
          <p className="status-instruction">{message}</p>
          
          <div className="instruction-box">
            <h4>📖 How to Play</h4>
            <ul>
              <li><strong>Bouncing:</strong> Letter stays until correct click.</li>
              <li><strong>Strict Match:</strong> Wrong box keeps letter bouncing & warns.</li>
              <li><strong>Garbage:</strong> Discard unmatched items.</li>
              <li><strong>Goal:</strong> Complete words & score high!</li>
            </ul>
          </div>
        </div>

        <div className="copyright-box">
          <p>© 2026 Er Rohit. All rights reserved.</p>
          <span className="lang-tags">Built with JavaScript, React, HTML5, CSS3 & Node.js</span>
        </div>
      </div>

      {/* CENTER GAME ARENA */}
      <div className="game-container">
        <header className="game-header">
          <h1>Smart Item Match Game ({difficulty.toUpperCase()})</h1>
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

      {/* RIGHT SIDE PANEL WITH 3D ROTATING LOGO */}
      <div className="side-panel-right">
        <div className="rotating-logo-container">
          <img src={logoImg} alt="Logo" className="rotating-logo-img" />
        </div>
        <h4>📊 Stats & Level</h4>
        
        <div className="difficulty-container">
          <button 
            className={`diff-btn ${difficulty === 'easy' ? 'active' : ''}`} 
            onClick={() => handleDifficultyChange('easy')}
          >
            Easy (2)
          </button>
          <button 
            className={`diff-btn ${difficulty === 'normal' ? 'active' : ''}`} 
            onClick={() => handleDifficultyChange('normal')}
          >
            Normal (3)
          </button>
          <button 
            className={`diff-btn ${difficulty === 'hard' ? 'active' : ''}`} 
            onClick={() => handleDifficultyChange('hard')}
          >
            Hard (4)
          </button>
        </div>

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

      {/* GARBAGE BOX POSITIONED BETWEEN ARENA AND FOOTER */}
      <button className="garbage-button-overlap" onClick={handleGarbageClick}>
        🗑️ Garbage Box: <span>{garbageCount}</span>
      </button>

      {/* FOOTER CONTAINER */}
      <div className="footer-container">
        <div className="footer-boxes-container">
          {boxes.map((box) => (
            <div key={box.id} className="word-box-container" onClick={() => handleBoxClick(box.id)}>
              <div className="box-header">
                <h3>Target: <strong>{box.word}</strong></h3>
              </div>
              <div className="word-slots">
                {box.word.split('').map((char, idx) => (
                  <span key={idx} className={`slot ${box.filled[idx] ? 'filled' : ''}`}>
                    {box.filled[idx] ? <strong>{char}</strong> : '_'}
                  </span>
                ))}
              </div>
              <button className="action-btn match-btn">Click to Match</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;