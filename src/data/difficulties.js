/**
 * difficulties.js - 난이도 5단계 데이터
 * 각 난이도에 따라 게임 속도, 장애물 간격, 2단 점프 허용 등이 달라짐
 * DifficultyScene에서 선택 → GameScene에서 적용
 */

export const DIFFICULTIES = [
  {
    id: 1,
    name: '아기공룡',
    emoji: '🥚',                    // 알에서 막 나온 아기
    stars: 1,                       // 별 1개 = 가장 쉬움
    description: '천천히 갈게~',
    color: '#FFE0E0',               // 연분홍 카드 배경
    borderColor: '#FF9999',         // 카드 테두리
    // 게임 파라미터
    initialSpeed: 100,              // 아주 느린 시작 속도
    maxSpeed: 200,                  // 최대 속도도 낮음
    obstacleGapMin: 2500,           // 장애물 간격 넓음 (여유롭게)
    obstacleGapMax: 4000,
    obstacleScale: 0.8,             // 장애물 크기 작게 (더 쉽게)
    canDoubleJump: true,            // 2단 점프 항상 가능
    doubleJumpLimit: Infinity,      // 무제한 2단 점프
    targetObstacles: 5,             // 스테이지당 넘어야 할 장애물 수
  },
  {
    id: 2,
    name: '꼬마공룡',
    emoji: '🦕',
    stars: 2,
    description: '조금 빨라!',
    color: '#FFE8C8',               // 연주황
    borderColor: '#FFB366',
    initialSpeed: 120,
    maxSpeed: 250,
    obstacleGapMin: 2000,
    obstacleGapMax: 3500,
    obstacleScale: 0.9,
    canDoubleJump: true,
    doubleJumpLimit: Infinity,
    targetObstacles: 8,
  },
  {
    id: 3,
    name: '씩씩한공룡',
    emoji: '🦖',
    stars: 3,
    description: '나는 용감해!',
    color: '#FFFFC8',               // 연노랑
    borderColor: '#FFD700',
    initialSpeed: 140,
    maxSpeed: 300,
    obstacleGapMin: 1800,
    obstacleGapMax: 3000,
    obstacleScale: 1.0,
    canDoubleJump: true,
    doubleJumpLimit: Infinity,
    targetObstacles: 10,
  },
  {
    id: 4,
    name: '용감한공룡',
    emoji: '🔥',
    stars: 4,
    description: '도전이 좋아!',
    color: '#C8FFD4',               // 연초록
    borderColor: '#66CC77',
    initialSpeed: 160,
    maxSpeed: 350,
    obstacleGapMin: 1500,
    obstacleGapMax: 2500,
    obstacleScale: 1.1,
    canDoubleJump: true,
    doubleJumpLimit: 3,             // 스테이지 내 2단 점프 3회만 가능
    targetObstacles: 12,
  },
  {
    id: 5,
    name: '전설의공룡',
    emoji: '👑',
    stars: 5,
    description: '최강 도전!',
    color: '#C8D4FF',               // 연파랑
    borderColor: '#6688FF',
    initialSpeed: 180,
    maxSpeed: 400,
    obstacleGapMin: 1200,
    obstacleGapMax: 2000,
    obstacleScale: 1.2,
    canDoubleJump: false,           // 2단 점프 불가!
    doubleJumpLimit: 0,
    targetObstacles: 15,
  },
];

// 기본 난이도 (선택 안 했을 때 = 3번 씩씩한공룡)
export const DEFAULT_DIFFICULTY = DIFFICULTIES[2];
