/**
 * enemies.js - 적 캐릭터 데이터 정의
 * 월드별로 등장하는 적의 종류, 크기, 색상, 속도, 점수를 정의
 *
 * type 설명:
 * - ground: 바닥을 걸어다니는 적 (장애물처럼 왼쪽으로 이동)
 * - flying: 공중에서 사인파로 위아래 흔들리며 비행하는 적
 *
 * 월드 1(풀밭)은 입문 구간이라 적이 없음
 */

export const ENEMIES = {
  // === 월드 2 (사막) ===
  w2_scorpion: {
    name: '전갈',
    type: 'ground',        // 바닥 이동형
    width: 40, height: 30, // 텍스처 크기 (px)
    color: 0x8B4513,       // 메인 색상 (갈색)
    speed: 60,             // 이동 속도 (px/s, 게임 속도에 추가)
    points: 3,             // 처치 시 획득 점수
  },

  // === 월드 3 (숲) ===
  w3_caterpillar: {
    name: '애벌레',
    type: 'ground',
    width: 45, height: 25,
    color: 0x228B22,       // 녹색
    speed: 40,
    points: 3,
  },
  w3_bat: {
    name: '박쥐',
    type: 'flying',        // 비행형
    width: 35, height: 30,
    color: 0x4B0082,       // 보라색
    speed: 80,
    flyHeight: 0.5,        // 화면 높이의 50% 위치에서 비행
    amplitude: 30,         // 위아래 흔들림 폭 (px)
    points: 5,
  },

  // === 월드 4 (화산) ===
  w4_flame_slime: {
    name: '불꽃슬라임',
    type: 'ground',
    width: 35, height: 35,
    color: 0xFF4500,       // 주황-빨강
    speed: 70,
    points: 3,
  },
  w4_small_dragon: {
    name: '작은용',
    type: 'flying',
    width: 40, height: 35,
    color: 0xFF6347,       // 토마토색
    speed: 90,
    flyHeight: 0.45,
    amplitude: 25,
    points: 5,
  },

  // === 월드 5 (바다) ===
  w5_crab: {
    name: '게',
    type: 'ground',
    width: 40, height: 28,
    color: 0xDC143C,       // 크림슨(짙은 빨강)
    speed: 50,
    points: 3,
  },
  w5_pufferfish: {
    name: '복어',
    type: 'flying',
    width: 35, height: 35,
    color: 0xFFD700,       // 금색
    speed: 70,
    flyHeight: 0.5,
    amplitude: 20,
    points: 5,
  },

  // === 월드 6 (하늘) ===
  w6_cloud_fairy: {
    name: '구름요정',
    type: 'ground',
    width: 35, height: 35,
    color: 0x9370DB,       // 보라색 계열
    speed: 80,
    points: 3,
  },
  w6_eagle: {
    name: '독수리',
    type: 'flying',
    width: 45, height: 35,
    color: 0x8B6914,       // 갈색
    speed: 100,
    flyHeight: 0.45,          // 0.40→0.45: 높은 점프(306px)로 여유있게 닿도록 완화
    amplitude: 35,
    points: 5,
  },
};

// 월드별 적 목록 (키 배열)
export const WORLD_ENEMIES = {
  1: [],                                     // 풀밭: 적 없음 (입문)
  2: ['w2_scorpion'],                        // 사막: 전갈만
  3: ['w3_caterpillar', 'w3_bat'],           // 숲: 애벌레 + 박쥐
  4: ['w4_flame_slime', 'w4_small_dragon'],  // 화산: 불꽃슬라임 + 작은용
  5: ['w5_crab', 'w5_pufferfish'],           // 바다: 게 + 복어
  6: ['w6_cloud_fairy', 'w6_eagle'],         // 하늘: 구름요정 + 독수리
};
