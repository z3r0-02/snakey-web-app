"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { THEMES } from "@/lib/achievements";

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 600px
const MIN_TICK_MS = 140;
const START_TICK_MS = 180;

const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Colors
const COLORS = {
  bg: "#0d1117",
  grid: "#161b22",
  snakeHead: "#4ade80",
  snakeBody: "#22c55e",
  snakeTail: "#16a34a",
  food: "#f59e0b",
  foodGlow: "rgba(245, 158, 11, 0.3)",
  specialFood: "#ef4444",
  specialFoodGlow: "rgba(239, 68, 68, 0.4)",
  eye: "#0d1117",
  wall: "#3b82f6", // vibrant blue
  wallBorder: "#1e3a8a", // dark blue border
};

// Seeded PRNG
function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailySeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = Math.imul(31, hash) + dateStr.charCodeAt(i) | 0;
  }
  return hash;
}

function generateDailyWalls(dateStr) {
  const seed = getDailySeed(dateStr);
  const rand = mulberry32(seed);

  const shapes = [
    // Family 0: 5-block Lines (max 2)
    { family: 0, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }] }, // 5-horiz
    { family: 0, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }] }, // 5-vert

    // Family 1: 9-block Great Walls (max 2)
    { family: 1, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }] }, // 9-horiz
    { family: 1, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 }, { x: 0, y: 8 }] }, // 9-vert

    // Family 2: 4-block L's (max 1)
    { family: 2, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }] }, // ╗
    { family: 2, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }] }, // ╔
    { family: 2, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] }, // ╚
    { family: 2, blocks: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] }, // ╝

    // Family 3: Crosses (max 2)
    { family: 3, blocks: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }] }, // Plus
    { family: 3, blocks: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }] }, // Plus (Dup)

    // Family 5: 3x3 Giant L's (max 2)
    { family: 5, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }] }, // ╔
    { family: 5, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }] }, // ╗
    { family: 5, blocks: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }] }, // ╝
    { family: 5, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }] }, // ╚

    // Family 6: 4x4 Colossal L's (max 2)
    { family: 6, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] }, // ╔
    { family: 6, blocks: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }] }, // ╗
    { family: 6, blocks: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }] }, // ╝
    { family: 6, blocks: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }] }, // ╚
  ];

  const walls = [];
  const familyCounts = new Array(7).fill(0);
  const targetBlocks = 50;

  // Safe zone for snake start
  const isSafeZone = (x, y) => {
    return x >= 1 && x <= 9 && y >= 8 && y <= 12;
  };

  let attempts = 0;
  const maxAttempts = 2000;

  while (walls.length < targetBlocks && attempts < maxAttempts) {
    attempts++;
    const shapeIndex = Math.floor(rand() * shapes.length);
    const shapeDef = shapes[shapeIndex];
    const familyIndex = shapeDef.family;
    const shape = shapeDef.blocks;
    
    // Rule: Max 2 of the same shape family
    if (familyCounts[familyIndex] >= 2) continue;
    
    // Rule: Max 1 total 4-block wall (Family 2)
    if (familyIndex === 2 && familyCounts[2] >= 1) continue;

    // Random offset, avoiding the very edges since we need a 1-block boundary
    const ox = Math.floor(rand() * (GRID_SIZE - 4)) + 1;
    const oy = Math.floor(rand() * (GRID_SIZE - 4)) + 1;

    let shapeValid = true;
    let newCluster = [];
    for (let pt of shape) {
      const nx = ox + pt.x;
      const ny = oy + pt.y;
      
      // Must be inside grid with 1-block playable border, and outside safe zone
      if (nx < 1 || nx >= GRID_SIZE - 1 || ny < 1 || ny >= GRID_SIZE - 1 || isSafeZone(nx, ny)) {
        shapeValid = false;
        break;
      }
      
      // Enforce 3-block radius from all previously placed walls
      const isTooClose = walls.some(
        (w) => Math.abs(w.x - nx) <= 3 && Math.abs(w.y - ny) <= 3
      );
      
      if (isTooClose) {
        shapeValid = false;
        break;
      }
      newCluster.push({ x: nx, y: ny });
    }

    if (shapeValid) {
      familyCounts[familyIndex]++;
      newCluster.forEach((w) => walls.push(w));
    }
  }

  return walls;
}

function getRandomFood(snake, walls, otherFood = null) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    snake.some((s) => s.x === pos.x && s.y === pos.y) ||
    walls.some((w) => w.x === pos.x && w.y === pos.y) ||
    (otherFood && otherFood.x === pos.x && otherFood.y === pos.y)
  );
  return pos;
}

export default function SnakeGame({ onGameOver, disabled, globalDateStr, themeId }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const directionRef = useRef(DIRECTION.RIGHT);
  const nextDirectionRef = useRef(DIRECTION.RIGHT);
  const snakeRef = useRef([
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ]);
  const wallsRef = useRef([]); // Will be populated on mount
  const foodRef = useRef({ x: 15, y: 10 });
  const specialFoodRef = useRef(null); // { x, y, expiresAt }
  const tickMsRef = useRef(START_TICK_MS);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("idle"); // idle | starting | playing | over
  const [countdown, setCountdown] = useState(null);
  const gameStateRef = useRef("idle");
  const themeRef = useRef(themeId);

  useEffect(() => {
    themeRef.current = themeId;
  }, [themeId]);

  // Draw the game
  const draw = useCallback((isSnakeVisible = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food glow
    const food = foodRef.current;
    const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
    const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
    const gradient = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL_SIZE * 1.5);
    gradient.addColorStop(0, COLORS.foodGlow);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(
      fx - CELL_SIZE * 1.5,
      fy - CELL_SIZE * 1.5,
      CELL_SIZE * 3,
      CELL_SIZE * 3
    );

    // Food
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.roundRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      4
    );
    ctx.fill();

    // Special Food
    const sFood = specialFoodRef.current;
    if (sFood) {
      const now = Date.now();
      
      // Constant, slightly faster pulsing blink
      const pulse = (Math.sin(now / 100) + 1) / 2; // 0 to 1
      const alpha = 0.2 + pulse * 0.8;

      ctx.globalAlpha = alpha;

      const sfx = sFood.x * CELL_SIZE + CELL_SIZE / 2;
      const sfy = sFood.y * CELL_SIZE + CELL_SIZE / 2;
      const sGradient = ctx.createRadialGradient(sfx, sfy, 2, sfx, sfy, CELL_SIZE * 1.5);
      sGradient.addColorStop(0, COLORS.specialFoodGlow);
      sGradient.addColorStop(1, "transparent");
      ctx.fillStyle = sGradient;
      ctx.fillRect(
        sfx - CELL_SIZE * 1.5,
        sfy - CELL_SIZE * 1.5,
        CELL_SIZE * 3,
        CELL_SIZE * 3
      );

      // Reset alpha so the solid block doesn't blink
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = COLORS.specialFood;
      ctx.beginPath();
      ctx.roundRect(
        sFood.x * CELL_SIZE + 2,
        sFood.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4,
        4
      );
      ctx.fill();
    }

    // Walls
    const walls = wallsRef.current;
    if (walls.length > 0) {
      ctx.fillStyle = COLORS.wall;
      ctx.strokeStyle = COLORS.wallBorder;
      ctx.lineWidth = 2;
      walls.forEach((w) => {
        ctx.beginPath();
        ctx.roundRect(
          w.x * CELL_SIZE + 1,
          w.y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2,
          4
        );
        ctx.fill();
        ctx.stroke();
      });
    }

    // Snake
    if (isSnakeVisible) {
      const activeTheme = THEMES[themeRef.current] || THEMES.default;
      const snake = snakeRef.current;
      snake.forEach((segment, i) => {
        const progress = i / snake.length;
        
        let fillColor = activeTheme.head;
        if (i > 0) {
          if (activeTheme.pattern === "zebra") {
            fillColor = i % 2 === 0 ? activeTheme.head : activeTheme.body;
          } else {
            fillColor = progress < 0.5 ? activeTheme.body : (activeTheme.tail || activeTheme.body);
          }
        }

        if (activeTheme.glow && i % 2 === 0) {
          const glowGrad = ctx.createRadialGradient(
            segment.x * CELL_SIZE + CELL_SIZE / 2, segment.y * CELL_SIZE + CELL_SIZE / 2, 2,
            segment.x * CELL_SIZE + CELL_SIZE / 2, segment.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE * 1.5
          );
          glowGrad.addColorStop(0, fillColor + "66"); 
          glowGrad.addColorStop(1, "transparent");
          ctx.fillStyle = glowGrad;
          ctx.fillRect(segment.x * CELL_SIZE - CELL_SIZE, segment.y * CELL_SIZE - CELL_SIZE, CELL_SIZE * 3, CELL_SIZE * 3);
        }

        ctx.fillStyle = fillColor;

        const padding = i === 0 ? 1 : 2;
        const radius = i === 0 ? 5 : 3;

        ctx.beginPath();
        ctx.roundRect(
          segment.x * CELL_SIZE + padding,
          segment.y * CELL_SIZE + padding,
          CELL_SIZE - padding * 2,
          CELL_SIZE - padding * 2,
          radius
        );
        ctx.fill();

        if (activeTheme.pattern === "wizard" && i > 0 && i % 3 === 0) {
          ctx.fillStyle = "#fef08a"; 
          const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (activeTheme.pattern === "dots" && i > 0 && i % 2 === 0) {
          ctx.fillStyle = activeTheme.head;
          const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (activeTheme.pattern === "lines" && i > 0) {
          ctx.strokeStyle = activeTheme.head;
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (i % 2 === 0) {
            ctx.moveTo(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + CELL_SIZE / 2);
            ctx.lineTo(segment.x * CELL_SIZE + CELL_SIZE - 4, segment.y * CELL_SIZE + CELL_SIZE / 2);
          } else {
            ctx.moveTo(segment.x * CELL_SIZE + CELL_SIZE / 2, segment.y * CELL_SIZE + 4);
            ctx.lineTo(segment.x * CELL_SIZE + CELL_SIZE / 2, segment.y * CELL_SIZE + CELL_SIZE - 4);
          }
          ctx.stroke();
        }

        if (activeTheme.pattern === "zigzag" && i > 0) {
          ctx.strokeStyle = activeTheme.head;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
          const offset = 4;
          ctx.moveTo(cx - offset, cy - offset);
          ctx.lineTo(cx + offset, cy - offset);
          ctx.lineTo(cx - offset, cy + offset);
          ctx.lineTo(cx + offset, cy + offset);
          ctx.stroke();
        }

        // Eyes on head
        if (i === 0) {
          ctx.fillStyle = COLORS.eye;
          const dir = directionRef.current;
          const eyeSize = 3;
          const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;

          let e1x, e1y, e2x, e2y;
          if (dir === DIRECTION.RIGHT) {
            e1x = cx + 3; e1y = cy - 4; e2x = cx + 3; e2y = cy + 4;
          } else if (dir === DIRECTION.LEFT) {
            e1x = cx - 3; e1y = cy - 4; e2x = cx - 3; e2y = cy + 4;
          } else if (dir === DIRECTION.UP) {
            e1x = cx - 4; e1y = cy - 3; e2x = cx + 4; e2y = cy - 3;
          } else {
            e1x = cx - 4; e1y = cy + 3; e2x = cx + 4; e2y = cy + 3;
          }

          ctx.beginPath();
          ctx.arc(e1x, e1y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(e2x, e2y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Score overlay on canvas
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${scoreRef.current}`, 10, 22);
  }, []);

  // Game tick
  const tick = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    directionRef.current = nextDirectionRef.current;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = directionRef.current;

    head.x += dir.x;
    head.y += dir.y;

    const handleCrash = (reason) => {
      gameStateRef.current = "crashed";
      setGameState("crashed");
      clearInterval(gameLoopRef.current);
      
      let blinkCount = 0;
      let isVisible = false;
      draw(isVisible); // Initial blink off
      
      const blinkInterval = setInterval(() => {
        blinkCount++;
        isVisible = !isVisible;
        draw(isVisible);
        
        if (blinkCount >= 5) { // Ends on visible
          clearInterval(blinkInterval);
          draw(true); // Ensure snake is visible during the dramatic pause
          
          // Dramatic pause before Game Over
          setTimeout(async () => {
            await onGameOver(scoreRef.current, reason);
            gameStateRef.current = "over";
            setGameState("over");
          }, 500);
        }
      }, 150);
    };

    // Border collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      handleCrash("border");
      return;
    }

    // Wall collision
    if (wallsRef.current.some((w) => w.x === head.x && w.y === head.y)) {
      handleCrash("wall");
      return;
    }

    // Self collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      handleCrash("self");
      return;
    }

    snake.unshift(head);

    const prevLength = snakeRef.current.length;
    const now = Date.now();

    // Handle special food expiration
    if (specialFoodRef.current && now > specialFoodRef.current.expiresAt) {
      specialFoodRef.current = null;
    }

    // Eat food
    const food = foodRef.current;
    if (head.x === food.x && head.y === food.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = getRandomFood(snake, wallsRef.current, specialFoodRef.current);
      
      // 40% chance to spawn special food
      if (!specialFoodRef.current && Math.random() < 0.40) {
        const sfPos = getRandomFood(snake, wallsRef.current, foodRef.current);
        specialFoodRef.current = { ...sfPos, expiresAt: now + 6000 };
      }
    } else if (specialFoodRef.current && head.x === specialFoodRef.current.x && head.y === specialFoodRef.current.y) {
      scoreRef.current += 30;
      setScore(scoreRef.current);
      specialFoodRef.current = null;
    } else {
      snake.pop();
    }

    snakeRef.current = snake;

    if (snake.length > prevLength) {
      // Decrease tick time by 1.5ms per food eaten (takes ~34 foods to hit max speed)
      const foodsEaten = snake.length - 3;
      const newTickMs = Math.max(MIN_TICK_MS, START_TICK_MS - Math.floor(foodsEaten * 1.5));
      
      if (newTickMs !== tickMsRef.current) {
        tickMsRef.current = newTickMs;
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = setInterval(tick, tickMsRef.current);
      }
    }

    draw();
  }, [draw, onGameOver]);

  // Start game
  const startGame = useCallback(() => {
    if (disabled || !globalDateStr || gameStateRef.current === "starting" || gameStateRef.current === "playing") return;

    // Generate daily walls if we haven't already
    if (wallsRef.current.length === 0) {
      wallsRef.current = generateDailyWalls(globalDateStr);
    }

    snakeRef.current = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 },
    ];
    specialFoodRef.current = null;
    foodRef.current = getRandomFood(snakeRef.current, wallsRef.current);
    directionRef.current = DIRECTION.RIGHT;
    nextDirectionRef.current = DIRECTION.RIGHT;
    tickMsRef.current = START_TICK_MS;
    scoreRef.current = 0;
    setScore(0);
    
    gameStateRef.current = "starting";
    setGameState("starting");
    setCountdown(3);
    draw();

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    let currentCount = 3;
    gameLoopRef.current = setInterval(() => {
      currentCount--;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(gameLoopRef.current);
        setCountdown(null);
        gameStateRef.current = "playing";
        setGameState("playing");
        gameLoopRef.current = setInterval(tick, tickMsRef.current);
      }
    }, 1000);
  }, [disabled, tick, draw, globalDateStr]);

  // Keyboard input
  useEffect(() => {
    function handleKey(e) {
      if (gameStateRef.current !== "playing") {
        if (e.key === " " && gameStateRef.current !== "starting") {
          e.preventDefault();
          startGame();
        }
        return;
      }

      const dir = directionRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          if (dir !== DIRECTION.DOWN) nextDirectionRef.current = DIRECTION.UP;
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          if (dir !== DIRECTION.UP) nextDirectionRef.current = DIRECTION.DOWN;
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          if (dir !== DIRECTION.RIGHT) nextDirectionRef.current = DIRECTION.LEFT;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          if (dir !== DIRECTION.LEFT) nextDirectionRef.current = DIRECTION.RIGHT;
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startGame]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  return { canvasRef, score, gameState, startGame, CANVAS_SIZE, countdown };
}
