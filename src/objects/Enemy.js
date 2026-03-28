/**
 * Enemy.js - 적 캐릭터 시스템
 *
 * 3개 파트로 구성:
 * 1. EnemyGraphics: 각 적의 텍스처를 코드로 그려서 생성 (BootScene에서 호출)
 * 2. Enemy: 개별 적 캐릭터 (Phaser Sprite 상속, 이동 + 피격 로직)
 * 3. EnemyManager: 적 오브젝트 풀링 + 스폰 관리
 *
 * 모든 적은 큰 눈 + 2프레임 애니메이션으로 6살 친화적 외형
 */

import Phaser from 'phaser';
import { ENEMIES, WORLD_ENEMIES } from '../data/enemies.js';

// ============================================================
// Part 1: EnemyGraphics - 적 캐릭터 텍스처 생성
// ============================================================

/**
 * 모든 적 캐릭터의 텍스처를 생성 (BootScene에서 호출)
 * 각 적은 2프레임 스프라이트시트로 생성됨 (걷기1/걷기2 또는 날기1/날기2)
 * @param {Phaser.Scene} scene
 */
export function createAllEnemyTextures(scene) {
  // 모든 적 데이터를 순회하며 텍스처 + 애니메이션 생성
  Object.keys(ENEMIES).forEach(key => {
    const data = ENEMIES[key];
    const textureKey = `enemy_${key}`;
    const { width, height } = data;

    // 2프레임 스프라이트시트 (가로로 2프레임 연결)
    const totalWidth = width * 2;
    const g = scene.add.graphics();

    // 프레임 1 그리기
    _drawEnemy(g, key, 0, 0, width, height, false);
    // 프레임 2 그리기 (약간 다른 포즈)
    _drawEnemy(g, key, width, 0, width, height, true);

    g.generateTexture(textureKey, totalWidth, height);
    g.destroy();

    // 애니메이션 등록 (2프레임 반복)
    scene.anims.create({
      key: `${textureKey}_move`,
      frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: 1 }),
      frameRate: 4,     // 초당 4프레임 (느긋한 애니메이션)
      repeat: -1,       // 무한 반복
    });
  });
}

/**
 * 공통 눈 그리기 함수 (모든 적에 크고 귀여운 눈)
 * @param {Phaser.GameObjects.Graphics} g - Graphics 객체
 * @param {number} x - 눈 중심 x
 * @param {number} y - 눈 중심 y
 * @param {number} size - 눈 크기 (반지름)
 */
function _drawEye(g, x, y, size) {
  // 흰자 (크고 둥근)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x, y, size);
  // 검은 외곽
  g.lineStyle(1, 0x000000, 0.8);
  g.strokeCircle(x, y, size);
  // 동공 (검정, 살짝 아래쪽)
  g.fillStyle(0x000000);
  g.fillCircle(x + size * 0.1, y + size * 0.15, size * 0.5);
  // 하이라이트 (반짝이는 점)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.2);
}

/**
 * 적 캐릭터 하나를 그리는 함수 (키에 따라 분기)
 * @param {Phaser.GameObjects.Graphics} g
 * @param {string} key - 적 키 (예: 'w2_scorpion')
 * @param {number} ox - 오프셋 x (프레임 위치)
 * @param {number} oy - 오프셋 y
 * @param {number} w - 프레임 너비
 * @param {number} h - 프레임 높이
 * @param {boolean} alt - true면 두 번째 프레임 (다른 포즈)
 */
function _drawEnemy(g, key, ox, oy, w, h, alt) {
  switch (key) {
    case 'w2_scorpion': _drawScorpion(g, ox, oy, w, h, alt); break;
    case 'w3_caterpillar': _drawCaterpillar(g, ox, oy, w, h, alt); break;
    case 'w3_bat': _drawBat(g, ox, oy, w, h, alt); break;
    case 'w4_flame_slime': _drawFlameSlime(g, ox, oy, w, h, alt); break;
    case 'w4_small_dragon': _drawSmallDragon(g, ox, oy, w, h, alt); break;
    case 'w5_crab': _drawCrab(g, ox, oy, w, h, alt); break;
    case 'w5_pufferfish': _drawPufferfish(g, ox, oy, w, h, alt); break;
    case 'w6_cloud_fairy': _drawCloudFairy(g, ox, oy, w, h, alt); break;
    case 'w6_eagle': _drawEagle(g, ox, oy, w, h, alt); break;
  }
}

// --- 전갈 (사막): 갈색 몸 + 집게 + 곡선 꼬리 ---
function _drawScorpion(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 몸통 (타원형 갈색)
  g.fillStyle(0x8B4513);
  g.fillEllipse(cx, cy + 4, 22, 14);
  // 꼬리 (위로 곡선, alt이면 살짝 다른 각도)
  g.lineStyle(3, 0x8B4513);
  const tailTip = alt ? -12 : -14;
  g.lineBetween(cx + 8, cy, cx + 14, cy + tailTip);
  g.lineBetween(cx + 14, cy + tailTip, cx + 12, cy + tailTip - 4);
  // 독침 (빨간 점)
  g.fillStyle(0xFF0000);
  g.fillCircle(cx + 12, cy + tailTip - 5, 2);
  // 집게 (좌우)
  g.fillStyle(0xA0522D);
  const clampY = alt ? cy - 2 : cy;
  g.fillEllipse(cx - 14, clampY, 8, 5);
  g.fillEllipse(cx + 14, clampY, 8, 5);
  // 다리 (3쌍)
  g.lineStyle(1.5, 0x6B3410);
  for (let i = -1; i <= 1; i++) {
    const legY = alt ? 3 : 1;
    g.lineBetween(cx + i * 6, cy + 6, cx + i * 6 - 4, cy + 12 + legY);
    g.lineBetween(cx + i * 6, cy + 6, cx + i * 6 + 4, cy + 12 + legY);
  }
  // 큰 눈 (귀여움 포인트!)
  _drawEye(g, cx - 5, cy - 2, 4);
  _drawEye(g, cx + 3, cy - 2, 4);
}

// --- 애벌레 (숲): 녹색 동그란 마디 3~4개 ---
function _drawCaterpillar(g, ox, oy, w, h, alt) {
  const baseY = oy + h - 8;
  // 마디 4개 (뒤→앞 순서로 그려서 앞이 위에)
  const segments = 4;
  for (let i = 0; i < segments; i++) {
    // alt이면 마디가 위아래로 살짝 움직임 (꿈틀꿈틀)
    const bobY = alt ? (i % 2 === 0 ? -2 : 2) : (i % 2 === 0 ? 1 : -1);
    const sx = ox + 6 + i * 10;
    const sy = baseY + bobY;
    // 마디 몸 (뒤로 갈수록 약간 작게)
    const radius = 6 - i * 0.3;
    g.fillStyle(i === 0 ? 0x32CD32 : 0x228B22); // 머리는 밝은 녹색
    g.fillCircle(sx, sy, radius);
    // 마디 하이라이트
    g.fillStyle(0x7CFC00, 0.4);
    g.fillCircle(sx - 1, sy - 2, radius * 0.4);
  }
  // 머리(맨 앞 마디)에 큰 눈
  _drawEye(g, ox + 4, baseY - 4 + (alt ? -2 : 1), 3.5);
  _drawEye(g, ox + 10, baseY - 4 + (alt ? -2 : 1), 3.5);
  // 더듬이
  g.lineStyle(1, 0x006400);
  const antY = alt ? baseY - 10 : baseY - 12;
  g.lineBetween(ox + 5, baseY - 5, ox + 2, antY);
  g.lineBetween(ox + 9, baseY - 5, ox + 12, antY);
  // 더듬이 끝 둥글게
  g.fillStyle(0xFF6347);
  g.fillCircle(ox + 2, antY, 1.5);
  g.fillCircle(ox + 12, antY, 1.5);
}

// --- 박쥐 (숲): 보라 몸 + V자 날개 ---
function _drawBat(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 몸통 (작은 타원)
  g.fillStyle(0x4B0082);
  g.fillEllipse(cx, cy + 2, 12, 14);
  // 날개 (V자 모양, alt이면 접힘/펼침)
  g.fillStyle(0x6A0DAD);
  if (alt) {
    // 날개 접힘 (아래로)
    g.beginPath();
    g.moveTo(cx - 5, cy - 2);
    g.lineTo(cx - 16, cy + 8);
    g.lineTo(cx - 12, cy + 2);
    g.lineTo(cx - 5, cy + 4);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 5, cy - 2);
    g.lineTo(cx + 16, cy + 8);
    g.lineTo(cx + 12, cy + 2);
    g.lineTo(cx + 5, cy + 4);
    g.closePath(); g.fillPath();
  } else {
    // 날개 펼침 (위로)
    g.beginPath();
    g.moveTo(cx - 5, cy);
    g.lineTo(cx - 16, cy - 10);
    g.lineTo(cx - 12, cy - 4);
    g.lineTo(cx - 5, cy + 2);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 5, cy);
    g.lineTo(cx + 16, cy - 10);
    g.lineTo(cx + 12, cy - 4);
    g.lineTo(cx + 5, cy + 2);
    g.closePath(); g.fillPath();
  }
  // 귀 (뾰족)
  g.fillStyle(0x4B0082);
  g.fillTriangle(cx - 4, cy - 5, cx - 7, cy - 12, cx - 1, cy - 5);
  g.fillTriangle(cx + 4, cy - 5, cx + 7, cy - 12, cx + 1, cy - 5);
  // 큰 눈 (빨간 느낌)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(cx - 3, cy - 1, 3.5);
  g.fillCircle(cx + 3, cy - 1, 3.5);
  g.fillStyle(0xFF0000);
  g.fillCircle(cx - 2.5, cy - 0.5, 1.8);
  g.fillCircle(cx + 3.5, cy - 0.5, 1.8);
  g.fillStyle(0xFFFFFF);
  g.fillCircle(cx - 3, cy - 1.5, 0.8);
  g.fillCircle(cx + 3, cy - 1.5, 0.8);
}

// --- 불꽃슬라임 (화산): 주황 젤리 + 불꽃 ---
function _drawFlameSlime(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 불꽃 이펙트 (위쪽에 흔들리는 불꽃)
  g.fillStyle(0xFFAA00, 0.7);
  const flameOff = alt ? 2 : -2;
  g.fillTriangle(cx - 6 + flameOff, cy - 6, cx - 3, cy - 16, cx + flameOff, cy - 6);
  g.fillTriangle(cx + 2 + flameOff, cy - 8, cx + 5, cy - 18, cx + 8 + flameOff, cy - 8);
  g.fillStyle(0xFF4500, 0.5);
  g.fillTriangle(cx - 2, cy - 6, cx, cy - 14, cx + 2, cy - 6);
  // 젤리 몸통 (둥글둥글)
  g.fillStyle(0xFF4500);
  g.fillEllipse(cx, cy + 4, 24, 20);
  // 젤리 하이라이트 (반짝)
  g.fillStyle(0xFF8C00, 0.6);
  g.fillEllipse(cx - 4, cy, 8, 10);
  // 밑면 (살짝 어두움)
  g.fillStyle(0xCC3300, 0.5);
  g.fillEllipse(cx, cy + 10, 20, 6);
  // 큰 눈
  _drawEye(g, cx - 5, cy + 1, 4);
  _drawEye(g, cx + 5, cy + 1, 4);
  // 입 (웃는 모양)
  g.lineStyle(1.5, 0x000000, 0.6);
  g.beginPath();
  g.arc(cx, cy + 7, 4, 0, Math.PI, false);
  g.strokePath();
}

// --- 작은용 (화산): 빨간 몸 + 작은 날개 + 뿔 ---
function _drawSmallDragon(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 몸통
  g.fillStyle(0xFF6347);
  g.fillEllipse(cx, cy + 2, 22, 18);
  // 배 (밝은 색)
  g.fillStyle(0xFFA07A, 0.7);
  g.fillEllipse(cx, cy + 6, 14, 10);
  // 날개 (작고 귀여운)
  g.fillStyle(0xFF4500);
  if (alt) {
    // 날개 위로
    g.beginPath();
    g.moveTo(cx - 8, cy - 2);
    g.lineTo(cx - 18, cy - 12);
    g.lineTo(cx - 6, cy - 6);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 8, cy - 2);
    g.lineTo(cx + 18, cy - 12);
    g.lineTo(cx + 6, cy - 6);
    g.closePath(); g.fillPath();
  } else {
    // 날개 아래로
    g.beginPath();
    g.moveTo(cx - 8, cy);
    g.lineTo(cx - 16, cy + 4);
    g.lineTo(cx - 6, cy + 4);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 8, cy);
    g.lineTo(cx + 16, cy + 4);
    g.lineTo(cx + 6, cy + 4);
    g.closePath(); g.fillPath();
  }
  // 뿔 (2개)
  g.fillStyle(0xFFD700);
  g.fillTriangle(cx - 4, cy - 8, cx - 2, cy - 16, cx, cy - 8);
  g.fillTriangle(cx + 4, cy - 8, cx + 2, cy - 16, cx + 6, cy - 8);
  // 큰 눈
  _drawEye(g, cx - 5, cy - 2, 4);
  _drawEye(g, cx + 5, cy - 2, 4);
  // 콧구멍 (빨간 점 2개)
  g.fillStyle(0xCC0000);
  g.fillCircle(cx - 2, cy + 3, 1.2);
  g.fillCircle(cx + 2, cy + 3, 1.2);
}

// --- 게 (바다): 빨간 몸 + 집게 2개 + 다리 ---
function _drawCrab(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 몸통 (넓적한 타원)
  g.fillStyle(0xDC143C);
  g.fillEllipse(cx, cy + 2, 24, 16);
  // 몸통 하이라이트
  g.fillStyle(0xFF6B6B, 0.4);
  g.fillEllipse(cx, cy - 1, 16, 8);
  // 집게 (좌우, alt이면 벌렸다/닫혔다)
  g.fillStyle(0xB22222);
  if (alt) {
    // 집게 벌림
    g.fillEllipse(cx - 18, cy - 6, 10, 7);
    g.fillEllipse(cx - 16, cy - 10, 6, 4);
    g.fillEllipse(cx + 18, cy - 6, 10, 7);
    g.fillEllipse(cx + 16, cy - 10, 6, 4);
  } else {
    // 집게 닫힘
    g.fillEllipse(cx - 16, cy - 4, 10, 7);
    g.fillEllipse(cx - 15, cy - 8, 6, 4);
    g.fillEllipse(cx + 16, cy - 4, 10, 7);
    g.fillEllipse(cx + 15, cy - 8, 6, 4);
  }
  // 팔 (집게 연결)
  g.lineStyle(2.5, 0xB22222);
  g.lineBetween(cx - 10, cy, cx - 14, cy - 4);
  g.lineBetween(cx + 10, cy, cx + 14, cy - 4);
  // 다리 (3쌍)
  g.lineStyle(1.5, 0xA01010);
  for (let i = -1; i <= 1; i++) {
    const legShift = alt ? 2 : 0;
    g.lineBetween(cx + i * 6 - 3, cy + 7, cx + i * 6 - 7, cy + 12 + legShift);
    g.lineBetween(cx + i * 6 + 3, cy + 7, cx + i * 6 + 7, cy + 12 + legShift);
  }
  // 큰 눈 (위쪽으로 튀어나옴, 게 특유의 눈)
  g.lineStyle(2, 0xDC143C);
  g.lineBetween(cx - 5, cy - 5, cx - 5, cy - 10);
  g.lineBetween(cx + 5, cy - 5, cx + 5, cy - 10);
  _drawEye(g, cx - 5, cy - 12, 3);
  _drawEye(g, cx + 5, cy - 12, 3);
}

// --- 복어 (바다): 노란 둥근 몸 + 가시 + 볼 ---
function _drawPufferfish(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  const bodyR = alt ? 13 : 11; // alt이면 부풀어 오름
  // 몸통 (둥근)
  g.fillStyle(0xFFD700);
  g.fillCircle(cx, cy, bodyR);
  // 몸통 하이라이트
  g.fillStyle(0xFFFF00, 0.4);
  g.fillCircle(cx - 3, cy - 3, bodyR * 0.4);
  // 가시 (둘레에 삼각형)
  g.fillStyle(0xDAA520);
  const spikeCount = 8;
  for (let i = 0; i < spikeCount; i++) {
    const angle = (Math.PI * 2 / spikeCount) * i;
    const sx = cx + Math.cos(angle) * bodyR;
    const sy = cy + Math.sin(angle) * bodyR;
    const tx = cx + Math.cos(angle) * (bodyR + 5);
    const ty = cy + Math.sin(angle) * (bodyR + 5);
    const perpAngle = angle + Math.PI / 2;
    g.fillTriangle(
      sx + Math.cos(perpAngle) * 2, sy + Math.sin(perpAngle) * 2,
      sx - Math.cos(perpAngle) * 2, sy - Math.sin(perpAngle) * 2,
      tx, ty
    );
  }
  // 볼 (분홍 홍조)
  g.fillStyle(0xFFB6C1, 0.6);
  g.fillCircle(cx - 7, cy + 3, 3);
  g.fillCircle(cx + 7, cy + 3, 3);
  // 큰 눈
  _drawEye(g, cx - 4, cy - 2, 4);
  _drawEye(g, cx + 4, cy - 2, 4);
  // 입 (작고 동그란 O)
  g.lineStyle(1.5, 0x000000, 0.6);
  g.strokeCircle(cx, cy + 5, 2);
  // 지느러미 (옆에 작은 삼각형)
  g.fillStyle(0xFFA500, 0.7);
  g.fillTriangle(cx - bodyR, cy, cx - bodyR - 5, cy - 3, cx - bodyR - 3, cy + 4);
  g.fillTriangle(cx + bodyR, cy, cx + bodyR + 5, cy - 3, cx + bodyR + 3, cy + 4);
}

// --- 구름요정 (하늘): 보라 구름 + 번개 장식 ---
function _drawCloudFairy(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 구름 몸 (여러 원 겹쳐서 구름 모양)
  g.fillStyle(0xB0A0E8);
  g.fillCircle(cx - 6, cy + 2, 10);
  g.fillCircle(cx + 6, cy + 2, 10);
  g.fillCircle(cx, cy - 4, 10);
  // 구름 하이라이트
  g.fillStyle(0xD8C0F0, 0.6);
  g.fillCircle(cx - 3, cy - 6, 5);
  g.fillCircle(cx + 5, cy - 2, 4);
  // 번개 장식 (아래쪽에 작은 번개)
  g.fillStyle(0xFFD700);
  const boltX = alt ? cx + 2 : cx - 2;
  g.beginPath();
  g.moveTo(boltX, cy + 8);
  g.lineTo(boltX - 3, cy + 14);
  g.lineTo(boltX + 1, cy + 12);
  g.lineTo(boltX - 1, cy + 18);
  g.lineTo(boltX + 4, cy + 11);
  g.lineTo(boltX + 1, cy + 13);
  g.closePath(); g.fillPath();
  // 큰 눈 (무심한 표정)
  _drawEye(g, cx - 5, cy - 1, 4);
  _drawEye(g, cx + 5, cy - 1, 4);
  // 뺨 홍조
  g.fillStyle(0xFFB6C1, 0.5);
  g.fillCircle(cx - 9, cy + 3, 2.5);
  g.fillCircle(cx + 9, cy + 3, 2.5);
}

// --- 독수리 (하늘): 갈색 몸 + 넓은 날개 ---
function _drawEagle(g, ox, oy, w, h, alt) {
  const cx = ox + w / 2, cy = oy + h / 2;
  // 몸통 (유선형 타원)
  g.fillStyle(0x8B6914);
  g.fillEllipse(cx, cy + 2, 18, 16);
  // 배 (흰색)
  g.fillStyle(0xF5F5DC, 0.7);
  g.fillEllipse(cx, cy + 6, 10, 8);
  // 날개 (넓게 펼침, alt이면 위/아래)
  g.fillStyle(0x6B4F10);
  if (alt) {
    // 날개 위
    g.beginPath();
    g.moveTo(cx - 7, cy);
    g.lineTo(cx - 22, cy - 14);
    g.lineTo(cx - 18, cy - 8);
    g.lineTo(cx - 7, cy + 4);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 7, cy);
    g.lineTo(cx + 22, cy - 14);
    g.lineTo(cx + 18, cy - 8);
    g.lineTo(cx + 7, cy + 4);
    g.closePath(); g.fillPath();
  } else {
    // 날개 아래
    g.beginPath();
    g.moveTo(cx - 7, cy);
    g.lineTo(cx - 22, cy + 6);
    g.lineTo(cx - 16, cy + 2);
    g.lineTo(cx - 7, cy + 4);
    g.closePath(); g.fillPath();
    g.beginPath();
    g.moveTo(cx + 7, cy);
    g.lineTo(cx + 22, cy + 6);
    g.lineTo(cx + 16, cy + 2);
    g.lineTo(cx + 7, cy + 4);
    g.closePath(); g.fillPath();
  }
  // 부리 (노란색 뾰족)
  g.fillStyle(0xFFAA00);
  g.fillTriangle(cx - 2, cy - 2, cx + 2, cy - 2, cx, cy + 4);
  // 큰 눈 (날카로운 인상이지만 귀여운)
  _drawEye(g, cx - 5, cy - 3, 3.5);
  _drawEye(g, cx + 5, cy - 3, 3.5);
  // 눈썹 (날카로운 각도)
  g.lineStyle(1.5, 0x000000, 0.7);
  g.lineBetween(cx - 8, cy - 7, cx - 3, cy - 6);
  g.lineBetween(cx + 8, cy - 7, cx + 3, cy - 6);
}


// ============================================================
// Part 2: Enemy 클래스 - 개별 적 캐릭터
// ============================================================

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} textureKey - 'enemy_w2_scorpion' 등
   */
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 물리 설정
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // 적 데이터 참조 (나중에 setup()에서 설정)
    this.enemyData = null;
    this.enemyKey = '';
    this.alive = true;

    // 비행 적의 사인파 움직임용
    this.baseY = y;           // 기본 y 위치
    this.flyTime = 0;         // 사인파 시간 누적

    // depth: 장애물과 같은 레벨
    this.setDepth(5);
  }

  /**
   * 적 데이터로 초기화 (스폰 시 호출)
   * @param {string} enemyKey - 'w2_scorpion' 등
   * @param {number} x - 스폰 x
   * @param {number} y - 스폰 y (ground면 바닥, flying이면 비행 높이)
   * @param {number} gameSpeed - 현재 게임 속도
   */
  setup(enemyKey, x, y, gameSpeed) {
    this.enemyKey = enemyKey;
    this.enemyData = ENEMIES[enemyKey];
    this.alive = true;

    // 적 이미지 프레임 매핑 (img_enemies 스프라이트시트의 프레임 번호)
    const ENEMY_FRAME_MAP = {
      w2_scorpion: 0, w3_caterpillar: 1, w3_bat: 2,
      w4_flame_slime: 3, w4_small_dragon: 4,
      w5_crab: 5, w5_pufferfish: 6,
      w6_cloud_fairy: 7, w6_eagle: 8,
    };

    // 이미지 텍스처(PNG)가 있으면 사용, 없으면 기존 Graphics 텍스처
    const useImage = this.scene.textures.exists('img_enemies') && ENEMY_FRAME_MAP[enemyKey] !== undefined;

    if (useImage) {
      this.setTexture('img_enemies', ENEMY_FRAME_MAP[enemyKey]);
      // 적 크기 추가 2.5배 확대 (밟기 대상으로 확실히 보이게: 0.3 x 2.5 = 0.75)
      this.setScale(0.75);
    } else {
      const textureKey = `enemy_${enemyKey}`;
      this.setTexture(textureKey, 0);
      // Graphics 적도 추가 2.5배 확대 (6.25 x 2.5 = 15.6)
      this.setScale(15.6, 15.6);
    }

    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setAlpha(1);
    this.body.enable = true;

    // 이동 속도: 게임 기본 속도 + 적 자체 속도
    const totalSpeed = gameSpeed + this.enemyData.speed;
    this.body.setVelocityX(-totalSpeed);

    // 비행 적의 기본 y 저장
    this.baseY = y;
    this.flyTime = Math.random() * Math.PI * 2; // 랜덤 시작 위상

    // 관대한 히트박스 (6살 배려: 중심부만 판정, 가장자리는 안전)
    // 이미지 사용 시 원본 크기 기준으로 설정 (스케일이 자동 적용됨)
    if (useImage) {
      const bodyW = 160 * 0.35;   // 적 중심부만 판정 (데미지 범위 축소)
      const bodyH = 160 * 0.35;   // 밟기는 top+40 허용으로 넉넉
      this.body.setSize(bodyW, bodyH);
      // 히트박스를 이미지 상단으로! (적 그래픽이 프레임 상단에 위치)
      // 기존: (720-bodyH)/2 = 336px (정중앙) → 변경: 30px (상단 근처)
      this.body.setOffset((160 - bodyW) / 2, 30);
    } else {
      const bodyW = this.enemyData.width * 0.4;
      const bodyH = this.enemyData.height * 0.4;
      this.body.setSize(bodyW, bodyH);
      this.body.setOffset(
        (this.enemyData.width - bodyW) / 2,
        (this.enemyData.height - bodyH) / 2
      );
    }

    // 애니메이션: 이미지는 단일 프레임이라 애니메이션 없음 (정지 이미지로 표시)
    if (!useImage) {
      const textureKey = `enemy_${enemyKey}`;
      this.play(`${textureKey}_move`, true);
    }
  }

  /**
   * 매 프레임 호출: 비행 적의 사인파 움직임
   * @param {number} delta - 프레임 간격 (ms)
   */
  updateMovement(delta) {
    if (!this.active || !this.alive) return;

    // flying 타입만 사인파 움직임 적용
    if (this.enemyData && this.enemyData.type === 'flying') {
      this.flyTime += delta * 0.003; // 속도 조절
      const amplitude = this.enemyData.amplitude || 30;
      this.y = this.baseY + Math.sin(this.flyTime) * amplitude;
    }
  }

  /**
   * 적 처치! 납작해지는 애니메이션 후 비활성화
   */
  defeat() {
    if (!this.alive) return;
    this.alive = false;

    // 이동 정지
    this.body.setVelocityX(0);
    this.body.setVelocityY(0);
    this.body.enable = false;

    // 납작해지는 애니메이션 (scaleY가 0으로)
    this.scene.tweens.add({
      targets: this,
      scaleY: 0,
      scaleX: 1.3, // 옆으로 살짝 늘어남 (찌그러지는 느낌)
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.setActive(false).setVisible(false);
      },
    });
  }
}


// ============================================================
// Part 3: EnemyManager - 적 풀링 + 스폰 관리
// ============================================================

export class EnemyManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} worldId - 현재 월드 ID (1~6)
   */
  constructor(scene, worldId = 1) {
    this.scene = scene;

    // 물리 그룹 (모든 적을 묶어서 관리)
    this.group = scene.physics.add.group({
      allowGravity: false,
      classType: Enemy,
    });

    // 현재 월드의 적 목록
    this.enemyKeys = [];
    this.setWorld(worldId);
  }

  /**
   * 월드 변경 시 해당 월드의 적 목록으로 전환
   * @param {number} worldId
   */
  setWorld(worldId) {
    this.enemyKeys = WORLD_ENEMIES[worldId] || [];
  }

  /**
   * 적 하나 스폰
   * @param {number} x - 스폰 x (화면 오른쪽 밖)
   * @param {number} groundY - 바닥 y좌표
   * @param {number} gameSpeed - 현재 게임 속도
   * @returns {Enemy|null} 생성된 적 또는 null (적이 없는 월드)
   */
  spawnEnemy(x, groundY, gameSpeed) {
    // 적이 없는 월드면 스폰하지 않음
    if (this.enemyKeys.length === 0) return null;

    // 랜덤으로 적 종류 선택
    const enemyKey = Phaser.Utils.Array.GetRandom(this.enemyKeys);
    const data = ENEMIES[enemyKey];
    if (!data) return null;

    // y 위치 계산
    let y;
    if (data.type === 'ground') {
      // 바닥 적: 바닥 위에 서있음 (origin 기본 0.5이므로 높이 절반만큼 올림)
      y = groundY - data.height / 2;
    } else {
      // 비행 적: 화면 높이의 flyHeight 비율 위치
      const { height } = this.scene.scale;
      y = height * (data.flyHeight || 0.5);
    }

    // 오브젝트 풀에서 비활성 적 꺼내기
    let enemy = this.group.getFirstDead(false);

    if (enemy) {
      // 기존 비활성 적 재활용
      enemy.setup(enemyKey, x, y, gameSpeed);
    } else {
      // 새로 생성
      const textureKey = `enemy_${enemyKey}`;
      enemy = new Enemy(this.scene, x, y, textureKey);
      this.group.add(enemy);
      enemy.setup(enemyKey, x, y, gameSpeed);
    }

    return enemy;
  }

  /**
   * 매 프레임 호출: 비행 적 사인파 움직임 업데이트
   * @param {number} delta
   */
  update(delta) {
    this.group.getChildren().forEach(enemy => {
      if (enemy.active && enemy.alive) {
        enemy.updateMovement(delta);
      }
    });
  }

  /**
   * 화면 밖으로 나간 적 비활성화
   */
  cleanup() {
    this.group.getChildren().forEach(enemy => {
      if (enemy.active && enemy.x < -60) {
        enemy.setActive(false).setVisible(false);
        if (enemy.body) enemy.body.enable = false;
      }
    });
  }
}
