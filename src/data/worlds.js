/**
 * worlds.js - 6개 월드(나라) 데이터
 * 각 월드마다 고유한 하늘, 땅, 산, 장애물, 장식이 있음
 * Background.js와 Obstacle.js에서 이 데이터를 참조하여 테마를 바꿈
 */

export const WORLDS = [
  {
    id: 1,
    name: '풀밭 나라',
    emoji: '🌿',
    // 하늘 그라디언트 (위 → 아래)
    skyTop: 0x87CEEB,
    skyBottom: 0xE0F0FF,
    // 바닥 색상 (밝은/어두운)
    groundColor: 0x7EC850,
    groundDarkColor: 0x5DA035,
    // 산 색상 (뒷산, 앞산)
    mountainColors: [0xD4B8E0, 0xA8D5A2],
    // 구름/원경 색상
    cloudColor: 0xFFFFFF,
    // 이 월드에서 나오는 장애물 키 목록
    obstacles: ['w1_small_cactus', 'w1_big_cactus', 'w1_rock'],
    enemies: [],  // 풀밭: 적 없음 (입문)
    // 풀밭 장식
    decorations: { flowers: true, flowerColors: [0xFFB8D0, 0xFFE066] },
  },
  {
    id: 2,
    name: '사막 나라',
    emoji: '🏜️',
    skyTop: 0xF4D68C,
    skyBottom: 0xFFF2CC,
    groundColor: 0xE8C66A,
    groundDarkColor: 0xC9A84E,
    mountainColors: [0xDEB887, 0xD2B48C],
    cloudColor: 0xFFE8B0,
    obstacles: ['w2_cactus', 'w2_skull', 'w2_sand_dune'],
    enemies: ['w2_scorpion'],  // 사막: 전갈
    decorations: { flowers: false },
  },
  {
    id: 3,
    name: '숲 나라',
    emoji: '🌲',
    skyTop: 0xA8D5BA,
    skyBottom: 0xD5F0DD,
    groundColor: 0x5A9A4B,
    groundDarkColor: 0x3D7A2E,
    mountainColors: [0x6DB86B, 0x4A8C49],
    cloudColor: 0xC8E8C0,
    obstacles: ['w3_stump', 'w3_mushroom', 'w3_vine'],
    enemies: ['w3_caterpillar', 'w3_bat'],  // 숲: 애벌레 + 박쥐
    decorations: { flowers: true, flowerColors: [0xFF69B4, 0xFFFFFF] },
  },
  {
    id: 4,
    name: '화산 나라',
    emoji: '🌋',
    skyTop: 0xFF9A76,
    skyBottom: 0xFFD4B8,
    groundColor: 0x8B4513,
    groundDarkColor: 0x5C2D0A,
    mountainColors: [0xA0522D, 0x8B0000],
    cloudColor: 0xBBAAAA,
    obstacles: ['w4_lava_rock', 'w4_fire_pillar', 'w4_ash_pile'],
    enemies: ['w4_flame_slime', 'w4_small_dragon'],  // 화산: 불꽃슬라임 + 작은용
    decorations: { flowers: false },
  },
  {
    id: 5,
    name: '바다 나라',
    emoji: '🌊',
    skyTop: 0x5BB0F0,
    skyBottom: 0xB0D8F0,
    groundColor: 0x3A8EC8,
    groundDarkColor: 0x2070A0,
    mountainColors: [0x6BC5E8, 0x4AA8D0],
    cloudColor: 0xE0F0FF,
    obstacles: ['w5_coral', 'w5_seaweed', 'w5_starfish'],
    enemies: ['w5_crab', 'w5_pufferfish'],  // 바다: 게 + 복어
    decorations: { flowers: false },
  },
  {
    id: 6,
    name: '하늘 나라',
    emoji: '☁️',
    skyTop: 0xE8D5F5,
    skyBottom: 0xF5EAFF,
    groundColor: 0xC8A8E8,
    groundDarkColor: 0xA080C8,
    mountainColors: [0xD8C0F0, 0xE8D8FF],
    cloudColor: 0xF0E0FF,
    obstacles: ['w6_star', 'w6_moon', 'w6_rainbow'],
    enemies: ['w6_cloud_fairy', 'w6_eagle'],  // 하늘: 구름요정 + 독수리
    decorations: { flowers: true, flowerColors: [0xFFD700, 0xFFA0FF] },
  },
];

/**
 * 월드 ID로 월드 데이터를 가져오는 헬퍼
 * @param {number} worldId - 1~6
 * @returns {object} 월드 데이터
 */
export function getWorld(worldId) {
  return WORLDS.find(w => w.id === worldId) || WORLDS[0];
}
