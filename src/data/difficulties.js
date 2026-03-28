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
    initialSpeed: 130,              // 아주 느린 시작 속도 (100 x 1.3 = 130)
    maxSpeed: 260,                  // 최대 속도도 낮음 (200 x 1.3 = 260)
    obstacleGapMin: 2500,           // 장애물 간격 넓음 (여유롭게)
    obstacleGapMax: 4000,
    obstacleScale: 0.8,             // 장애물 크기 작게 (더 쉽게)
    canDoubleJump: true,            // 2단 점프 항상 가능
    doubleJumpLimit: Infinity,      // 무제한 2단 점프
    targetObstacles: 5,             // 스테이지당 넘어야 할 장애물 수
    maxHearts: 5,                   // 하트 5개 (가장 넉넉 - 아기라서 관대하게)
    invincibleDuration: 3000,       // 피격 무적 3초 (기본보다 길게)
  },
  {
    id: 2,
    name: '꼬마공룡',
    emoji: '🦕',
    stars: 2,
    description: '조금 빨라!',
    color: '#FFE8C8',               // 연주황
    borderColor: '#FFB366',
    initialSpeed: 156,              // 120 x 1.3 = 156
    maxSpeed: 325,                  // 250 x 1.3 = 325
    obstacleGapMin: 2000,
    obstacleGapMax: 3500,
    obstacleScale: 0.9,
    canDoubleJump: true,
    doubleJumpLimit: Infinity,
    targetObstacles: 8,
    maxHearts: 4,                   // 하트 4개
    invincibleDuration: 2500,       // 피격 무적 2.5초
  },
  {
    id: 3,
    name: '씩씩한공룡',
    emoji: '🦖',
    stars: 3,
    description: '나는 용감해!',
    color: '#FFFFC8',               // 연노랑
    borderColor: '#FFD700',
    initialSpeed: 182,              // 140 x 1.3 = 182
    maxSpeed: 390,                  // 300 x 1.3 = 390
    obstacleGapMin: 1800,
    obstacleGapMax: 3000,
    obstacleScale: 1.0,
    canDoubleJump: true,
    doubleJumpLimit: Infinity,
    targetObstacles: 10,
    maxHearts: 3,                   // 하트 3개 (기본)
    invincibleDuration: 2000,       // 피격 무적 2초 (기본)
  },
  {
    id: 4,
    name: '용감한공룡',
    emoji: '🔥',
    stars: 4,
    description: '도전이 좋아!',
    color: '#C8FFD4',               // 연초록
    borderColor: '#66CC77',
    initialSpeed: 208,              // 160 x 1.3 = 208
    maxSpeed: 455,                  // 350 x 1.3 = 455
    obstacleGapMin: 1500,
    obstacleGapMax: 2500,
    obstacleScale: 1.1,
    canDoubleJump: true,
    doubleJumpLimit: 3,             // 스테이지 내 2단 점프 3회만 가능
    targetObstacles: 12,
    maxHearts: 2,                   // 하트 2개 (적어서 긴장감 있음)
    invincibleDuration: 1500,       // 피격 무적 1.5초
  },
  {
    id: 5,
    name: '전설의공룡',
    emoji: '👑',
    stars: 5,
    description: '최강 도전!',
    color: '#C8D4FF',               // 연파랑
    borderColor: '#6688FF',
    initialSpeed: 234,              // 180 x 1.3 = 234
    maxSpeed: 520,                  // 400 x 1.3 = 520
    obstacleGapMin: 1200,
    obstacleGapMax: 2000,
    obstacleScale: 1.2,
    canDoubleJump: false,           // 2단 점프 불가!
    doubleJumpLimit: 0,
    targetObstacles: 15,
    maxHearts: 1,                   // 하트 1개! (원래처럼 한 방에 게임오버)
    invincibleDuration: 1000,       // 피격 무적 1초 (거의 없는 셈)
  },
];

// 기본 난이도 (선택 안 했을 때 = 3번 씩씩한공룡)
export const DEFAULT_DIFFICULTY = DIFFICULTIES[2];
