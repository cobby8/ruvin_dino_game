/**
 * Obstacle.js - 장애물 레고블록
 * 6개 월드 x 3종 = 18종 장애물을 코드로 그리고 관리하는 클래스
 * 오브젝트 풀링(재활용) 패턴으로 메모리 효율적
 *
 * 페이즈 2: 월드별 장애물 지원 + 모든 크기 1.5~2배 확대
 *
 * 장애물 크기표:
 * | 월드 | 장애물1       | 크기   | 장애물2       | 크기   | 장애물3       | 크기   |
 * |------|--------------|--------|--------------|--------|--------------|--------|
 * | 1    | 작은선인장    | 30x45  | 큰선인장      | 45x68  | 돌멩이       | 38x30  |
 * | 2    | 사막선인장    | 35x55  | 해골          | 40x40  | 모래언덕     | 50x30  |
 * | 3    | 나무그루터기  | 45x40  | 버섯          | 35x45  | 덩굴         | 25x60  |
 * | 4    | 용암돌        | 40x40  | 불기둥        | 30x65  | 화산재더미   | 50x35  |
 * | 5    | 산호          | 35x50  | 해초          | 25x55  | 불가사리     | 45x30  |
 * | 6    | 별            | 40x40  | 달조각        | 45x45  | 무지개조각   | 50x35  |
 */

import { GAME } from '../config.js';
import { WORLDS } from '../data/worlds.js';

/**
 * 모든 월드의 장애물 텍스처를 생성 (BootScene에서 호출)
 * @param {Phaser.Scene} scene
 */
export function createAllObstacleTextures(scene) {
  _createWorld1Obstacles(scene); // 풀밭
  _createWorld2Obstacles(scene); // 사막
  _createWorld3Obstacles(scene); // 숲
  _createWorld4Obstacles(scene); // 화산
  _createWorld5Obstacles(scene); // 바다
  _createWorld6Obstacles(scene); // 하늘
}

// 기존 함수명도 유지 (하위호환)
export function createObstacleTextures(scene) {
  createAllObstacleTextures(scene);
}

// ============================================================
// 월드 1: 풀밭 나라 - 작은선인장(30x45), 큰선인장(45x68), 돌멩이(38x30)
// ============================================================
function _createWorld1Obstacles(scene) {
  // --- 작은 선인장 (30x45) --- 색상 강화: 더 진한 녹색으로 배경과 구분
  const g1 = scene.add.graphics();
  // 외곽선 (검정, 배경과 확실히 구분)
  g1.lineStyle(2, 0x000000, 0.5);
  g1.strokeRoundedRect(8, 8, 14, 37, 4);
  g1.strokeRoundedRect(0, 18, 10, 6, 3);
  // 선인장 몸통 (더 진한 녹색)
  g1.fillStyle(0x1A6B2A);
  g1.fillRoundedRect(8, 8, 14, 37, 4);
  // 하이라이트 줄
  g1.fillStyle(0x3A9B4A, 0.6);
  g1.fillRoundedRect(12, 9, 5, 35, 2);
  // 왼쪽 팔
  g1.fillStyle(0x1A6B2A);
  g1.fillRoundedRect(0, 18, 10, 6, 3);
  g1.fillStyle(0x3A9B4A, 0.5);
  g1.fillRoundedRect(1, 19, 7, 3, 1);
  // 가시들
  g1.fillStyle(0x0D4A18);
  g1.fillTriangle(22, 14, 26, 13, 22, 12);
  g1.fillTriangle(22, 22, 26, 21, 22, 20);
  g1.fillTriangle(22, 30, 25, 29, 22, 28);
  g1.fillTriangle(8, 13, 4, 12, 8, 11);
  g1.fillTriangle(8, 28, 4, 27, 8, 26);
  g1.fillTriangle(8, 36, 5, 35, 8, 34);
  // 꽃
  g1.fillStyle(0xFFB0C0);
  g1.fillCircle(15, 6, 4);
  g1.fillStyle(0xFFE066);
  g1.fillCircle(15, 6, 1.8);
  g1.generateTexture('w1_small_cactus', 30, 45);
  g1.destroy();

  // --- 큰 선인장 (45x68) --- 색상 강화: 더 진한 녹색
  const g2 = scene.add.graphics();
  // 외곽선 (검정, 배경과 확실히 구분)
  g2.lineStyle(2, 0x000000, 0.5);
  g2.strokeRoundedRect(12, 8, 20, 60, 5);
  g2.strokeRoundedRect(0, 22, 14, 7, 3);
  g2.strokeRoundedRect(30, 33, 15, 7, 3);
  // 큰 몸통 (더 진한 녹색)
  g2.fillStyle(0x1A6B2A);
  g2.fillRoundedRect(12, 8, 20, 60, 5);
  // 하이라이트
  g2.fillStyle(0x3A9B4A, 0.6);
  g2.fillRoundedRect(18, 9, 6, 58, 3);
  // 왼쪽 팔
  g2.fillStyle(0x1A6B2A);
  g2.fillRoundedRect(0, 22, 14, 7, 3);
  g2.fillRoundedRect(0, 15, 7, 18, 3);
  g2.fillStyle(0x3A9B4A, 0.5);
  g2.fillRoundedRect(1, 18, 5, 12, 1);
  // 오른쪽 팔
  g2.fillStyle(0x1A6B2A);
  g2.fillRoundedRect(30, 33, 15, 7, 3);
  g2.fillRoundedRect(38, 27, 7, 18, 3);
  g2.fillStyle(0x3A9B4A, 0.5);
  g2.fillRoundedRect(39, 30, 5, 12, 1);
  // 가시
  g2.fillStyle(0x0D4A18);
  g2.fillTriangle(32, 12, 36, 11, 32, 10);
  g2.fillTriangle(32, 22, 36, 21, 32, 20);
  g2.fillTriangle(32, 42, 36, 41, 32, 40);
  g2.fillTriangle(32, 55, 35, 54, 32, 53);
  g2.fillTriangle(12, 12, 8, 11, 12, 10);
  g2.fillTriangle(12, 33, 8, 32, 12, 31);
  g2.fillTriangle(12, 48, 9, 47, 12, 46);
  g2.fillTriangle(12, 60, 8, 59, 12, 58);
  // 꽃
  g2.fillStyle(0xFFB0C0);
  g2.fillCircle(22, 6, 5);
  g2.fillStyle(0xFFE066);
  g2.fillCircle(22, 6, 2);
  g2.generateTexture('w1_big_cactus', 45, 68);
  g2.destroy();

  // --- 돌멩이 (38x30) --- 색상 강화: 더 진한 회색
  const g3 = scene.add.graphics();
  // 외곽선 (검정, 배경과 확실히 구분)
  g3.lineStyle(2, 0x000000, 0.5);
  g3.strokeRoundedRect(3, 6, 32, 21, 7);
  // 돌 하단 (더 진한 회색)
  g3.fillStyle(0x555555);
  g3.fillRoundedRect(3, 9, 32, 18, 7);
  // 돌 상단 (중간 회색)
  g3.fillStyle(0x777777);
  g3.fillRoundedRect(3, 6, 32, 15, 7);
  // 하이라이트
  g3.fillStyle(0x999999);
  g3.fillCircle(12, 10, 5);
  g3.fillStyle(0xAAAAAA);
  g3.fillCircle(11, 9, 2.5);
  // 금 무늬
  g3.lineStyle(1, 0x6B5535, 0.6);
  g3.lineBetween(9, 15, 27, 18);
  g3.lineStyle(0.8, 0x6B5535, 0.4);
  g3.lineBetween(15, 10, 30, 13);
  g3.generateTexture('w1_rock', 38, 30);
  g3.destroy();
}

// ============================================================
// 월드 2: 사막 나라 - 사막선인장(35x55), 해골(40x40), 모래언덕(50x30)
// ============================================================
function _createWorld2Obstacles(scene) {
  // --- 사막 선인장 (35x55) --- 색상 강화: 더 진한 녹색
  const g1 = scene.add.graphics();
  // 외곽선
  g1.lineStyle(2, 0x000000, 0.5);
  g1.strokeRoundedRect(10, 5, 15, 50, 5);
  // 몸통 (진한 녹색)
  g1.fillStyle(0x3A7A1A);
  g1.fillRoundedRect(10, 5, 15, 50, 5);
  // 하이라이트
  g1.fillStyle(0x5BA040, 0.5);
  g1.fillRoundedRect(14, 6, 5, 48, 2);
  // 왼팔 (위쪽)
  g1.fillStyle(0x3A7A1A);
  g1.fillRoundedRect(0, 15, 12, 5, 2);
  g1.fillRoundedRect(0, 10, 5, 14, 2);
  // 오른팔 (아래쪽)
  g1.fillRoundedRect(23, 28, 12, 5, 2);
  g1.fillRoundedRect(30, 24, 5, 14, 2);
  // 가시 (X 모양)
  g1.fillStyle(0x1A5A00);
  for (let i = 0; i < 5; i++) {
    const y = 12 + i * 9;
    g1.fillTriangle(25, y, 28, y - 1, 25, y - 2);
    g1.fillTriangle(10, y + 3, 7, y + 2, 10, y + 1);
  }
  g1.generateTexture('w2_cactus', 35, 55);
  g1.destroy();

  // --- 해골 (40x40) --- 외곽선 추가
  const g2 = scene.add.graphics();
  // 외곽선
  g2.lineStyle(2, 0x000000, 0.5);
  g2.strokeRoundedRect(8, 2, 24, 24, 10);
  // 두개골
  g2.fillStyle(0xF0E8D8);
  g2.fillRoundedRect(8, 2, 24, 24, 10);
  // 턱
  g2.fillStyle(0xE8DCC8);
  g2.fillRoundedRect(12, 22, 16, 10, 4);
  // 눈구멍 (검정)
  g2.fillStyle(0x333333);
  g2.fillCircle(15, 14, 4);
  g2.fillCircle(25, 14, 4);
  // 눈 안쪽 (어두운 빨강)
  g2.fillStyle(0x880000, 0.5);
  g2.fillCircle(15, 14, 2);
  g2.fillCircle(25, 14, 2);
  // 코구멍 (역삼각형)
  g2.fillStyle(0x333333);
  g2.fillTriangle(18, 18, 22, 18, 20, 22);
  // 이빨
  g2.fillStyle(0xF0E8D8);
  for (let i = 0; i < 4; i++) {
    g2.fillRect(14 + i * 4, 26, 3, 5);
  }
  // 금
  g2.lineStyle(0.8, 0xC0B0A0, 0.4);
  g2.lineBetween(10, 8, 18, 6);
  g2.generateTexture('w2_skull', 40, 40);
  g2.destroy();

  // --- 모래언덕 (50x30) --- 색상 강화: 더 진한 모래색 + 외곽선
  const g3 = scene.add.graphics();
  // 메인 언덕 (진한 모래색)
  g3.fillStyle(0xC8A64A);
  g3.beginPath();
  g3.moveTo(0, 30);
  g3.lineTo(5, 18); g3.lineTo(15, 8);
  g3.lineTo(25, 3); g3.lineTo(35, 8);
  g3.lineTo(45, 16); g3.lineTo(50, 30);
  g3.closePath(); g3.fillPath();
  // 밝은 부분 (하이라이트)
  g3.fillStyle(0xF0D888, 0.6);
  g3.beginPath();
  g3.moveTo(10, 25); g3.lineTo(18, 10);
  g3.lineTo(25, 5); g3.lineTo(30, 10);
  g3.lineTo(25, 25);
  g3.closePath(); g3.fillPath();
  // 모래 무늬
  g3.lineStyle(0.8, 0xC9A84E, 0.4);
  g3.lineBetween(8, 20, 42, 22);
  g3.lineBetween(12, 14, 38, 16);
  g3.generateTexture('w2_sand_dune', 50, 30);
  g3.destroy();
}

// ============================================================
// 월드 3: 숲 나라 - 나무그루터기(45x40), 버섯(35x45), 덩굴(25x60)
// ============================================================
function _createWorld3Obstacles(scene) {
  // --- 나무 그루터기 (45x40) --- 색상 강화 + 외곽선
  const g1 = scene.add.graphics();
  // 외곽선
  g1.lineStyle(2, 0x000000, 0.5);
  g1.strokeRoundedRect(8, 10, 28, 30, 4);
  // 몸통 (더 진한 갈색)
  g1.fillStyle(0x6B4900);
  g1.fillRoundedRect(8, 10, 28, 30, 4);
  // 나이테 (위쪽 단면)
  g1.fillStyle(0xA0813A);
  g1.fillRoundedRect(6, 5, 32, 12, 5);
  // 나이테 링
  g1.lineStyle(1, 0x7A5A10, 0.5);
  g1.strokeCircle(22, 11, 6);
  g1.strokeCircle(22, 11, 10);
  // 중심점
  g1.fillStyle(0x5A3A00);
  g1.fillCircle(22, 11, 2);
  // 나무껍질 무늬
  g1.lineStyle(1, 0x6A5010, 0.4);
  g1.lineBetween(12, 18, 14, 35);
  g1.lineBetween(28, 16, 30, 34);
  // 이끼
  g1.fillStyle(0x7EC850, 0.6);
  g1.fillCircle(10, 12, 3);
  g1.fillCircle(34, 10, 2);
  g1.generateTexture('w3_stump', 45, 40);
  g1.destroy();

  // --- 버섯 (35x45) --- 색상 강화: 더 선명한 빨간색 + 외곽선
  const g2 = scene.add.graphics();
  // 외곽선
  g2.lineStyle(2, 0x000000, 0.5);
  g2.strokeRoundedRect(12, 22, 11, 23, 3);
  // 줄기 (흰색)
  g2.fillStyle(0xF5F0E0);
  g2.fillRoundedRect(12, 22, 11, 23, 3);
  // 갓 (더 선명한 빨간색)
  g2.fillStyle(0xCC1111);
  g2.beginPath();
  g2.arc(17, 22, 16, Math.PI, 0, false);
  g2.closePath(); g2.fillPath();
  // 흰 점무늬 (독버섯 느낌)
  g2.fillStyle(0xFFFFFF, 0.9);
  g2.fillCircle(10, 15, 3);
  g2.fillCircle(22, 12, 2.5);
  g2.fillCircle(16, 8, 2);
  g2.fillCircle(26, 17, 2);
  // 줄기 줄무늬
  g2.lineStyle(0.8, 0xDDD8C8, 0.5);
  g2.lineBetween(15, 25, 15, 42);
  g2.lineBetween(20, 25, 20, 42);
  g2.generateTexture('w3_mushroom', 35, 45);
  g2.destroy();

  // --- 덩굴 (25x60) --- 색상 강화 + 외곽선
  const g3 = scene.add.graphics();
  // 외곽선
  g3.lineStyle(2, 0x000000, 0.5);
  g3.strokeRoundedRect(10, 0, 5, 60, 2);
  // 메인 줄기 (더 진한 녹색)
  g3.fillStyle(0x1A5A10);
  g3.fillRoundedRect(10, 0, 5, 60, 2);
  // 감긴 줄기 (S자)
  g3.lineStyle(2, 0x2A7A1A);
  g3.beginPath();
  g3.moveTo(12, 0);
  g3.lineTo(18, 10); g3.lineTo(7, 20);
  g3.lineTo(18, 30); g3.lineTo(7, 40);
  g3.lineTo(18, 50); g3.lineTo(12, 60);
  g3.strokePath();
  // 잎사귀 (양쪽에)
  g3.fillStyle(0x5BC37A, 0.8);
  g3.fillEllipse(5, 15, 10, 5);
  g3.fillEllipse(20, 25, 10, 5);
  g3.fillEllipse(5, 35, 10, 5);
  g3.fillEllipse(20, 45, 10, 5);
  g3.fillEllipse(5, 55, 8, 4);
  g3.generateTexture('w3_vine', 25, 60);
  g3.destroy();
}

// ============================================================
// 월드 4: 화산 나라 - 용암돌(40x40), 불기둥(30x65), 화산재더미(50x35)
// ============================================================
function _createWorld4Obstacles(scene) {
  // --- 용암돌 (40x40) --- 외곽선 추가
  const g1 = scene.add.graphics();
  // 외곽선
  g1.lineStyle(2, 0x000000, 0.5);
  g1.strokeRoundedRect(4, 6, 32, 30, 8);
  // 돌 몸체 (더 진한 검은색)
  g1.fillStyle(0x3A2A20);
  g1.fillRoundedRect(4, 8, 32, 28, 8);
  // 밝은 면
  g1.fillStyle(0x6A5A50, 0.7);
  g1.fillRoundedRect(6, 6, 28, 20, 8);
  // 용암 빛 (주황/빨강 줄)
  g1.lineStyle(2, 0xFF4500, 0.7);
  g1.lineBetween(8, 18, 18, 14);
  g1.lineBetween(18, 14, 32, 20);
  g1.lineStyle(1.5, 0xFF6600, 0.5);
  g1.lineBetween(10, 26, 22, 22);
  g1.lineBetween(22, 22, 34, 28);
  // 붉은 빛 하이라이트
  g1.fillStyle(0xFF6600, 0.4);
  g1.fillCircle(20, 18, 4);
  g1.generateTexture('w4_lava_rock', 40, 40);
  g1.destroy();

  // --- 불기둥 (30x65) --- 외곽선 추가
  const g2 = scene.add.graphics();
  // 외곽선
  g2.lineStyle(2, 0x000000, 0.5);
  g2.strokeRoundedRect(6, 15, 18, 50, 3);
  // 기둥 몸체 (더 진한 암갈색)
  g2.fillStyle(0x4A2A10);
  g2.fillRoundedRect(6, 15, 18, 50, 3);
  // 불꽃 (상단) - 주황~빨강 그라디언트
  g2.fillStyle(0xFF4500);
  g2.beginPath();
  g2.moveTo(5, 20);
  g2.lineTo(15, 0); g2.lineTo(25, 20);
  g2.closePath(); g2.fillPath();
  g2.fillStyle(0xFFAA00, 0.8);
  g2.beginPath();
  g2.moveTo(8, 20);
  g2.lineTo(15, 5); g2.lineTo(22, 20);
  g2.closePath(); g2.fillPath();
  g2.fillStyle(0xFFDD00, 0.6);
  g2.beginPath();
  g2.moveTo(11, 20);
  g2.lineTo(15, 10); g2.lineTo(19, 20);
  g2.closePath(); g2.fillPath();
  // 기둥 균열
  g2.lineStyle(1, 0xFF4500, 0.4);
  g2.lineBetween(10, 25, 12, 50);
  g2.lineBetween(20, 30, 18, 55);
  g2.generateTexture('w4_fire_pillar', 30, 65);
  g2.destroy();

  // --- 화산재 더미 (50x35) --- 색상 강화
  const g3 = scene.add.graphics();
  // 더미 (더 진한 검회색)
  g3.fillStyle(0x3A3530);
  g3.beginPath();
  g3.moveTo(0, 35);
  g3.lineTo(5, 20); g3.lineTo(15, 10);
  g3.lineTo(25, 5); g3.lineTo(35, 8);
  g3.lineTo(45, 18); g3.lineTo(50, 35);
  g3.closePath(); g3.fillPath();
  // 밝은 면
  g3.fillStyle(0x7A7570, 0.5);
  g3.beginPath();
  g3.moveTo(8, 30); g3.lineTo(18, 12);
  g3.lineTo(25, 7); g3.lineTo(30, 12);
  g3.lineTo(22, 30);
  g3.closePath(); g3.fillPath();
  // 잔불 (주황 점)
  g3.fillStyle(0xFF6600, 0.5);
  g3.fillCircle(15, 18, 2);
  g3.fillCircle(30, 15, 1.5);
  g3.fillCircle(38, 22, 2);
  g3.generateTexture('w4_ash_pile', 50, 35);
  g3.destroy();
}

// ============================================================
// 월드 5: 바다 나라 - 산호(35x50), 해초(25x55), 불가사리(45x30)
// ============================================================
function _createWorld5Obstacles(scene) {
  // --- 산호 (35x50) --- 색상 강화 + 외곽선
  const g1 = scene.add.graphics();
  // 외곽선
  g1.lineStyle(2, 0x000000, 0.5);
  g1.strokeRoundedRect(8, 25, 20, 25, 5);
  // 산호 베이스 (더 선명한 분홍)
  g1.fillStyle(0xEE4060);
  g1.fillRoundedRect(8, 25, 20, 25, 5);
  // 산호 가지들 (위로 뻗음)
  g1.fillStyle(0xFF8FAA);
  g1.fillRoundedRect(4, 10, 8, 22, 4);
  g1.fillRoundedRect(14, 5, 7, 25, 3);
  g1.fillRoundedRect(23, 12, 8, 20, 4);
  // 끝 부분 (밝은 분홍 원)
  g1.fillStyle(0xFFB0C8);
  g1.fillCircle(8, 10, 5);
  g1.fillCircle(17, 5, 4);
  g1.fillCircle(27, 12, 5);
  // 작은 점 (텍스처)
  g1.fillStyle(0xFFFFFF, 0.4);
  g1.fillCircle(12, 30, 1.5);
  g1.fillCircle(22, 35, 1.5);
  g1.fillCircle(16, 40, 1);
  g1.generateTexture('w5_coral', 35, 50);
  g1.destroy();

  // --- 해초 (25x55) --- 색상 강화
  const g2 = scene.add.graphics();
  // 외곽선
  g2.lineStyle(2, 0x000000, 0.5);
  g2.strokeRoundedRect(9, 0, 7, 55, 3);
  // 해초 줄기 (더 진한 녹색)
  g2.fillStyle(0x1A6B2A);
  g2.fillRoundedRect(9, 0, 7, 55, 3);
  // 물결 잎 (좌우로)
  g2.fillStyle(0x3AA856, 0.8);
  g2.fillEllipse(5, 10, 12, 6);
  g2.fillEllipse(20, 20, 12, 6);
  g2.fillEllipse(5, 30, 12, 6);
  g2.fillEllipse(20, 40, 12, 6);
  g2.fillEllipse(5, 50, 10, 5);
  // 물방울 (투명한 점)
  g2.fillStyle(0xB0E8FF, 0.5);
  g2.fillCircle(3, 5, 2);
  g2.fillCircle(22, 15, 1.5);
  g2.fillCircle(3, 35, 2);
  g2.generateTexture('w5_seaweed', 25, 55);
  g2.destroy();

  // --- 불가사리 (45x30) --- 색상 강화
  const g3 = scene.add.graphics();
  // 별 모양 (5개 팔, 더 진한 주황)
  g3.fillStyle(0xDD6622);
  const cx = 22, cy = 15;
  g3.beginPath();
  for (let i = 0; i < 5; i++) {
    // 바깥점
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const ox = cx + 14 * Math.cos(outerAngle);
    const oy = cy + 14 * Math.sin(outerAngle);
    // 안쪽점
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    const ix = cx + 6 * Math.cos(innerAngle);
    const iy = cy + 6 * Math.sin(innerAngle);
    if (i === 0) g3.moveTo(ox, oy);
    else g3.lineTo(ox, oy);
    g3.lineTo(ix, iy);
  }
  g3.closePath(); g3.fillPath();
  // 밝은 가운데
  g3.fillStyle(0xFFAA66, 0.7);
  g3.fillCircle(cx, cy, 5);
  // 점무늬
  g3.fillStyle(0xFFCC88, 0.6);
  g3.fillCircle(cx - 5, cy - 8, 1.5);
  g3.fillCircle(cx + 6, cy - 6, 1.5);
  g3.fillCircle(cx + 8, cy + 4, 1.5);
  g3.fillCircle(cx - 3, cy + 8, 1.5);
  g3.fillCircle(cx - 9, cy + 2, 1.5);
  g3.generateTexture('w5_starfish', 45, 30);
  g3.destroy();
}

// ============================================================
// 월드 6: 하늘 나라 - 별(40x40), 달조각(45x45), 무지개조각(50x35)
// ============================================================
function _createWorld6Obstacles(scene) {
  // --- 별 (40x40) --- 외곽선 추가
  const g1 = scene.add.graphics();
  // 별 모양 (6각, 더 진한 금색)
  g1.fillStyle(0xDDB700);
  const cx1 = 20, cy1 = 20;
  g1.beginPath();
  for (let i = 0; i < 6; i++) {
    const outerAngle = (i * 60 - 90) * Math.PI / 180;
    const ox = cx1 + 16 * Math.cos(outerAngle);
    const oy = cy1 + 16 * Math.sin(outerAngle);
    const innerAngle = ((i * 60) + 30 - 90) * Math.PI / 180;
    const ix = cx1 + 8 * Math.cos(innerAngle);
    const iy = cy1 + 8 * Math.sin(innerAngle);
    if (i === 0) g1.moveTo(ox, oy);
    else g1.lineTo(ox, oy);
    g1.lineTo(ix, iy);
  }
  g1.closePath(); g1.fillPath();
  // 빛나는 가운데
  g1.fillStyle(0xFFFF88, 0.8);
  g1.fillCircle(cx1, cy1, 6);
  g1.fillStyle(0xFFFFDD, 0.5);
  g1.fillCircle(cx1, cy1, 3);
  g1.generateTexture('w6_star', 40, 40);
  g1.destroy();

  // --- 달조각 (45x45) ---
  const g2 = scene.add.graphics();
  // 초승달 (큰 원 - 작은 원 빼기 효과)
  g2.fillStyle(0xFFF8DC);
  g2.fillCircle(22, 22, 18);
  // 어두운 부분으로 초승달 모양 만들기
  g2.fillStyle(0xE8D5F5); // 하늘나라 배경색과 비슷하게
  g2.fillCircle(30, 18, 16);
  // 달 표면 크레이터
  g2.fillStyle(0xEEE8CC, 0.5);
  g2.fillCircle(14, 18, 3);
  g2.fillCircle(18, 26, 2);
  g2.fillCircle(12, 28, 1.5);
  // 빛나는 테두리
  g2.lineStyle(1, 0xFFFFAA, 0.5);
  g2.strokeCircle(22, 22, 18);
  g2.generateTexture('w6_moon', 45, 45);
  g2.destroy();

  // --- 무지개 조각 (50x35) ---
  const g3 = scene.add.graphics();
  // 무지개 아치 (7색 호)
  const rainbowColors = [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x4B0082, 0x8F00FF];
  for (let i = 0; i < 7; i++) {
    g3.lineStyle(3, rainbowColors[i], 0.8);
    g3.beginPath();
    g3.arc(25, 30, 20 - i * 2, Math.PI, 0, false);
    g3.strokePath();
  }
  // 구름 양쪽
  g3.fillStyle(0xFFFFFF, 0.7);
  g3.fillCircle(5, 30, 6);
  g3.fillCircle(10, 28, 5);
  g3.fillCircle(45, 30, 6);
  g3.fillCircle(40, 28, 5);
  g3.generateTexture('w6_rainbow', 50, 35);
  g3.destroy();
}

// ============================================================
// 각 장애물의 yOffset 데이터 (바닥에서 얼마나 올릴지)
// 장애물 높이의 절반 정도가 적당
// ============================================================
const OBSTACLE_Y_OFFSETS = {
  w1_small_cactus: 22, w1_big_cactus: 34, w1_rock: 15,
  w2_cactus: 28, w2_skull: 20, w2_sand_dune: 15,
  w3_stump: 20, w3_mushroom: 22, w3_vine: 30,
  w4_lava_rock: 20, w4_fire_pillar: 32, w4_ash_pile: 18,
  w5_coral: 25, w5_seaweed: 28, w5_starfish: 15,
  w6_star: 20, w6_moon: 22, w6_rainbow: 18,
};

/**
 * 장애물 관리 클래스 (오브젝트 풀링)
 * 페이즈 2: 월드별 장애물 세트를 관리
 */
export class ObstacleManager {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} worldId - 월드 ID (1~6, 기본 1)
   */
  constructor(scene, worldId = 1) {
    this.scene = scene;

    // 물리 그룹 생성 (모든 장애물을 묶어서 관리)
    this.group = scene.physics.add.group({
      allowGravity: false,
    });

    // 현재 월드의 장애물 키 목록 설정
    this.setWorld(worldId);
  }

  /**
   * 월드 변경 → 해당 월드의 장애물만 스폰되도록 설정
   * @param {number} worldId - 1~6
   */
  setWorld(worldId) {
    this._worldId = worldId; // 이미지 텍스처 키 생성에 필요
    const world = WORLDS.find(w => w.id === worldId);
    // 현재 월드의 장애물 키 목록 (예: ['w1_small_cactus', 'w1_big_cactus', 'w1_rock'])
    this.obstacleKeys = world ? world.obstacles : WORLDS[0].obstacles;
  }

  /**
   * 장애물 하나 생성 (또는 재활용)
   * @param {number} x - 생성 위치 x
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   * @param {number} sizeScale - 난이도별 장애물 크기 배율 (아기=0.8 ~ 전설=1.2)
   * @returns {Phaser.Physics.Arcade.Sprite} 생성된 장애물
   */
  spawn(x, groundY, speed, sizeScale = 1.0) {
    // 장애물 종류 랜덤 선택 (확률: 1번 50%, 2번 30%, 3번 20%)
    const rand = Math.random();
    let keyIndex;
    if (rand < 0.5) keyIndex = 0;
    else if (rand < 0.8) keyIndex = 1;
    else keyIndex = 2;

    // 이미지 텍스처(PNG)가 있으면 사용, 없으면 기존 Graphics 텍스처
    const imgKey = `img_obs_world${this._worldId}`;
    const useImage = this.scene.textures.exists(imgKey);

    const graphicsKey = this.obstacleKeys[keyIndex];
    const yOffset = OBSTACLE_Y_OFFSETS[graphicsKey] || 20;

    // 오브젝트 풀에서 비활성 장애물 꺼내기
    let obstacle = this.group.getFirstDead(false);

    if (useImage) {
      // 이미지 기반: 스프라이트시트의 프레임(0,1,2)을 랜덤 선택
      if (obstacle) {
        obstacle.setTexture(imgKey, keyIndex);
        obstacle.setPosition(x, groundY - yOffset);
        obstacle.setActive(true).setVisible(true);
        obstacle.body.enable = true;
      } else {
        obstacle = this.group.create(x, groundY - yOffset, imgKey, keyIndex);
        obstacle.setOrigin(0.5, 1);
      }
      // 이미지 크기 1.2배 확대 x 난이도별 크기 배율 (높이 80%로 축소: 0.15→0.12)
      obstacle.setScale(0.12 * sizeScale);
    } else {
      // 기존 Graphics 텍스처 사용
      if (obstacle) {
        obstacle.setTexture(graphicsKey);
        obstacle.setPosition(x, groundY - yOffset);
        obstacle.setActive(true).setVisible(true);
        obstacle.body.enable = true;
      } else {
        obstacle = this.group.create(x, groundY - yOffset, graphicsKey);
        obstacle.setOrigin(0.5, 1);
      }
      // Graphics 텍스처도 1.2배 확대 x 난이도별 크기 배율 (높이 80%로 축소: 1.5→1.2)
      obstacle.setScale(1.2 * sizeScale);
    }

    // 장애물은 반드시 배경(depth 0~3)보다 앞에 표시 (depth 5)
    obstacle.setDepth(5);
    obstacle.setAlpha(1.0); // 투명도 제거 - 완전 불투명

    // 물리 설정
    obstacle.body.setVelocityX(-speed);
    obstacle.body.setAllowGravity(false);
    obstacle.body.setImmovable(true);
    obstacle.scored = false;

    // 관대한 히트박스 (6살 배려: 그래픽 안쪽 중심부만 판정)
    const bodyW = obstacle.width * 0.45;
    const bodyH = obstacle.height * 0.55;
    obstacle.body.setSize(bodyW, bodyH);
    obstacle.body.setOffset((obstacle.width - bodyW) / 2, (obstacle.height - bodyH) * 0.7);

    return obstacle;
  }

  /** 화면 밖으로 나간 장애물 비활성화 */
  cleanup() {
    this.group.getChildren().forEach(obstacle => {
      if (obstacle.active && obstacle.x < -50) {
        obstacle.setActive(false).setVisible(false);
        obstacle.body.enable = false;
      }
    });
  }

  /** 모든 장애물의 속도를 현재 게임 속도에 맞춤 */
  updateSpeed(speed) {
    this.group.getChildren().forEach(obstacle => {
      if (obstacle.active) {
        obstacle.body.setVelocityX(-speed);
      }
    });
  }

  /** 모든 장애물 비활성화 (게임 재시작용) */
  reset() {
    this.group.getChildren().forEach(obstacle => {
      obstacle.setActive(false).setVisible(false);
      obstacle.body.enable = false;
    });
  }
}
