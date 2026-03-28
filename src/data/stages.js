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
  // === 월드 1: 풀밭 나라 - 초반이라 적/스프링/부스트 없음, 아이템 넉넉 ===
  { id: 1,  world: 1, name: '첫걸음',       target: 50,  speedBonus: 0,  enemyChance: 0,    itemChance: 0.5,  springChance: 0,    boostChance: 0 },
  { id: 2,  world: 1, name: '풀밭 산책',    target: 60,  speedBonus: 5,  enemyChance: 0,    itemChance: 0.5,  springChance: 0,    boostChance: 0 },
  { id: 3,  world: 1, name: '나비를 따라',  target: 70,  speedBonus: 10, enemyChance: 0,    itemChance: 0.45, springChance: 0,    boostChance: 0 },
  { id: 4,  world: 1, name: '꽃밭 건너기',  target: 80,  speedBonus: 15, enemyChance: 0,    itemChance: 0.45, springChance: 0,    boostChance: 0 },
  { id: 5,  world: 1, name: '풀밭의 왕',    target: 90,  speedBonus: 20, enemyChance: 0,    itemChance: 0.4,  springChance: 0,    boostChance: 0 },

  // === 월드 2: 사막 나라 - 적 등장 시작, 스프링 소량 등장 ===
  { id: 6,  world: 2, name: '뜨거운 모래',    target: 70,  speedBonus: 0,  enemyChance: 0.15, itemChance: 0.4,  springChance: 0.03, boostChance: 0 },
  { id: 7,  world: 2, name: '오아시스를 찾아', target: 80,  speedBonus: 5,  enemyChance: 0.18, itemChance: 0.4,  springChance: 0.04, boostChance: 0 },
  { id: 8,  world: 2, name: '사막의 바람',    target: 90,  speedBonus: 10, enemyChance: 0.2,  itemChance: 0.38, springChance: 0.04, boostChance: 0.02 },
  { id: 9,  world: 2, name: '신기루 너머',    target: 100, speedBonus: 15, enemyChance: 0.22, itemChance: 0.38, springChance: 0.05, boostChance: 0.02 },
  { id: 10, world: 2, name: '사막의 별',      target: 110, speedBonus: 20, enemyChance: 0.25, itemChance: 0.35, springChance: 0.05, boostChance: 0.03 },

  // === 월드 3: 숲 나라 - 적 본격화, 스프링/부스트 가끔 ===
  { id: 11, world: 3, name: '숲속 탐험',      target: 80,  speedBonus: 0,  enemyChance: 0.25, itemChance: 0.38, springChance: 0.05, boostChance: 0.03 },
  { id: 12, world: 3, name: '버섯 마을',      target: 90,  speedBonus: 5,  enemyChance: 0.28, itemChance: 0.35, springChance: 0.06, boostChance: 0.03 },
  { id: 13, world: 3, name: '나무 위로!',     target: 100, speedBonus: 10, enemyChance: 0.3,  itemChance: 0.35, springChance: 0.06, boostChance: 0.04 },
  { id: 14, world: 3, name: '비밀의 오솔길',  target: 110, speedBonus: 15, enemyChance: 0.32, itemChance: 0.33, springChance: 0.07, boostChance: 0.04 },
  { id: 15, world: 3, name: '숲의 수호자',    target: 120, speedBonus: 20, enemyChance: 0.35, itemChance: 0.33, springChance: 0.07, boostChance: 0.05 },

  // === 월드 4: 화산 나라 - 적 많아짐, 스프링/부스트 보통 ===
  { id: 16, world: 4, name: '뜨거운 땅',        target: 90,  speedBonus: 0,  enemyChance: 0.35, itemChance: 0.33, springChance: 0.07, boostChance: 0.05 },
  { id: 17, world: 4, name: '용암 강 건너기',   target: 100, speedBonus: 5,  enemyChance: 0.37, itemChance: 0.32, springChance: 0.07, boostChance: 0.05 },
  { id: 18, world: 4, name: '불꽃 터널',        target: 110, speedBonus: 10, enemyChance: 0.38, itemChance: 0.32, springChance: 0.08, boostChance: 0.06 },
  { id: 19, world: 4, name: '화산의 심장',      target: 120, speedBonus: 15, enemyChance: 0.4,  itemChance: 0.3,  springChance: 0.08, boostChance: 0.06 },
  { id: 20, world: 4, name: '불의 시련',        target: 130, speedBonus: 20, enemyChance: 0.42, itemChance: 0.3,  springChance: 0.08, boostChance: 0.06 },

  // === 월드 5: 바다 나라 - 적 많음, 스프링/부스트 자주 ===
  { id: 21, world: 5, name: '파도를 타고',    target: 100, speedBonus: 0,  enemyChance: 0.4,  itemChance: 0.32, springChance: 0.08, boostChance: 0.06 },
  { id: 22, world: 5, name: '산호초 미로',    target: 110, speedBonus: 5,  enemyChance: 0.42, itemChance: 0.3,  springChance: 0.09, boostChance: 0.06 },
  { id: 23, world: 5, name: '심해 탐험',      target: 120, speedBonus: 10, enemyChance: 0.43, itemChance: 0.3,  springChance: 0.09, boostChance: 0.07 },
  { id: 24, world: 5, name: '해저 동굴',      target: 130, speedBonus: 15, enemyChance: 0.45, itemChance: 0.28, springChance: 0.09, boostChance: 0.07 },
  { id: 25, world: 5, name: '바다의 보물',    target: 140, speedBonus: 20, enemyChance: 0.47, itemChance: 0.28, springChance: 0.1,  boostChance: 0.07 },

  // === 월드 6: 하늘 나라 - 최종, 적 가장 많음, 스프링/부스트 최대 ===
  { id: 26, world: 6, name: '구름 위 산책',   target: 110, speedBonus: 0,  enemyChance: 0.45, itemChance: 0.3,  springChance: 0.09, boostChance: 0.07 },
  { id: 27, world: 6, name: '별빛 길',        target: 120, speedBonus: 5,  enemyChance: 0.47, itemChance: 0.28, springChance: 0.09, boostChance: 0.07 },
  { id: 28, world: 6, name: '달나라 여행',    target: 130, speedBonus: 10, enemyChance: 0.48, itemChance: 0.28, springChance: 0.1,  boostChance: 0.08 },
  { id: 29, world: 6, name: '무지개 다리',    target: 140, speedBonus: 15, enemyChance: 0.48, itemChance: 0.25, springChance: 0.1,  boostChance: 0.08 },
  { id: 30, world: 6, name: '하늘의 끝',      target: 150, speedBonus: 20, enemyChance: 0.5,  itemChance: 0.25, springChance: 0.1,  boostChance: 0.08 },
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
