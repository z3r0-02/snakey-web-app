"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { THEMES } from "@/lib/achievements";

const GRID_SIZE = 20;
const CELL_SIZE = 30;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 600px

// Tick timing: the loop starts slow and speeds up as the snake grows.
const MIN_TICK_MS = 140;
const START_TICK_MS = 180;
const SPEED_STEP_MS = 1.5; // tick time shaved off per food eaten
const INITIAL_SNAKE_LENGTH = 3;

// Scoring & food.
const FOOD_SCORE = 10;
const SPECIAL_FOOD_SCORE = 30;
const SPECIAL_FOOD_SPAWN_CHANCE = 0.4; // chance to spawn special food after eating
const SPECIAL_FOOD_DURATION_MS = 6000; // how long special food stays before expiring

// Pre-game countdown (3… 2… 1…).
const COUNTDOWN_SECONDS = 3;
const COUNTDOWN_TICK_MS = 1000;

// Crash animation: blink the snake a few times, then show game over.
const CRASH_BLINK_COUNT = 5;
const CRASH_BLINK_INTERVAL_MS = 150;
const GAME_OVER_DELAY_MS = 500;

// Minimum touch travel (px) before a swipe registers as a direction change.
const SWIPE_THRESHOLD_PX = 24;

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
  wall: "#3b82f6",
  wallBorder: "#1e3a8a",
};

// Seeded PRNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
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
    
    // Max 2 of the same shape family
    if (familyCounts[familyIndex] >= 2) continue;
    
    // Max 1 total 4-block wall (Family 2)
    if (familyIndex === 2 && familyCounts[2] >= 1) continue;

    // Random offset, avoiding the very edges
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
  const occupied = (x, y) =>
    snake.some((s) => s.x === x && s.y === y) ||
    walls.some((w) => w.x === x && w.y === y) ||
    (otherFood && otherFood.x === x && otherFood.y === y);

  const MAX_TRIES = GRID_SIZE * GRID_SIZE;
  for (let i = 0; i < MAX_TRIES; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!occupied(x, y)) return { x, y };
  }

  // Fallback: scan for the first free cell
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied(x, y)) return { x, y };
    }
  }
  return null;
}

// --- Canvas drawing helpers ---
function drawGrid(ctx) {
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
}

function drawFood(ctx, food) {
  if (!food) return;
  const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
  const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
  const gradient = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL_SIZE * 1.5);
  gradient.addColorStop(0, COLORS.foodGlow);
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(fx - CELL_SIZE * 1.5, fy - CELL_SIZE * 1.5, CELL_SIZE * 3, CELL_SIZE * 3);

  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.roundRect(food.x * CELL_SIZE + 2, food.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
  ctx.fill();
}

function drawSpecialFood(ctx, sFood) {
  if (!sFood) return;
  const now = Date.now();
  const pulse = (Math.sin(now / 100) + 1) / 2;
  const alpha = 0.2 + pulse * 0.8;

  ctx.globalAlpha = alpha;

  const sfx = sFood.x * CELL_SIZE + CELL_SIZE / 2;
  const sfy = sFood.y * CELL_SIZE + CELL_SIZE / 2;
  const sGradient = ctx.createRadialGradient(sfx, sfy, 2, sfx, sfy, CELL_SIZE * 1.5);
  sGradient.addColorStop(0, COLORS.specialFoodGlow);
  sGradient.addColorStop(1, "transparent");
  ctx.fillStyle = sGradient;
  ctx.fillRect(sfx - CELL_SIZE * 1.5, sfy - CELL_SIZE * 1.5, CELL_SIZE * 3, CELL_SIZE * 3);

  ctx.globalAlpha = 1.0;

  ctx.fillStyle = COLORS.specialFood;
  ctx.beginPath();
  ctx.roundRect(sFood.x * CELL_SIZE + 2, sFood.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
  ctx.fill();
}

function drawWalls(ctx, walls) {
  if (walls.length === 0) return;
  ctx.fillStyle = COLORS.wall;
  ctx.strokeStyle = COLORS.wallBorder;
  ctx.lineWidth = 2;
  walls.forEach((w) => {
    ctx.beginPath();
    ctx.roundRect(w.x * CELL_SIZE + 1, w.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
    ctx.fill();
    ctx.stroke();
  });
}

function drawSnake(ctx, snake, activeTheme, direction) {
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
      const dir = direction;
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

function drawScore(ctx, score) {
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 22);
}

export default function SnakeGame({ onGameOver, disabled, globalDateStr, themeId }) {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const gameOverTimeoutRef = useRef(null);
  const directionRef = useRef(DIRECTION.RIGHT);
  const nextDirectionRef = useRef(DIRECTION.RIGHT);
  const snakeRef = useRef([
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ]);
  const wallsRef = useRef([]);
  const foodRef = useRef({ x: 15, y: 10 });
  const specialFoodRef = useRef(null);
  const tickMsRef = useRef(START_TICK_MS);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const [countdown, setCountdown] = useState(null);
  const gameStateRef = useRef("idle");
  const themeRef = useRef(themeId);

  useEffect(() => {
    themeRef.current = themeId;
  }, [themeId]);

  const draw = useCallback((isSnakeVisible = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGrid(ctx);
    drawFood(ctx, foodRef.current);
    drawSpecialFood(ctx, specialFoodRef.current);
    drawWalls(ctx, wallsRef.current);

    if (isSnakeVisible) {
      const activeTheme = THEMES[themeRef.current] || THEMES.default;
      drawSnake(ctx, snakeRef.current, activeTheme, directionRef.current);
    }

    drawScore(ctx, scoreRef.current);
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

    const now = Date.now();

    // Handle special food expiration
    if (specialFoodRef.current && now > specialFoodRef.current.expiresAt) {
      specialFoodRef.current = null;
    }

    const handleCrash = (reason) => {
      gameStateRef.current = "crashed";
      setGameState("crashed");
      clearInterval(gameLoopRef.current);

      let blinkCount = 0;
      let isVisible = false;
      draw(isVisible); // Initial blink off

      blinkIntervalRef.current = setInterval(() => {
        blinkCount++;
        isVisible = !isVisible;
        draw(isVisible);

        if (blinkCount >= CRASH_BLINK_COUNT) {
          clearInterval(blinkIntervalRef.current);
          blinkIntervalRef.current = null;
          draw(true);

          gameOverTimeoutRef.current = setTimeout(() => {
            onGameOver(scoreRef.current, reason);
            gameStateRef.current = "over";
            setGameState("over");
            gameOverTimeoutRef.current = null;
          }, GAME_OVER_DELAY_MS);
        }
      }, CRASH_BLINK_INTERVAL_MS);
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

    const eatsFood = !!(foodRef.current && head.x === foodRef.current.x && head.y === foodRef.current.y);
    const eatsSpecialFood = !eatsFood && !!(
      specialFoodRef.current && head.x === specialFoodRef.current.x && head.y === specialFoodRef.current.y
    );
    const willGrow = eatsFood || eatsSpecialFood;

    // Self collision — exclude the tail cell when it's about to move out of the way
    const bodyToCheck = willGrow ? snake : snake.slice(0, -1);
    if (bodyToCheck.some((s) => s.x === head.x && s.y === head.y)) {
      handleCrash("self");
      return;
    }

    snake.unshift(head);

    const prevLength = snakeRef.current.length;

    // Eat food
    if (eatsFood) {
      scoreRef.current += FOOD_SCORE;
      setScore(scoreRef.current);
      foodRef.current = getRandomFood(snake, wallsRef.current, specialFoodRef.current);

      if (!specialFoodRef.current && Math.random() < SPECIAL_FOOD_SPAWN_CHANCE) {
        const sfPos = getRandomFood(snake, wallsRef.current, foodRef.current);
        if (sfPos) {
          specialFoodRef.current = { ...sfPos, expiresAt: now + SPECIAL_FOOD_DURATION_MS };
        }
      }
    } else if (eatsSpecialFood) {
      scoreRef.current += SPECIAL_FOOD_SCORE;
      setScore(scoreRef.current);
      specialFoodRef.current = null;
    } else {
      snake.pop();
    }

    snakeRef.current = snake;

    if (snake.length > prevLength) {
      // Decrease tick time by SPEED_STEP_MS per food eaten (takes ~27 foods to hit max speed)
      const foodsEaten = snake.length - INITIAL_SNAKE_LENGTH;
      const newTickMs = Math.max(MIN_TICK_MS, START_TICK_MS - Math.floor(foodsEaten * SPEED_STEP_MS));

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
    setCountdown(COUNTDOWN_SECONDS);
    draw();

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);

    let currentCount = COUNTDOWN_SECONDS;
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
    }, COUNTDOWN_TICK_MS);
  }, [disabled, tick, draw, globalDateStr]);

  // Shared direction-change logic, reused by keyboard, D-pad, and swipe input.
  const changeDirection = useCallback((dirName) => {
    if (gameStateRef.current !== "playing") return;
    const dir = directionRef.current;
    const next = DIRECTION[dirName];
    if (!next) return;

    const isOpposite =
      (dir === DIRECTION.UP && next === DIRECTION.DOWN) ||
      (dir === DIRECTION.DOWN && next === DIRECTION.UP) ||
      (dir === DIRECTION.LEFT && next === DIRECTION.RIGHT) ||
      (dir === DIRECTION.RIGHT && next === DIRECTION.LEFT);

    if (!isOpposite) nextDirectionRef.current = next;
  }, []);

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

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          changeDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          changeDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          changeDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          changeDirection("RIGHT");
          break;
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startGame, changeDirection]);

  // Swipe input (mobile) — tracks touch start/end
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStart = null;

    function handleTouchStart(e) {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }

    function handleTouchEnd(e) {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        changeDirection(dy > 0 ? "DOWN" : "UP");
      }
    }

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [changeDirection]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
      if (gameOverTimeoutRef.current) clearTimeout(gameOverTimeoutRef.current);
    };
  }, []);

  return { canvasRef, score, gameState, startGame, CANVAS_SIZE, countdown, changeDirection };
}
