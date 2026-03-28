/**
 * stages.js - 30개 스테이지 데이터
 * 6개 월드 x 5개 스테이지 = 총 30개
 *
 * target: 이 스테이지에서 넘어야 할 장애물 수 (기본값)
 *   - 난이도에 따라 배율 적용: 아기공룡 x0.5, 꼬마 x0.7, 씩씩한 x1.0, 용감한 x1.3, 전설 x1.5
 *   - Math.ceil로 올림 처리
 * speedBonus: 게임 시작 속도에 추가되는 보너스 (px/초)
 *   - 월드 내에서 0, 5, 10, 15, 20씩 증가
 */

export const STAGES = [
  // === 월드 1: 풀밭 나라 🌿 ===
  { id: 1,  world: 1, name: '첫걸음',       target: 5,  speedBonus: 0 },
  { id: 2,  world: 1, name: '풀밭 산책',    target: 6,  speedBonus: 5 },
  { id: 3,  world: 1, name: '나비를 따라',  target: 7,  speedBonus: 10 },
  { id: 4,  world: 1, name: '꽃밭 건너기',  target: 8,  speedBonus: 15 },
  { id: 5,  world: 1, name: '풀밭의 왕',    target: 9,  speedBonus: 20 },

  // === 월드 2: 사막 나라 🏜️ ===
  { id: 6,  world: 2, name: '뜨거운 모래',    target: 7,  speedBonus: 0 },
  { id: 7,  world: 2, name: '오아시스를 찾아', target: 8,  speedBonus: 5 },
  { id: 8,  world: 2, name: '사막의 바람',    target: 9,  speedBonus: 10 },
  { id: 9,  world: 2, name: '신기루 너머',    target: 10, speedBonus: 15 },
  { id: 10, world: 2, name: '사막의 별',      target: 11, speedBonus: 20 },

  // === 월드 3: 숲 나라 🌲 ===
  { id: 11, world: 3, name: '숲속 탐험',      target: 8,  speedBonus: 0 },
  { id: 12, world: 3, name: '버섯 마을',      target: 9,  speedBonus: 5 },
  { id: 13, world: 3, name: '나무 위로!',     target: 10, speedBonus: 10 },
  { id: 14, world: 3, name: '비밀의 오솔길',  target: 11, speedBonus: 15 },
  { id: 15, world: 3, name: '숲의 수호자',    target: 12, speedBonus: 20 },

  // === 월드 4: 화산 나라 🌋 ===
  { id: 16, world: 4, name: '뜨거운 땅',        target: 9,  speedBonus: 0 },
  { id: 17, world: 4, name: '용암 강 건너기',   target: 10, speedBonus: 5 },
  { id: 18, world: 4, name: '불꽃 터널',        target: 11, speedBonus: 10 },
  { id: 19, world: 4, name: '화산의 심장',      target: 12, speedBonus: 15 },
  { id: 20, world: 4, name: '불의 시련',        target: 13, speedBonus: 20 },

  // === 월드 5: 바다 나라 🌊 ===
  { id: 21, world: 5, name: '파도를 타고',    target: 10, speedBonus: 0 },
  { id: 22, world: 5, name: '산호초 미로',    target: 11, speedBonus: 5 },
  { id: 23, world: 5, name: '심해 탐험',      target: 12, speedBonus: 10 },
  { id: 24, world: 5, name: '해저 동굴',      target: 13, speedBonus: 15 },
  { id: 25, world: 5, name: '바다의 보물',    target: 14, speedBonus: 20 },

  // === 월드 6: 하늘 나라 ☁️ ===
  { id: 26, world: 6, name: '구름 위 산책',   target: 11, speedBonus: 0 },
  { id: 27, world: 6, name: '별빛 길',        target: 12, speedBonus: 5 },
  { id: 28, world: 6, name: '달나라 여행',    target: 13, speedBonus: 10 },
  { id: 29, world: 6, name: '무지개 다리',    target: 14, speedBonus: 15 },
  { id: 30, world: 6, name: '하늘의 끝',      target: 15, speedBonus: 20 },
];

/**
 * 난이도별 목표 배율 (난이도 id → 배율)
 * 아기공룡은 장애물을 절반만 넘기면 되고, 전설은 1.5배를 넘겨야 함
 */
export const DIFFICULTY_TARGET_MULTIPLIER = {
  1: 0.5,   // 아기공룡
  2: 0.7,   // 꼬마공룡
  3: 1.0,   // 씩씩한공룡
  4: 1.3,   // 용감한공룡
  5: 1.5,   // 전설의공룡
};

/**
 * 특정 스테이지의 실제 목표 장애물 수를 계산
 * @param {number} stageId - 스테이지 ID (1~30)
 * @param {number} difficultyId - 난이도 ID (1~5)
 * @returns {number} 넘어야 할 장애물 수
 */
export function getStageTarget(stageId, difficultyId) {
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return 10; // 기본값
  const multiplier = DIFFICULTY_TARGET_MULTIPLIER[difficultyId] || 1.0;
  return Math.ceil(stage.target * multiplier);
}

/**
 * 스테이지 ID로 스테이지 데이터를 가져오는 헬퍼
 * @param {number} stageId - 1~30
 * @returns {object} 스테이지 데이터
 */
export function getStage(stageId) {
  return STAGES.find(s => s.id === stageId) || STAGES[0];
}
