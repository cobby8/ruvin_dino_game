/**
 * config.js - 게임 규칙집
 * 게임의 모든 숫자 설정을 한 곳에 모아둠
 * (나중에 밸런스 조정할 때 이 파일만 수정하면 됨)
 */

export const GAME = {
  // === 물리 설정 ===
  GRAVITY: 800,              // 중력 세기 (높을수록 빨리 떨어짐)
  GROUND_Y_RATIO: 0.82,      // 바닥 위치: 화면 높이의 82% 지점

  // === 점프 설정 (3종: 낮은/높은/2단) ===
  JUMP: {
    LOW_VELOCITY: -450,       // 낮은 점프 (짧게 누르면) - 50% 대폭 향상 (-300 → -450, 최대높이 126px)
    HIGH_VELOCITY: -700,      // 높은 점프 (길게 누르면) - 50% 대폭 향상 (-300 → -700, 최대높이 306px)
    DOUBLE_VELOCITY: -500,    // 2단 점프 (공중에서 한 번 더) - 50% 대폭 향상 (-350 → -500)
    HOLD_THRESHOLD: 100,      // 짧게/길게 구분 기준 (밀리초). 100ms 이상이면 '길게'
  },

  // === 기본 속도/장애물 설정 (난이도 미선택 시 기본값) ===
  INITIAL_SPEED: 140,        // 처음 달리기 속도 (px/초) - 기본 = 씩씩한공룡 기준
  MAX_SPEED: 300,            // 최대 속도
  SPEED_INCREMENT: 2,        // 10점마다 이만큼 빨라짐
  OBSTACLE_GAP_MIN: 1800,    // 장애물 사이 최소 간격 (밀리초)
  OBSTACLE_GAP_MAX: 3000,    // 장애물 사이 최대 간격
  OBSTACLE_GAP_DECREASE: 50, // 난이도 올라갈 때 간격이 이만큼 줄어듦

  // === 캐릭터 설정 ===
  DINO_SIZE: 96,             // 공룡 그리기 기본 크기 (px) - 96px로 확대하여 디테일 향상
  DINO_SCALE: 1.0,           // 스프라이트 자체가 96px이므로 확대 불필요

  // === 하트(HP) 시스템 ===
  HEART: {
    DEFAULT_MAX: 3,            // 기본 최대 하트 수 (난이도별로 덮어씀)
    INVINCIBLE_DURATION: 2000, // 피격 후 무적 시간 (2초) - 이 동안 다시 안 맞음
    BLINK_INTERVAL: 100,       // 무적 중 깜빡이는 간격 (ms) - 100ms마다 투명/불투명 전환
  },

  // === 슬라이드(구르기) 설정 ===
  SLIDE: {
    DURATION: 800,               // 슬라이드 지속 시간 (0.8초 후 자동 복귀)
    HITBOX_HEIGHT_RATIO: 0.4,    // 슬라이드 중 히트박스 높이 비율 (몸을 40%로 낮춤)
  },

  // === 칭찬 시스템 ===
  PRAISE_INTERVAL: 10,       // 10점마다 칭찬 메시지 표시
  PRAISE_MESSAGES: [
    '대단해!', '멋지다!', '최고야!',
    '루빈이 짱!', '와우!', '잘한다!',
    '대박!', '굿!', '천재다!',
  ],
};

// 공룡 종류별 정보 (이름, 색상, 텍스처 키)
export const DINOS = [
  { key: 'brachio',   name: '브라키오',   color: 0x6BCB77, hex: '#6BCB77' },
  { key: 'trex',      name: '티라노',     color: 0xFF8C42, hex: '#FF8C42' },
  { key: 'tricera',   name: '트리케라',   color: 0x9B72CF, hex: '#9B72CF' },
  { key: 'ptera',     name: '프테라노',   color: 0x4EAEFF, hex: '#4EAEFF' },
];
