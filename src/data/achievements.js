/**
 * achievements.js - 업적/도전과제 데이터
 * 게임 플레이 중 특정 조건을 달성하면 업적이 해제됨
 * stats는 localStorage 'ruvin_dino_stats'에 누적 저장
 */

// 업적 목록: 각 업적은 id, 이름, 설명, 아이콘, 달성 조건 함수를 가짐
export const ACHIEVEMENTS = [
  {
    id: 'first_clear',
    name: '첫 클리어!',
    desc: '스테이지 1을 클리어',
    icon: '\u{1F31F}', // 🌟
    condition: (stats) => stats.clearedStages >= 1,
  },
  {
    id: 'combo_5',
    name: '콤보 달인',
    desc: '5콤보 달성',
    icon: '\u{1F525}', // 🔥
    condition: (stats) => stats.maxCombo >= 5,
  },
  {
    id: 'stomp_10',
    name: '밟기 전문가',
    desc: '적 10마리 밟기',
    icon: '\u{1F463}', // 👣
    condition: (stats) => stats.totalStomps >= 10,
  },
  {
    id: 'stomp_50',
    name: '밟기 마스터',
    desc: '적 50마리 밟기',
    icon: '\u{1F451}', // 👑
    condition: (stats) => stats.totalStomps >= 50,
  },
  {
    id: 'star_100',
    name: '별 수집가',
    desc: '별 100개 모으기',
    icon: '\u{2B50}', // ⭐
    condition: (stats) => stats.totalStars >= 100,
  },
  {
    id: 'star_500',
    name: '별 헌터',
    desc: '별 500개 모으기',
    icon: '\u{1F4AB}', // 💫
    condition: (stats) => stats.totalStars >= 500,
  },
  {
    id: 'world_2',
    name: '사막 탐험가',
    desc: '사막 나라 도달',
    icon: '\u{1F3DC}\u{FE0F}', // 🏜️
    condition: (stats) => stats.clearedStages >= 5,
  },
  {
    id: 'world_3',
    name: '숲 모험가',
    desc: '숲 나라 도달',
    icon: '\u{1F332}', // 🌲
    condition: (stats) => stats.clearedStages >= 10,
  },
  {
    id: 'world_6',
    name: '하늘의 영웅',
    desc: '하늘 나라 도달',
    icon: '\u{2601}\u{FE0F}', // ☁️
    condition: (stats) => stats.clearedStages >= 25,
  },
  {
    id: 'all_clear',
    name: '전설의 공룡',
    desc: '모든 스테이지 클리어',
    icon: '\u{1F3C6}', // 🏆
    condition: (stats) => stats.clearedStages >= 30,
  },
  {
    id: 'no_hit',
    name: '무적 달리기',
    desc: '한번도 안 맞고 클리어',
    icon: '\u{1F6E1}\u{FE0F}', // 🛡️
    condition: (stats) => stats.noHitClear === true,
  },
  {
    id: 'all_dinos',
    name: '공룡 친구들',
    desc: '4마리 전부 사용',
    icon: '\u{1F995}', // 🦕
    condition: (stats) => stats.usedDinos >= 4,
  },
];

// localStorage 키 이름
const STATS_KEY = 'ruvin_dino_stats';
const UNLOCKED_KEY = 'ruvin_dino_achievements';

/**
 * 누적 통계 불러오기 (없으면 초기값)
 * @returns {object} stats 객체
 */
export function loadStats() {
  try {
    const data = JSON.parse(localStorage.getItem(STATS_KEY));
    if (data) {
      return {
        totalStomps: data.totalStomps || 0,
        totalStars: data.totalStars || 0,
        maxCombo: data.maxCombo || 0,
        clearedStages: data.clearedStages || 0,
        noHitClear: data.noHitClear || false,
        usedDinos: data.usedDinos || ['brachio'],
      };
    }
  } catch { /* 파싱 실패 시 초기값 반환 */ }
  return {
    totalStomps: 0,
    totalStars: 0,
    maxCombo: 0,
    clearedStages: 0,
    noHitClear: false,
    usedDinos: ['brachio'],
  };
}

/**
 * 누적 통계 저장
 * @param {object} stats - 저장할 stats 객체
 */
export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

/**
 * 달성한 업적 ID 목록 불러오기
 * @returns {string[]} 업적 ID 배열
 */
export function loadUnlockedAchievements() {
  try {
    const data = JSON.parse(localStorage.getItem(UNLOCKED_KEY));
    if (Array.isArray(data)) return data;
  } catch { /* 파싱 실패 */ }
  return [];
}

/**
 * 달성한 업적 ID 목록 저장
 * @param {string[]} ids - 업적 ID 배열
 */
export function saveUnlockedAchievements(ids) {
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids));
}

/**
 * 업적 체크: 새로 달성한 업적이 있으면 반환
 * 기존에 이미 달성한 것은 제외하고 새로 달성한 것만 반환
 * @param {object} stats - 현재 통계
 * @returns {object[]} 새로 달성한 업적 배열 (ACHIEVEMENTS 항목)
 */
export function checkNewAchievements(stats) {
  const unlocked = loadUnlockedAchievements();
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    // 이미 달성한 업적은 스킵
    if (unlocked.includes(ach.id)) continue;
    // 조건 충족 여부 확인
    if (ach.condition(stats)) {
      newlyUnlocked.push(ach);
      unlocked.push(ach.id);
    }
  }

  // 새 업적이 있으면 저장
  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
}
