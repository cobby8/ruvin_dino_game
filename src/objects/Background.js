/**
 * Background.js - 패럴랙스 배경 (레이어가 다른 속도로 스크롤)
 * 4개 레이어가 뒤에서 앞으로 겹쳐져서 입체감을 줌
 * (먼 산은 천천히, 가까운 풀밭은 빨리 움직이는 것처럼)
 *
 * 페이즈 2: 6개 월드별로 다른 배경 테마 지원
 * - 풀밭: 파란하늘 + 흰구름 + 연녹산 + 꽃풀밭
 * - 사막: 노란하늘 + 모래바람 + 갈색언덕 + 모래바닥
 * - 숲: 연녹하늘 + 나뭇잎 + 짙은녹산 + 진녹바닥
 * - 화산: 주황하늘 + 연기 + 붉은산 + 갈색바닥
 * - 바다: 파란하늘 + 물거품 + 파도 + 바다색바닥
 * - 하늘: 보라하늘 + 별 + 구름산 + 구름바닥
 */

import { WORLDS } from '../data/worlds.js';

/**
 * 색상 값에서 RGB 추출하는 헬퍼
 * @param {number} color - 0xRRGGBB 형식
 * @returns {{ r: number, g: number, b: number }}
 */
function extractRGB(color) {
  return {
    r: (color >> 16) & 0xFF,
    g: (color >> 8) & 0xFF,
    b: color & 0xFF,
  };
}

/**
 * 모든 월드의 배경 텍스처를 생성하여 등록
 * BootScene에서 한 번 호출 → 6개 월드 x 4레이어 = 24개 텍스처
 * @param {Phaser.Scene} scene
 */
export function createAllBackgroundTextures(scene) {
  const w = 480; // 텍스처 너비 (타일링 단위)
  const h = 200; // 텍스처 높이

  // 각 월드별로 4개 레이어 텍스처 생성
  WORLDS.forEach(world => {
    const wid = world.id;

    // --- 1) 하늘 레이어 (위→아래 그라디언트) ---
    _createSkyTexture(scene, wid, world.skyTop, world.skyBottom, w, h);

    // --- 2) 구름/원경 레이어 ---
    _createCloudTexture(scene, wid, world, w, h);

    // --- 3) 산 레이어 ---
    _createMountainTexture(scene, wid, world.mountainColors, w, h);

    // --- 4) 바닥(풀밭/모래/등) 레이어 ---
    _createGroundTexture(scene, wid, world, w);
  });
}

// === 기존 단일 월드 함수 유지 (하위호환) ===
export function createBackgroundTextures(scene) {
  createAllBackgroundTextures(scene);
}

/**
 * 하늘 텍스처 생성 (세로 그라디언트)
 */
function _createSkyTexture(scene, wid, topColor, bottomColor, w, h) {
  const g = scene.add.graphics();
  const steps = 20;
  const top = extractRGB(topColor);
  const bot = extractRGB(bottomColor);

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(top.r + (bot.r - top.r) * t);
    const gv = Math.round(top.g + (bot.g - top.g) * t);
    const b = Math.round(top.b + (bot.b - top.b) * t);
    const color = (r << 16) | (gv << 8) | b;
    g.fillStyle(color);
    g.fillRect(0, (h / steps) * i, w, (h / steps) + 1);
  }

  g.generateTexture(`bg_sky_w${wid}`, w, h);
  g.destroy();
}

/**
 * 구름/원경 텍스처 생성 (월드별 특색)
 */
function _createCloudTexture(scene, wid, world, w, h) {
  const g = scene.add.graphics();
  const cc = world.cloudColor;

  if (wid === 1) {
    // 풀밭: 뭉게구름
    g.fillStyle(cc, 0.85);
    g.fillCircle(60, 70, 24); g.fillCircle(82, 60, 30);
    g.fillCircle(108, 65, 26); g.fillCircle(92, 76, 22);
    g.fillStyle(cc, 0.4); g.fillCircle(78, 54, 14);
    g.fillStyle(cc, 0.8);
    g.fillCircle(260, 50, 20); g.fillCircle(282, 42, 28);
    g.fillCircle(305, 48, 22); g.fillCircle(290, 58, 18);
    g.fillStyle(cc, 0.75);
    g.fillCircle(410, 75, 16); g.fillCircle(430, 68, 22); g.fillCircle(448, 74, 14);
  } else if (wid === 2) {
    // 사막: 모래바람 (흩어진 가로 줄무늬 + 작은 점)
    g.fillStyle(cc, 0.3);
    for (let i = 0; i < 8; i++) {
      const y = 40 + i * 18;
      g.fillRoundedRect(10 + i * 55, y, 60 + (i % 3) * 20, 4, 2);
    }
    // 모래 입자
    g.fillStyle(0xDDC080, 0.4);
    for (let i = 0; i < 20; i++) {
      g.fillCircle(24 * i + 10, 50 + (i % 5) * 25, 2);
    }
  } else if (wid === 3) {
    // 숲: 떠다니는 나뭇잎
    const leafColors = [0x6DB86B, 0x4A8C49, 0x88CC66];
    for (let i = 0; i < 12; i++) {
      g.fillStyle(leafColors[i % 3], 0.6);
      const lx = 40 * i + 10;
      const ly = 40 + (i % 4) * 35;
      // 잎 모양 (타원 2개 교차)
      g.fillEllipse(lx, ly, 12, 6);
      g.fillEllipse(lx + 3, ly - 3, 6, 10);
    }
    // 작은 구름도 약간
    g.fillStyle(cc, 0.5);
    g.fillCircle(200, 50, 18); g.fillCircle(220, 44, 22); g.fillCircle(238, 50, 16);
  } else if (wid === 4) {
    // 화산: 연기 (회색/갈색 반투명 원)
    const smokeColors = [0x888888, 0x999988, 0xAA9988];
    for (let i = 0; i < 10; i++) {
      g.fillStyle(smokeColors[i % 3], 0.3 + (i % 3) * 0.1);
      g.fillCircle(48 * i + 20, 55 + (i % 3) * 30, 14 + (i % 4) * 6);
    }
    // 불꽃 파티클 (주황/빨강 작은 점)
    g.fillStyle(0xFF6600, 0.5);
    for (let i = 0; i < 8; i++) {
      g.fillCircle(60 * i + 15, 80 + (i % 3) * 20, 3);
    }
  } else if (wid === 5) {
    // 바다: 물거품 (파란/흰 작은 원)
    g.fillStyle(0xFFFFFF, 0.6);
    for (let i = 0; i < 15; i++) {
      g.fillCircle(32 * i + 8, 60 + (i % 4) * 28, 5 + (i % 3) * 4);
    }
    g.fillStyle(cc, 0.4);
    g.fillCircle(100, 45, 20); g.fillCircle(120, 40, 16);
    g.fillCircle(300, 55, 18); g.fillCircle(320, 48, 22);
  } else if (wid === 6) {
    // 하늘: 별 (노란 작은 점 + 반짝임)
    g.fillStyle(0xFFD700, 0.8);
    for (let i = 0; i < 20; i++) {
      const sx = 24 * i + 5;
      const sy = 30 + (i * 7) % 130;
      const sr = 1.5 + (i % 3);
      g.fillCircle(sx, sy, sr);
    }
    // 큰 별 몇 개
    g.fillStyle(0xFFA0FF, 0.6);
    g.fillCircle(80, 50, 6); g.fillCircle(250, 70, 5); g.fillCircle(400, 40, 7);
    // 구름 약간
    g.fillStyle(cc, 0.4);
    g.fillCircle(160, 80, 20); g.fillCircle(180, 74, 16); g.fillCircle(195, 82, 14);
  }

  g.generateTexture(`bg_cloud_w${wid}`, w, h);
  g.destroy();
}

/**
 * 산 텍스처 생성 (뒷산 + 앞산)
 */
function _createMountainTexture(scene, wid, colors, w, h) {
  const g = scene.add.graphics();

  // 뒷산
  g.fillStyle(colors[0], 0.7);
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, h * 0.55);
  g.lineTo(40, h * 0.35); g.lineTo(80, h * 0.45);
  g.lineTo(120, h * 0.25); g.lineTo(160, h * 0.4);
  g.lineTo(200, h * 0.5); g.lineTo(250, h * 0.3);
  g.lineTo(300, h * 0.42); g.lineTo(350, h * 0.28);
  g.lineTo(400, h * 0.38); g.lineTo(440, h * 0.32);
  g.lineTo(w, h * 0.45); g.lineTo(w, h);
  g.closePath(); g.fillPath();

  // 앞산
  g.fillStyle(colors[1], 0.8);
  g.beginPath();
  g.moveTo(0, h);
  g.lineTo(0, h * 0.6); g.lineTo(50, h * 0.5);
  g.lineTo(100, h * 0.55); g.lineTo(150, h * 0.42);
  g.lineTo(200, h * 0.55); g.lineTo(260, h * 0.48);
  g.lineTo(320, h * 0.56); g.lineTo(380, h * 0.44);
  g.lineTo(430, h * 0.52); g.lineTo(w, h * 0.58);
  g.lineTo(w, h);
  g.closePath(); g.fillPath();

  // 월드별 추가 디테일
  if (wid === 4) {
    // 화산: 산 꼭대기에 용암 빛 (주황/빨강 점)
    g.fillStyle(0xFF4500, 0.5);
    g.fillCircle(120, h * 0.25, 8);
    g.fillCircle(350, h * 0.28, 6);
    g.fillStyle(0xFFAA00, 0.4);
    g.fillCircle(120, h * 0.22, 5);
    g.fillCircle(350, h * 0.25, 4);
  } else if (wid === 5) {
    // 바다: 파도 곡선 (산을 파도로 표현)
    g.fillStyle(0x4AA8D0, 0.3);
    for (let i = 0; i < 10; i++) {
      g.fillCircle(48 * i + 24, h * 0.55, 12);
    }
  }

  g.generateTexture(`bg_mountain_w${wid}`, w, h);
  g.destroy();
}

/**
 * 바닥 텍스처 생성 (월드별 특색)
 */
function _createGroundTexture(scene, wid, world, w) {
  const g = scene.add.graphics();
  const grassH = 40;

  // 바닥 기본 색상
  g.fillStyle(world.groundColor);
  g.fillRect(0, 0, w, grassH);

  // 상단 약간 밝게 (그라디언트 느낌)
  g.fillStyle(world.groundDarkColor, 0.3);
  g.fillRect(0, grassH - 10, w, 10);

  // 월드별 장식
  if (wid === 1) {
    // 풀밭: 풀 + 꽃
    _drawGrassDecoration(g, w, world.decorations);
  } else if (wid === 2) {
    // 사막: 모래알갱이 + 작은 돌
    g.fillStyle(0xD4B06A, 0.5);
    for (let i = 0; i < 40; i++) {
      g.fillCircle((i * 12 + 5) % w, 5 + (i % 4) * 8, 1.5);
    }
    // 갈라진 금 무늬
    g.lineStyle(1, 0xC9A84E, 0.4);
    for (let i = 0; i < 6; i++) {
      g.lineBetween(80 * i, 15, 80 * i + 30, 25);
    }
  } else if (wid === 3) {
    // 숲: 풀 + 낙엽 + 꽃
    _drawGrassDecoration(g, w, world.decorations);
    // 낙엽 (갈색/주황 작은 타원)
    g.fillStyle(0xCC8844, 0.5);
    for (let i = 0; i < 8; i++) {
      g.fillEllipse((i * 60 + 25) % w, 8, 5, 3);
    }
  } else if (wid === 4) {
    // 화산: 갈라진 땅 + 용암 빛
    g.lineStyle(1.5, 0xFF4500, 0.3);
    for (let i = 0; i < 8; i++) {
      g.lineBetween(60 * i, 10, 60 * i + 20, 30);
    }
    // 작은 돌
    g.fillStyle(0x6B3A1A, 0.6);
    for (let i = 0; i < 15; i++) {
      g.fillCircle((i * 32 + 10) % w, 12 + (i % 3) * 8, 2 + (i % 2));
    }
  } else if (wid === 5) {
    // 바다: 파도 무늬
    g.fillStyle(0x5098D0, 0.4);
    for (let i = 0; i < 12; i++) {
      g.fillCircle((i * 40 + 20) % w, 5, 18);
    }
    // 거품
    g.fillStyle(0xFFFFFF, 0.3);
    for (let i = 0; i < 20; i++) {
      g.fillCircle((i * 24 + 8) % w, 3 + (i % 3) * 4, 2);
    }
  } else if (wid === 6) {
    // 하늘: 구름 바닥 (솜뭉치)
    g.fillStyle(0xD8C0F0, 0.5);
    for (let i = 0; i < 16; i++) {
      g.fillCircle((i * 30 + 10) % w, 8, 10 + (i % 3) * 4);
    }
    // 별 가루
    if (world.decorations.flowers) {
      _drawGrassDecoration(g, w, world.decorations);
    }
  }

  g.generateTexture(`bg_grass_w${wid}`, w, grassH);
  g.destroy();
}

/**
 * 풀 + 꽃 장식을 그리는 공통 헬퍼
 */
function _drawGrassDecoration(g, w, deco) {
  // 풀 (삼각형)
  g.fillStyle(0x5BA83A);
  for (let i = 0; i < 30; i++) {
    const gx = (i * 16 + 3) % w;
    const gh = 6 + (i % 3) * 4;
    g.fillTriangle(gx, 0, gx + 2, -gh, gx + 4, 0);
  }

  // 꽃 (있으면)
  if (deco.flowers && deco.flowerColors) {
    for (let i = 0; i < 10; i++) {
      const fx = (i * 48 + 20) % w;
      const fc = deco.flowerColors[i % deco.flowerColors.length];
      g.lineStyle(1, 0x5BA83A);
      g.lineBetween(fx, 0, fx, -6);
      g.fillStyle(fc);
      g.fillCircle(fx, -7, 3);
      g.fillStyle(0xFFFF88);
      g.fillCircle(fx, -7, 1.2);
    }
  }
}

/**
 * 패럴랙스 배경 관리 클래스
 * 각 레이어가 서로 다른 속도로 스크롤되어 입체감 연출
 *
 * 페이즈 2: setWorld(worldId) 메서드로 월드 테마 교체 가능
 */
export class Background {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} groundY - 바닥 y좌표
   * @param {number} worldId - 월드 ID (1~6, 기본 1)
   */
  constructor(scene, groundY, worldId = 1) {
    this.scene = scene;
    this.currentWorldId = worldId;
    const { width, height } = scene.scale;

    // === depth 순서 규칙 ===
    // 0: 하늘 (가장 뒤)
    // 1: 구름
    // 2: 산 (원경)
    // 3: 풀밭/바닥
    // 5: 장애물 (배경보다 반드시 앞!)
    // 6: 공룡 (장애물보다 앞)
    // 10: HUD/UI 텍스트

    // 하늘 레이어 (고정 배경, 가장 뒤)
    this.sky = scene.add.tileSprite(0, 0, width, height, `bg_sky_w${worldId}`);
    this.sky.setOrigin(0, 0);
    this.sky.setDepth(0);

    // 구름 레이어 (하늘 바로 위, 장애물보다 훨씬 뒤)
    this.clouds = scene.add.tileSprite(0, 0, width, 200, `bg_cloud_w${worldId}`);
    this.clouds.setOrigin(0, 0);
    this.clouds.setDepth(1);
    this.clouds.setAlpha(0.5);  // 투명도 낮춰서 시야 확보
    this.cloudSpeed = 0.2;

    // 산 레이어 (중간 속도, 장애물보다 뒤)
    this.mountains = scene.add.tileSprite(0, groundY - 180, width, 200, `bg_mountain_w${worldId}`);
    this.mountains.setOrigin(0, 0);
    this.mountains.setDepth(2);
    this.mountainSpeed = 0.4;

    // 바닥 레이어 (게임 속도와 동일, 장애물보다 뒤)
    this.grass = scene.add.tileSprite(0, groundY, width, 40, `bg_grass_w${worldId}`);
    this.grass.setOrigin(0, 0);
    this.grass.setDepth(3);
    this.grassSpeed = 1.0;
  }

  /**
   * 월드 테마를 교체 (텍스처만 바꿈)
   * @param {number} worldId - 1~6
   */
  setWorld(worldId) {
    if (this.currentWorldId === worldId) return;
    this.currentWorldId = worldId;

    this.sky.setTexture(`bg_sky_w${worldId}`);
    this.clouds.setTexture(`bg_cloud_w${worldId}`);
    this.mountains.setTexture(`bg_mountain_w${worldId}`);
    this.grass.setTexture(`bg_grass_w${worldId}`);
  }

  /**
   * 매 프레임 호출: 각 레이어를 서로 다른 속도로 스크롤
   * @param {number} speed - 현재 게임 속도
   * @param {number} delta - 프레임 경과 시간 (ms)
   */
  update(speed, delta) {
    const dt = delta / 1000;
    // 경과 시간 누적 (풀밭 흔들림 계산용)
    this._elapsed = (this._elapsed || 0) + delta;

    this.sky.tilePositionX += speed * 0.05 * dt;
    // 구름: 게임 속도의 0.2배로 천천히 스크롤
    this.clouds.tilePositionX += speed * this.cloudSpeed * dt;
    this.mountains.tilePositionX += speed * this.mountainSpeed * dt;
    this.grass.tilePositionX += speed * this.grassSpeed * dt;

    // 풀밭 장식 흔들림: sin파로 tilePositionY를 살짝 변화시켜
    // 풀이 바람에 흔들리는 느낌을 줌 (진폭 2px)
    this.grass.tilePositionY = Math.sin(this._elapsed / 500) * 2;
  }

  /**
   * 화면 크기 변경 시 레이어 크기 재조정
   */
  resize(width, groundY) {
    this.sky.width = width;
    this.sky.height = this.scene.scale.height;
    this.clouds.width = width;
    this.mountains.width = width;
    this.mountains.y = groundY - 180;
    this.grass.width = width;
    this.grass.y = groundY;
  }
}
