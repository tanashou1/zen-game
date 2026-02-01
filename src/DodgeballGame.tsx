import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  caught: boolean;
  owner: 'player' | 'opponent' | null;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const COURT_DIVIDER = CANVAS_HEIGHT / 2;
const BALL_RADIUS = 15;
const DEFAULT_BALL_SPEED = 5;
const PLAYER_WIDTH = 30;

export const DodgeballGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [_balls, setBalls] = useState<Ball[]>([]);
  const [_score, setScore] = useState({ player: 0, opponent: 0 });
  const scoreRef = useRef({ player: 0, opponent: 0 });
  const [caughtBall, setCaughtBall] = useState<Ball | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [playerX, setPlayerX] = useState(CANVAS_WIDTH / 2);
  const opponentXRef = useRef(CANVAS_WIDTH / 2);
  const [ballSpeed, setBallSpeed] = useState(DEFAULT_BALL_SPEED);
  const ballIdRef = useRef(0);
  const gameLoopRef = useRef<number | undefined>(undefined);

  // Spawn opponent ball
  const spawnOpponentBall = useCallback(() => {
    const newBall: Ball = {
      id: ballIdRef.current++,
      x: Math.random() * (CANVAS_WIDTH - BALL_RADIUS * 2) + BALL_RADIUS,
      y: BALL_RADIUS,
      vx: (Math.random() - 0.5) * 2,
      vy: ballSpeed,
      radius: BALL_RADIUS,
      caught: false,
      owner: 'opponent',
    };
    setBalls((prev) => [...prev, newBall]);
  }, [ballSpeed]);

  // Initialize game
  useEffect(() => {
    // Spawn balls periodically
    const interval = setInterval(() => {
      spawnOpponentBall();
    }, 2000);

    return () => clearInterval(interval);
  }, [spawnOpponentBall]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw court divider
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, COURT_DIVIDER);
      ctx.lineTo(CANVAS_WIDTH, COURT_DIVIDER);
      ctx.stroke();

      // Draw court labels
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('相手コート', CANVAS_WIDTH / 2, 30);
      ctx.fillText('自分のコート', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

      // Update balls
      setBalls((currentBalls) => {
        const updatedBalls = currentBalls
          .map((ball) => {
            if (ball.caught) return ball;

            // Update position
            const newX = ball.x + ball.vx;
            const newY = ball.y + ball.vy;

            // Wall collision
            let newVx = ball.vx;
            if (newX - ball.radius < 0 || newX + ball.radius > CANVAS_WIDTH) {
              newVx = -ball.vx;
            }

            // Check if ball goes out of bounds
            if (newY - ball.radius > CANVAS_HEIGHT) {
              // Opponent scores
              if (ball.owner === 'opponent') {
                setScore((prev) => {
                  const newScore = { ...prev, opponent: prev.opponent + 1 };
                  scoreRef.current = newScore;
                  return newScore;
                });
              }
              return null;
            }

            if (newY + ball.radius < 0) {
              // Player scores
              if (ball.owner === 'player') {
                setScore((prev) => {
                  const newScore = { ...prev, player: prev.player + 1 };
                  scoreRef.current = newScore;
                  return newScore;
                });
              }
              return null;
            }

            return {
              ...ball,
              x: newX - ball.radius < 0 ? ball.radius : newX + ball.radius > CANVAS_WIDTH ? CANVAS_WIDTH - ball.radius : newX,
              y: newY,
              vx: newVx,
            };
          })
          .filter((ball): ball is Ball => ball !== null);

        // Draw balls
        updatedBalls.forEach((ball) => {
          ctx.fillStyle = ball.owner === 'player' ? '#4CAF50' : '#F44336';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.fill();

          if (ball.caught) {
            ctx.strokeStyle = '#FFEB3B';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        });

        // Simple opponent AI: move towards incoming balls
        const opponentCourtBalls = updatedBalls.filter(
          (ball) => ball.y < COURT_DIVIDER && ball.owner === 'player'
        );
        if (opponentCourtBalls.length > 0) {
          const closestBall = opponentCourtBalls.reduce((closest, ball) => 
            ball.y < closest.y ? ball : closest
          );
          const dx = closestBall.x - opponentXRef.current;
          const newOpponentX = opponentXRef.current + Math.sign(dx) * Math.min(Math.abs(dx), 3);
          opponentXRef.current = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, newOpponentX));
        } else {
          // Move randomly when no balls are coming
          if (Math.random() < 0.02) {
            const randomMove = (Math.random() - 0.5) * 10;
            const newOpponentX = opponentXRef.current + randomMove;
            opponentXRef.current = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, newOpponentX));
          }
        }

        return updatedBalls;
      });

      // Draw player (human figure at bottom)
      const playerY = CANVAS_HEIGHT - 60;
      
      // Head
      ctx.fillStyle = '#61dafb';
      ctx.beginPath();
      ctx.arc(playerX, playerY, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      ctx.strokeStyle = '#61dafb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerX, playerY + 12);
      ctx.lineTo(playerX, playerY + 30);
      ctx.stroke();
      
      // Arms
      ctx.beginPath();
      ctx.moveTo(playerX - 15, playerY + 20);
      ctx.lineTo(playerX, playerY + 15);
      ctx.lineTo(playerX + 15, playerY + 20);
      ctx.stroke();
      
      // Legs
      ctx.beginPath();
      ctx.moveTo(playerX, playerY + 30);
      ctx.lineTo(playerX - 10, playerY + 45);
      ctx.moveTo(playerX, playerY + 30);
      ctx.lineTo(playerX + 10, playerY + 45);
      ctx.stroke();

      // Draw opponent (human figure at top)
      const opponentY = 60;
      
      // Head
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(opponentXRef.current, opponentY, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(opponentXRef.current, opponentY + 12);
      ctx.lineTo(opponentXRef.current, opponentY + 30);
      ctx.stroke();
      
      // Arms
      ctx.beginPath();
      ctx.moveTo(opponentXRef.current - 15, opponentY + 20);
      ctx.lineTo(opponentXRef.current, opponentY + 15);
      ctx.lineTo(opponentXRef.current + 15, opponentY + 20);
      ctx.stroke();
      
      // Legs
      ctx.beginPath();
      ctx.moveTo(opponentXRef.current, opponentY + 30);
      ctx.lineTo(opponentXRef.current - 10, opponentY + 45);
      ctx.moveTo(opponentXRef.current, opponentY + 30);
      ctx.lineTo(opponentXRef.current + 10, opponentY + 45);
      ctx.stroke();

      // Draw score
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`相手: ${scoreRef.current.opponent}`, 10, 60);
      ctx.fillText(`自分: ${scoreRef.current.player}`, 10, CANVAS_HEIGHT - 40);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [playerX]);

  // Handle tap to catch
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update player position with bounds checking
    const boundedX = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, x));
    setPlayerX(boundedX);

    // Check if clicking on a ball in player's court
    setBalls((currentBalls) => {
      let caught = false;
      const updatedBalls = currentBalls.map((ball) => {
        if (
          !ball.caught &&
          ball.y > COURT_DIVIDER &&
          ball.owner === 'opponent' &&
          Math.hypot(ball.x - x, ball.y - y) < ball.radius
        ) {
          caught = true;
          const caughtBall = { ...ball, caught: true, vx: 0, vy: 0 };
          setCaughtBall(caughtBall);
          return caughtBall;
        }
        return ball;
      });

      if (caught) {
        return updatedBalls;
      }
      return currentBalls;
    });

    setTouchStart({ x, y });
  };

  // Handle swipe to throw
  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!caughtBall || !touchStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - touchStart.x;
    const dy = y - touchStart.y;
    const distance = Math.hypot(dx, dy);

    // Throw if swipe distance is sufficient
    if (distance > 20) {
      setBalls((currentBalls) =>
        currentBalls.map((ball) => {
          if (ball.id === caughtBall.id) {
            const speed = Math.min(distance / 10, 10);
            return {
              ...ball,
              caught: false,
              owner: 'player',
              vx: (dx / distance) * speed * 0.5,
              vy: (dy / distance) * speed,
            };
          }
          return ball;
        })
      );
      setCaughtBall(null);
    }

    setTouchStart(null);
  };

  // Handle mouse move to update player position
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Keep player within canvas bounds
    const boundedX = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, x));
    setPlayerX(boundedX);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Update player position with bounds checking
    const boundedX = Math.max(PLAYER_WIDTH / 2, Math.min(CANVAS_WIDTH - PLAYER_WIDTH / 2, x));
    setPlayerX(boundedX);

    // Check if touching a ball in player's court
    setBalls((currentBalls) => {
      let caught = false;
      const updatedBalls = currentBalls.map((ball) => {
        if (
          !ball.caught &&
          ball.y > COURT_DIVIDER &&
          ball.owner === 'opponent' &&
          Math.hypot(ball.x - x, ball.y - y) < ball.radius
        ) {
          caught = true;
          const caughtBall = { ...ball, caught: true, vx: 0, vy: 0 };
          setCaughtBall(caughtBall);
          return caughtBall;
        }
        return ball;
      });

      if (caught) {
        return updatedBalls;
      }
      return currentBalls;
    });

    setTouchStart({ x, y });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!caughtBall || !touchStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const dx = x - touchStart.x;
    const dy = y - touchStart.y;
    const distance = Math.hypot(dx, dy);

    // Throw if swipe distance is sufficient
    if (distance > 20) {
      setBalls((currentBalls) =>
        currentBalls.map((ball) => {
          if (ball.id === caughtBall.id) {
            const speed = Math.min(distance / 10, 10);
            return {
              ...ball,
              caught: false,
              owner: 'player',
              vx: (dx / distance) * speed * 0.5,
              vy: (dy / distance) * speed,
            };
          }
          return ball;
        })
      );
      setCaughtBall(null);
    }

    setTouchStart(null);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#282c34',
      minHeight: '100vh',
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>ドッジボールゲーム</h1>
      <div style={{ marginBottom: '10px', color: 'white' }}>
        <p>タップでボールをキャッチ！</p>
        <p>スワイプで投げ返す！</p>
      </div>
      <div style={{ 
        marginBottom: '15px', 
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <label htmlFor="speed-slider" style={{ fontSize: '16px' }}>
          ボールの速度: {ballSpeed.toFixed(1)}
        </label>
        <input
          id="speed-slider"
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={ballSpeed}
          onChange={(e) => setBallSpeed(parseFloat(e.target.value))}
          style={{ width: '300px', cursor: 'pointer' }}
        />
        <div style={{ fontSize: '14px', color: '#aaa' }}>
          遅い ← → 速い
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          border: '2px solid #61dafb',
          backgroundColor: '#1a1a1a',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
