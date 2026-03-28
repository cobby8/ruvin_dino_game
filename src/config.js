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
    LOW_VELOCITY: -495,       // 낮은 점프 (짧게 누르면) - 10% 추가 강화 (-450 → -495, 최대높이 ~153px)
    HIGH_VELOCITY: -632,      // 높은 점프 (오른쪽 터치/X키) - 80%로 하향 (-790 → -632, 최대높이 ~250px)
    DOUBLE_VELOCITY: -550,    // 2단 점프 (공중에서 한 번 더) - 강화: 낮은+2단(315px) > 높은(306px)으로 2단 가치 향상
    HOLD_THRESHOLD: 150,      // (레거시, 버튼 분리로 미사용) 짧게/길게 구분 기준 (밀리초)
  },

  // === 기본 속도/장애물 설정 (난이도 미선택 시 기본값) ===
  INITIAL_SPEED: 140,        // 처음 달리기 속도 (px/초) - 기본 = 씩씩한공룡 기준
  MAX_SPEED: 300,            // 최대 속도
  SPEED_INCREMENT: 5,        // 10점마다 이만큼 빨라짐 (2→5로 증가: 후반 속도감 강화)
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

  // === 별(star) 수집 시스템 ===
  STAR: {
    LIFE_BONUS_COUNT: 100,    // 별 100개 모으면 목숨 +1
  },

  // === [P3] 수집 아이템 설정 ===
  ITEMS: {
    STAR_POINTS: 1,           // 별 하나 먹으면 starCount +1
    SPAWN_CHANCE: 0.4,        // 장애물 스폰 시 아이템도 같이 나올 확률 (40%)
    HEART_CHANCE: 0.05,       // 하트 아이템 출현 확률 (5%)
    POWERUP_DURATION: 5000,   // 파워업 지속 시간 (5초)
    MAGNET_RANGE: 150,        // 자석 흡수 범위 (px)
    MAGNET_SPEED: 5,          // 자석 흡수 속도 (px/프레임)
  },

  // === [P3] 물음표 블록 설정 ===
  QUESTION_BLOCK: {
    SPAWN_CHANCE: 0.15,       // 블록 스폰 확률 (15%)
    HEIGHT_RATIO: 0.5,        // 화면 높이의 50% 위치에 배치
  },

  // === [P4] 스프링 점프대 설정 ===
  SPRING: {
    VELOCITY: -900,           // 스프링 점프 속도 (매우 높이 뜀!)
    SPAWN_CHANCE: 0.08,       // 기본 스폰 확률 (8%)
  },

  // === [P4] 부스트 구간 설정 ===
  BOOST: {
    SPEED_MULTIPLIER: 2.0,    // 부스트 중 속도 2배
    DURATION: 2000,           // 2초간 지속
    SPAWN_CHANCE: 0.06,       // 기본 스폰 확률 (6%)
  },

  // === 콤보 시스템 (연속 밟기/넘기 시 점수 배율 증가) ===
  COMBO: {
    TIMEOUT: 2000,        // 콤보 유지 시간 (2초 내에 다음 성공해야 유지)
    MAX_MULTIPLIER: 5,    // 최대 5배까지 배율 증가
    // 콤보 수에 따른 표시 메시지 (인덱스 = comboCount - 1)
    MESSAGES: ['', '2콤보!', '3콤보!', '4콤보!', '5콤보! MAX!'],
  },

  // === 칭찬 시스템 ===
  PRAISE_INTERVAL: 10,       // 10점마다 칭찬 메시지 표시
  PRAISE_MESSAGES: [
    '대단해!', '멋지다!', '최고야!',
    '루빈이 짱!', '와우!', '잘한다!',
    '대박!', '굿!', '천재다!',
  ],
};

// 공룡 종류별 정보 (이름, 색상, 텍스처 키, 특수능력)
// 각 공룡마다 고유 스킬이 있음 (마리오 vs 루이지처럼!)
export const DINOS = [
  {
    key: 'brachio', name: '브라키오', color: 0x6BCB77, hex: '#6BCB77',
    ability: 'highJump',       // 특수능력 코드
    abilityName: '높이뛰기',    // 화면에 표시할 능력 이름
    abilityDesc: '점프가 20% 더 높아요!', // 설명
  },
  {
    key: 'trex', name: '티라노', color: 0xFF8C42, hex: '#FF8C42',
    ability: 'strongStomp',
    abilityName: '강한밟기',
    abilityDesc: '밟기로 2배 점수!',
  },
  {
    key: 'tricera', name: '트리케라', color: 0x9B72CF, hex: '#9B72CF',
    ability: 'shield',
    abilityName: '단단한방패',
    abilityDesc: '시작할 때 방어막 1개!',
  },
  {
    key: 'ptera', name: '프테라노', color: 0x4EAEFF, hex: '#4EAEFF',
    ability: 'glide',
    abilityName: '활강',
    abilityDesc: '점프 후 천천히 내려와요!',
  },
];
