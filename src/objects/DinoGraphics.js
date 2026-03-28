/**
 * DinoGraphics.js - 공룡 그리기 공장 (고도화 버전)
 * Phaser Graphics API로 4마리 공룡을 코드로 직접 그린 뒤,
 * 각각 384x96 스프라이트시트(4프레임 x 96px)로 만들어 텍스처에 등록함.
 *
 * 프레임 구성: [달리기1, 달리기2, 점프, 넘어짐]
 * 각 프레임 96x96px, 가로로 이어붙여 384x96
 *
 * 디자인 원칙:
 * - 입체감: 몸통에 밝은톤(위) + 어두운톤(아래) 2색 이상 사용
 * - 큰 눈: 흰자 + 동공 + 하이라이트 반짝임 (얼굴의 1/3 이상)
 * - 핑크 볼터치: 눈 아래 분홍색 반투명 타원
 * - 작은 미소: 곡선 또는 호
 */

import { GAME, DINOS } from '../config.js';

const SIZE = GAME.DINO_SIZE; // 96px

// === 공통 얼굴 그리기 ===

/**
 * 일반 얼굴 (달리기용): 큰 눈 + 볼터치 + 미소
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x - 얼굴 중심 x
 * @param {number} y - 얼굴 중심 y
 */
function drawNormalFace(g, x, y) {
  const eyeR = 8;        // 흰자 반지름 (크게!)
  const pupilR = 5;      // 동공 반지름
  const highlightR = 3;  // 하이라이트 반지름
  const spacing = 14;    // 눈 사이 간격

  // 흰자 (큰 흰 원)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - spacing / 2, y, eyeR);
  g.fillCircle(x + spacing / 2, y, eyeR);

  // 동공 (검은 원, 약간 오른쪽으로 → 바라보는 방향)
  g.fillStyle(0x222222);
  g.fillCircle(x - spacing / 2 + 2, y, pupilR);
  g.fillCircle(x + spacing / 2 + 2, y, pupilR);

  // 하이라이트 반짝임 (흰 점 - 생동감의 핵심!)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - spacing / 2 - 1, y - 3, highlightR);
  g.fillCircle(x + spacing / 2 - 1, y - 3, highlightR);

  // 핑크 볼터치 (분홍색 반투명 타원)
  g.fillStyle(0xFFB0C0, 0.5);
  g.fillEllipse(x - 18, y + 10, 10, 6);
  g.fillEllipse(x + 18, y + 10, 10, 6);

  // 미소 (작은 호)
  g.lineStyle(2, 0x444444, 1);
  g.beginPath();
  g.arc(x + 2, y + 8, 5, 0.1, Math.PI - 0.1, false);
  g.strokePath();
}

/**
 * 놀란 얼굴 (점프용): 눈 1.3배 + O 모양 입
 */
function drawSurprisedFace(g, x, y) {
  const eyeR = 10;       // 1.3배 커진 흰자
  const pupilR = 6;
  const highlightR = 3.5;
  const spacing = 14;

  // 흰자
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - spacing / 2, y, eyeR);
  g.fillCircle(x + spacing / 2, y, eyeR);

  // 동공
  g.fillStyle(0x222222);
  g.fillCircle(x - spacing / 2 + 1, y, pupilR);
  g.fillCircle(x + spacing / 2 + 1, y, pupilR);

  // 하이라이트
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - spacing / 2 - 1, y - 4, highlightR);
  g.fillCircle(x + spacing / 2 - 1, y - 4, highlightR);

  // 볼터치
  g.fillStyle(0xFFB0C0, 0.5);
  g.fillEllipse(x - 18, y + 10, 10, 6);
  g.fillEllipse(x + 18, y + 10, 10, 6);

  // O 모양 입 (놀란 표정)
  g.fillStyle(0x444444);
  g.fillCircle(x + 2, y + 12, 4);
  g.fillStyle(0xFF6688);
  g.fillCircle(x + 2, y + 12, 2.5);
}

/**
 * 넘어짐 얼굴: X 눈 + 혀 내밀기
 */
function drawFallenFace(g, x, y) {
  const spacing = 14;

  // X 모양 눈 (두 줄 교차)
  g.lineStyle(3, 0x444444, 1);
  // 왼쪽 눈 X
  g.lineBetween(x - spacing / 2 - 5, y - 5, x - spacing / 2 + 5, y + 5);
  g.lineBetween(x - spacing / 2 + 5, y - 5, x - spacing / 2 - 5, y + 5);
  // 오른쪽 눈 X
  g.lineBetween(x + spacing / 2 - 5, y - 5, x + spacing / 2 + 5, y + 5);
  g.lineBetween(x + spacing / 2 + 5, y - 5, x + spacing / 2 - 5, y + 5);

  // 볼터치
  g.fillStyle(0xFFB0C0, 0.5);
  g.fillEllipse(x - 18, y + 10, 10, 6);
  g.fillEllipse(x + 18, y + 10, 10, 6);

  // 혀 내밀기 (분홍 타원)
  g.fillStyle(0xFF8899);
  g.fillEllipse(x + 4, y + 16, 8, 5);
  // 혀 하이라이트
  g.fillStyle(0xFFAABB, 0.6);
  g.fillEllipse(x + 3, y + 15, 4, 2);
}


// ============================================================
// 브라키오 (초록 #6BCB77): 긴 목 + 작은 둥근 머리 + 큰 몸통
// ============================================================
function drawBrachio(g, ox, frame) {
  const isJump = frame === 2;
  const isFall = frame === 3;
  // 다리 오프셋: 달리기 프레임간 차이를 12px로 확실하게
  const legL = frame === 0 ? -6 : frame === 1 ? 6 : 0;
  const legR = frame === 0 ? 6 : frame === 1 ? -6 : 0;

  // 넘어짐: 몸 기울임 → 전체를 약간 오른쪽 쉬프트
  const tilt = isFall ? 4 : 0;

  // --- 꼬리 (긴 꼬리, 뒤쪽) ---
  g.fillStyle(0x5BB867); // 어두운 초록
  g.fillTriangle(
    ox + 60 + tilt, SIZE - 30,
    ox + 85 + tilt, SIZE - 45,
    ox + 78 + tilt, SIZE - 22
  );

  // --- 몸통 (통통한 타원, 아래쪽 어두운톤) ---
  g.fillStyle(0x5BB867); // 어두운 초록 (아래쪽)
  g.fillEllipse(ox + 48 + tilt, SIZE - 28, 44, 32);
  // 밝은 배 (위쪽 하이라이트)
  g.fillStyle(0xA8E6A3);
  g.fillEllipse(ox + 48 + tilt, SIZE - 32, 36, 20);
  // 메인 컬러 덮기
  g.fillStyle(0x6BCB77);
  g.fillEllipse(ox + 48 + tilt, SIZE - 34, 40, 22);

  // --- 긴 목 (위로 올라가는 곡선) ---
  g.fillStyle(0x6BCB77);
  g.fillRoundedRect(ox + 24 + tilt, SIZE - 70, 16, 40, 6);
  // 목 연한 줄무늬 2줄
  g.fillStyle(0xA8E6A3, 0.5);
  g.fillRoundedRect(ox + 27 + tilt, SIZE - 62, 10, 3, 1);
  g.fillRoundedRect(ox + 27 + tilt, SIZE - 54, 10, 3, 1);

  // --- 작은 둥근 머리 ---
  g.fillStyle(0x6BCB77);
  g.fillCircle(ox + 32 + tilt, SIZE - 74, 14);
  // 머리 밝은 부분
  g.fillStyle(0x8AD88C, 0.4);
  g.fillCircle(ox + 30 + tilt, SIZE - 76, 8);

  // --- 얼굴 ---
  if (isFall) {
    drawFallenFace(g, ox + 34 + tilt, SIZE - 76);
  } else if (isJump) {
    drawSurprisedFace(g, ox + 34 + tilt, SIZE - 76);
  } else {
    drawNormalFace(g, ox + 34 + tilt, SIZE - 76);
  }

  // --- 다리 4개 (통통한 기둥) ---
  const darker = 0x4AA85A;
  g.fillStyle(darker);
  // 앞다리 (왼/오른)
  g.fillRoundedRect(ox + 30 + legL + tilt, SIZE - 16, 8, 16, 3);
  g.fillRoundedRect(ox + 42 + legR + tilt, SIZE - 16, 8, 16, 3);
  // 뒷다리
  g.fillRoundedRect(ox + 54 + legL + tilt, SIZE - 16, 8, 16, 3);
  g.fillRoundedRect(ox + 66 + legR + tilt, SIZE - 16, 8, 16, 3);

  // 발 (둥근 끝)
  g.fillStyle(0x3D9048);
  g.fillCircle(ox + 34 + legL + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 46 + legR + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 58 + legL + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 70 + legR + tilt, SIZE - 2, 5);
}


// ============================================================
// 티라노 (주황 #FF8C42): 큰 둥근 머리 + 이빨 + 짧은 팔
// ============================================================
function drawTrex(g, ox, frame) {
  const isJump = frame === 2;
  const isFall = frame === 3;
  const legL = frame === 0 ? -6 : frame === 1 ? 6 : 0;
  const legR = frame === 0 ? 6 : frame === 1 ? -6 : 0;
  const tilt = isFall ? 4 : 0;

  // 점프시 팔 위로
  const armY = isJump ? -6 : 0;

  // --- 꼬리 (짧고 뾰족) ---
  g.fillStyle(0xE07830);
  g.fillTriangle(
    ox + 14 + tilt, SIZE - 36,
    ox + 4 + tilt, SIZE - 50,
    ox + 10 + tilt, SIZE - 22
  );

  // --- 몸통 (아래쪽 어두운톤) ---
  g.fillStyle(0xE07830);
  g.fillEllipse(ox + 40 + tilt, SIZE - 30, 38, 34);
  // 밝은 배
  g.fillStyle(0xFFB380);
  g.fillEllipse(ox + 42 + tilt, SIZE - 28, 26, 22);
  // 메인 컬러
  g.fillStyle(0xFF8C42);
  g.fillEllipse(ox + 40 + tilt, SIZE - 34, 34, 24);

  // --- 큰 둥근 머리 ---
  g.fillStyle(0xFF8C42);
  g.fillCircle(ox + 58 + tilt, SIZE - 58, 20);
  // 머리 밝은 부분
  g.fillStyle(0xFFA866, 0.4);
  g.fillCircle(ox + 55 + tilt, SIZE - 62, 10);

  // --- 턱 (아래쪽 돌출) ---
  g.fillStyle(0xFF8C42);
  g.fillEllipse(ox + 66 + tilt, SIZE - 42, 14, 10);

  // --- 하얀 이빨 2~3개 ---
  g.fillStyle(0xFFFFFF);
  g.fillTriangle(ox + 70 + tilt, SIZE - 44, ox + 73 + tilt, SIZE - 38, ox + 67 + tilt, SIZE - 38);
  g.fillTriangle(ox + 64 + tilt, SIZE - 44, ox + 67 + tilt, SIZE - 38, ox + 61 + tilt, SIZE - 38);
  g.fillTriangle(ox + 76 + tilt, SIZE - 43, ox + 79 + tilt, SIZE - 38, ox + 73 + tilt, SIZE - 38);

  // --- 얼굴 ---
  if (isFall) {
    drawFallenFace(g, ox + 56 + tilt, SIZE - 62);
  } else if (isJump) {
    drawSurprisedFace(g, ox + 56 + tilt, SIZE - 62);
  } else {
    drawNormalFace(g, ox + 56 + tilt, SIZE - 62);
  }

  // --- 짧은 팔 (매우 작게 귀엽게!) ---
  g.fillStyle(0xE07830);
  g.fillRoundedRect(ox + 50 + tilt, SIZE - 34 + armY, 5, 10, 2);
  g.fillRoundedRect(ox + 58 + tilt, SIZE - 32 + armY, 5, 10, 2);
  // 팔 끝 (작은 손)
  g.fillStyle(0xD06820);
  g.fillCircle(ox + 52 + tilt, SIZE - 24 + armY, 3);
  g.fillCircle(ox + 60 + tilt, SIZE - 22 + armY, 3);

  // --- 다리 (티라노는 튼튼한 뒷다리) ---
  g.fillStyle(0xD06820);
  g.fillRoundedRect(ox + 30 + legL + tilt, SIZE - 16, 10, 16, 3);
  g.fillRoundedRect(ox + 48 + legR + tilt, SIZE - 16, 10, 16, 3);

  // 발
  g.fillStyle(0xB05818);
  g.fillCircle(ox + 35 + legL + tilt, SIZE - 2, 6);
  g.fillCircle(ox + 53 + legR + tilt, SIZE - 2, 6);
}


// ============================================================
// 트리케라 (보라 #9B72CF): 프릴 + 뿔 3개 + 넓은 몸
// ============================================================
function drawTricera(g, ox, frame) {
  const isJump = frame === 2;
  const isFall = frame === 3;
  const legL = frame === 0 ? -6 : frame === 1 ? 6 : 0;
  const legR = frame === 0 ? 6 : frame === 1 ? -6 : 0;
  const tilt = isFall ? 4 : 0;

  // --- 꼬리 ---
  g.fillStyle(0x8560B8);
  g.fillTriangle(
    ox + 8 + tilt, SIZE - 34,
    ox + 2 + tilt, SIZE - 46,
    ox + 6 + tilt, SIZE - 20
  );

  // --- 넓은 몸통 ---
  g.fillStyle(0x8560B8); // 어두운 보라
  g.fillEllipse(ox + 40 + tilt, SIZE - 28, 48, 34);
  // 밝은 배
  g.fillStyle(0xC9A8E8);
  g.fillEllipse(ox + 42 + tilt, SIZE - 26, 34, 22);
  // 메인 컬러
  g.fillStyle(0x9B72CF);
  g.fillEllipse(ox + 40 + tilt, SIZE - 32, 44, 24);

  // --- 머리 ---
  g.fillStyle(0x9B72CF);
  g.fillCircle(ox + 66 + tilt, SIZE - 52, 16);

  // --- 프릴 (머리 뒤 반원, 안에 작은 원무늬 2개) ---
  g.fillStyle(0xC9A8E8);
  // 프릴 외곽 (큰 반원)
  g.beginPath();
  g.arc(ox + 54 + tilt, SIZE - 58, 18, -Math.PI * 0.8, Math.PI * 0.2, false);
  g.closePath();
  g.fillPath();
  // 프릴 테두리
  g.lineStyle(2, 0x7B52AF, 1);
  g.beginPath();
  g.arc(ox + 54 + tilt, SIZE - 58, 18, -Math.PI * 0.8, Math.PI * 0.2, false);
  g.strokePath();
  // 프릴 안 작은 원무늬 2개
  g.fillStyle(0xB090D8, 0.7);
  g.fillCircle(ox + 48 + tilt, SIZE - 64, 4);
  g.fillCircle(ox + 48 + tilt, SIZE - 52, 4);

  // --- 뿔 1개 (머리 위, 큰 뿔) ---
  g.fillStyle(0xFFF4C2);
  g.fillTriangle(
    ox + 72 + tilt, SIZE - 64,
    ox + 74 + tilt, SIZE - 82,
    ox + 68 + tilt, SIZE - 64
  );
  // --- 작은 뿔 2개 (양옆) ---
  g.fillTriangle(
    ox + 76 + tilt, SIZE - 52,
    ox + 84 + tilt, SIZE - 58,
    ox + 78 + tilt, SIZE - 48
  );
  g.fillTriangle(
    ox + 72 + tilt, SIZE - 44,
    ox + 80 + tilt, SIZE - 46,
    ox + 74 + tilt, SIZE - 40
  );

  // --- 얼굴 ---
  if (isFall) {
    drawFallenFace(g, ox + 66 + tilt, SIZE - 54);
  } else if (isJump) {
    drawSurprisedFace(g, ox + 66 + tilt, SIZE - 54);
  } else {
    drawNormalFace(g, ox + 66 + tilt, SIZE - 54);
  }

  // --- 다리 4개 (튼튼한 기둥) ---
  g.fillStyle(0x7B52AF);
  g.fillRoundedRect(ox + 22 + legL + tilt, SIZE - 16, 9, 16, 3);
  g.fillRoundedRect(ox + 35 + legR + tilt, SIZE - 16, 9, 16, 3);
  g.fillRoundedRect(ox + 48 + legL + tilt, SIZE - 16, 9, 16, 3);
  g.fillRoundedRect(ox + 61 + legR + tilt, SIZE - 16, 9, 16, 3);

  // 발
  g.fillStyle(0x6A42A0);
  g.fillCircle(ox + 26 + legL + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 39 + legR + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 52 + legL + tilt, SIZE - 2, 5);
  g.fillCircle(ox + 65 + legR + tilt, SIZE - 2, 5);
}


// ============================================================
// 프테라노 (파랑 #4EAEFF): 날개 + 볏 + 날씬한 몸
// ============================================================
function drawPtera(g, ox, frame) {
  const isJump = frame === 2;
  const isFall = frame === 3;
  const tilt = isFall ? 3 : 0;

  // 날개 각도: 달리기1 위, 달리기2 아래, 점프 활짝 위로
  const wingY = frame === 0 ? -10 : frame === 1 ? 8 : frame === 2 ? -14 : 0;

  // --- 날개 (양쪽 삼각형 + 날개막 디테일) ---
  // 왼쪽 날개
  g.fillStyle(0x3A8EE0); // 어두운 파랑
  g.fillTriangle(
    ox + 32 + tilt, SIZE - 40,
    ox + 4 + tilt, SIZE - 40 + wingY,
    ox + 28 + tilt, SIZE - 28
  );
  // 날개막 디테일 (밝은 줄)
  g.lineStyle(1.5, 0x8EC8FF, 0.6);
  g.lineBetween(ox + 30 + tilt, SIZE - 38, ox + 10 + tilt, SIZE - 38 + wingY * 0.7);
  g.lineBetween(ox + 30 + tilt, SIZE - 34, ox + 14 + tilt, SIZE - 34 + wingY * 0.5);

  // 오른쪽 날개
  g.fillStyle(0x3A8EE0);
  g.fillTriangle(
    ox + 56 + tilt, SIZE - 40,
    ox + 88 + tilt, SIZE - 40 + wingY,
    ox + 60 + tilt, SIZE - 28
  );
  // 날개막 디테일
  g.lineStyle(1.5, 0x8EC8FF, 0.6);
  g.lineBetween(ox + 58 + tilt, SIZE - 38, ox + 82 + tilt, SIZE - 38 + wingY * 0.7);
  g.lineBetween(ox + 58 + tilt, SIZE - 34, ox + 78 + tilt, SIZE - 34 + wingY * 0.5);

  // --- 날씬한 몸통 ---
  g.fillStyle(0x3A8EE0);
  g.fillEllipse(ox + 46 + tilt, SIZE - 36, 30, 22);
  // 밝은 배
  g.fillStyle(0x8EC8FF);
  g.fillEllipse(ox + 46 + tilt, SIZE - 34, 20, 14);
  // 메인 컬러
  g.fillStyle(0x4EAEFF);
  g.fillEllipse(ox + 46 + tilt, SIZE - 38, 26, 16);

  // --- 머리 ---
  g.fillStyle(0x4EAEFF);
  g.fillCircle(ox + 60 + tilt, SIZE - 56, 14);
  // 머리 밝은 부분
  g.fillStyle(0x7AC4FF, 0.4);
  g.fillCircle(ox + 57 + tilt, SIZE - 59, 7);

  // --- 볏 (머리 뒤 삼각형) ---
  g.fillStyle(0x8EC8FF);
  g.fillTriangle(
    ox + 52 + tilt, SIZE - 64,
    ox + 36 + tilt, SIZE - 76,
    ox + 50 + tilt, SIZE - 52
  );

  // --- 부리 (뾰족한 입) ---
  g.fillStyle(0xFFCC44);
  g.fillTriangle(
    ox + 72 + tilt, SIZE - 58,
    ox + 84 + tilt, SIZE - 54,
    ox + 72 + tilt, SIZE - 50
  );

  // --- 얼굴 ---
  if (isFall) {
    drawFallenFace(g, ox + 58 + tilt, SIZE - 58);
  } else if (isJump) {
    drawSurprisedFace(g, ox + 58 + tilt, SIZE - 58);
  } else {
    drawNormalFace(g, ox + 58 + tilt, SIZE - 58);
  }

  // --- 작은 다리 (프테라노는 다리가 짧음) ---
  const legL = frame === 0 ? -4 : frame === 1 ? 4 : 0;
  const legR = frame === 0 ? 4 : frame === 1 ? -4 : 0;
  g.fillStyle(0x3A8EE0);
  g.fillRoundedRect(ox + 38 + legL + tilt, SIZE - 16, 6, 14, 2);
  g.fillRoundedRect(ox + 50 + legR + tilt, SIZE - 16, 6, 14, 2);

  // 발
  g.fillStyle(0x2A7EC0);
  g.fillCircle(ox + 41 + legL + tilt, SIZE - 3, 4);
  g.fillCircle(ox + 53 + legR + tilt, SIZE - 3, 4);
}


// ============================================================
// 텍스처 생성 및 등록
// ============================================================

/**
 * 공룡 스프라이트시트를 생성하고 Phaser 텍스처에 등록
 * BootScene에서 호출됨
 * @param {Phaser.Scene} scene - 현재 씬
 */
export function createDinoTextures(scene) {
  // 각 공룡별 그리기 함수 매핑
  const drawFunctions = [drawBrachio, drawTrex, drawTricera, drawPtera];

  DINOS.forEach((dino, index) => {
    // 384x96 RenderTexture 생성 (4프레임 x 96px = 384px 너비)
    const rt = scene.add.renderTexture(0, 0, SIZE * 4, SIZE);
    rt.setVisible(false); // 화면에는 안 보이게

    // 4프레임 그리기 (달리기1, 달리기2, 점프, 넘어짐)
    for (let frame = 0; frame < 4; frame++) {
      const g = scene.add.graphics();
      drawFunctions[index](g, 0, frame);

      // Graphics를 RenderTexture에 찍기 (x 오프셋으로 프레임 위치 조정)
      rt.draw(g, frame * SIZE, 0);
      g.destroy(); // 그리기용 임시 객체는 바로 정리
    }

    // RenderTexture의 내용을 텍스처로 저장
    rt.saveTexture(dino.key);
    rt.destroy();

    // 스프라이트시트 프레임 정보 등록
    // (Phaser에게 "이 텍스처는 96px씩 잘라서 쓸 거야"라고 알려줌)
    const texture = scene.textures.get(dino.key);
    texture.add(0, 0, 0, 0, SIZE, SIZE);          // 프레임 0: 달리기1
    texture.add(1, 0, SIZE, 0, SIZE, SIZE);        // 프레임 1: 달리기2
    texture.add(2, 0, SIZE * 2, 0, SIZE, SIZE);    // 프레임 2: 점프
    texture.add(3, 0, SIZE * 3, 0, SIZE, SIZE);    // 프레임 3: 넘어짐

    // 애니메이션 등록
    scene.anims.create({
      key: `${dino.key}_run`,
      frames: [{ key: dino.key, frame: 0 }, { key: dino.key, frame: 1 }],
      frameRate: 8,      // 초당 8프레임 (적당히 빠른 달리기)
      repeat: -1,        // 무한 반복
    });

    scene.anims.create({
      key: `${dino.key}_jump`,
      frames: [{ key: dino.key, frame: 2 }],
      frameRate: 1,
      repeat: 0,
    });

    scene.anims.create({
      key: `${dino.key}_fall`,
      frames: [{ key: dino.key, frame: 3 }],
      frameRate: 1,
      repeat: 0,
    });
  });
}
