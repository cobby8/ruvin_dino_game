/**
 * DinoGraphics.js - 공룡 그리기 공장
 * Phaser Graphics API로 4마리 공룡을 코드로 직접 그린 뒤,
 * 각각 192x48 스프라이트시트(4프레임 x 48px)로 만들어 텍스처에 등록함.
 *
 * 프레임 구성: [달리기1, 달리기2, 점프, 넘어짐]
 * 각 프레임 48x48px, 가로로 이어붙여 192x48
 */

import { GAME, DINOS } from '../config.js';

const SIZE = GAME.DINO_SIZE; // 48px

/**
 * 공통 얼굴 그리기 (큰 눈 + 볼터치)
 * 모든 공룡이 공유하는 귀여운 표정
 * @param {Phaser.GameObjects.Graphics} g - Phaser Graphics 객체
 * @param {number} x - 얼굴 중심 x
 * @param {number} y - 얼굴 중심 y
 * @param {boolean} surprised - true면 놀란 표정 (점프/넘어짐용)
 */
function drawFace(g, x, y, surprised = false) {
  const eyeSize = surprised ? 5 : 4;     // 놀라면 눈이 커짐
  const eyeSpacing = 7;

  // 흰자위 (흰 원)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - eyeSpacing / 2, y - 2, eyeSize + 1);
  g.fillCircle(x + eyeSpacing / 2, y - 2, eyeSize + 1);

  // 눈동자 (검정 원)
  g.fillStyle(0x000000);
  g.fillCircle(x - eyeSpacing / 2 + 1, y - 2, eyeSize - 1);
  g.fillCircle(x + eyeSpacing / 2 + 1, y - 2, eyeSize - 1);

  // 눈 반짝임 (흰 점 - 생동감)
  g.fillStyle(0xFFFFFF);
  g.fillCircle(x - eyeSpacing / 2, y - 3, 1.5);
  g.fillCircle(x + eyeSpacing / 2, y - 3, 1.5);

  // 핑크 볼터치 (분홍 원 - 귀여움 포인트!)
  g.fillStyle(0xFFB6C1);
  g.fillEllipse(x - 9, y + 4, 5, 3);
  g.fillEllipse(x + 9, y + 4, 5, 3);

  // 입 (놀라면 벌린 입, 아니면 미소)
  if (surprised) {
    g.fillStyle(0x000000);
    g.fillCircle(x + 2, y + 6, 2.5);   // 동그란 입 "오!"
  } else {
    g.lineStyle(1, 0x000000, 1);
    g.beginPath();
    g.arc(x + 2, y + 4, 3, 0, Math.PI, false); // 미소 호
    g.strokePath();
  }
}

/**
 * 브라키오 (초록) 그리기: 긴 목 + 작은 머리 + 큰 몸통
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} ox - 프레임 왼쪽 위 x (오프셋)
 * @param {number} frame - 0:달리기1, 1:달리기2, 2:점프, 3:넘어짐
 */
function drawBrachio(g, ox, frame) {
  const color = DINOS[0].color;
  const isJump = frame === 2;
  const isFall = frame === 3;
  const surprised = isJump || isFall;

  // 다리 위치 (달리기 애니메이션: 프레임마다 교대)
  const legOffset = frame === 0 ? 3 : frame === 1 ? -3 : 0;

  // 몸통 (통통한 타원)
  g.fillStyle(color);
  g.fillEllipse(ox + 24, SIZE - 14, 22, 16);

  // 긴 목 (브라키오의 핵심 특징!)
  g.fillStyle(color);
  g.fillRoundedRect(ox + 14, SIZE - 38, 8, 22, 3);

  // 작은 머리
  g.fillStyle(color);
  g.fillCircle(ox + 18, SIZE - 40, 6);

  // 얼굴 (머리 위에)
  drawFace(g, ox + 18, SIZE - 40, surprised);

  // 꼬리 (뒤쪽으로 길게)
  g.fillStyle(color);
  g.fillTriangle(ox + 33, SIZE - 18, ox + 42, SIZE - 22, ox + 38, SIZE - 10);

  // 다리 4개 (통통한 기둥)
  const darker = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
  g.fillStyle(darker);
  // 앞다리 2개
  g.fillRoundedRect(ox + 15 + legOffset, SIZE - 8, 4, 8, 1);
  g.fillRoundedRect(ox + 21 - legOffset, SIZE - 8, 4, 8, 1);
  // 뒷다리 2개
  g.fillRoundedRect(ox + 27 + legOffset, SIZE - 8, 4, 8, 1);
  g.fillRoundedRect(ox + 33 - legOffset, SIZE - 8, 4, 8, 1);

  // 넘어짐: X 눈 표시
  if (isFall) {
    g.lineStyle(1.5, 0x000000, 1);
    // 왼쪽 눈 X
    g.lineBetween(ox + 15, SIZE - 43, ox + 19, SIZE - 39);
    g.lineBetween(ox + 19, SIZE - 43, ox + 15, SIZE - 39);
  }
}

/**
 * 티라노 (주황) 그리기: 큰 머리 + 이빨 + 짧은 팔
 */
function drawTrex(g, ox, frame) {
  const color = DINOS[1].color;
  const isJump = frame === 2;
  const isFall = frame === 3;
  const surprised = isJump || isFall;
  const legOffset = frame === 0 ? 3 : frame === 1 ? -3 : 0;

  // 몸통
  g.fillStyle(color);
  g.fillEllipse(ox + 22, SIZE - 16, 18, 18);

  // 큰 머리 (티라노의 핵심!)
  g.fillStyle(color);
  g.fillCircle(ox + 30, SIZE - 32, 10);

  // 턱 (아래쪽 돌출)
  g.fillStyle(color);
  g.fillEllipse(ox + 34, SIZE - 24, 8, 5);

  // 이빨 (2개 작은 삼각형 - 귀엽게)
  g.fillStyle(0xFFFFFF);
  g.fillTriangle(ox + 36, SIZE - 24, ox + 38, SIZE - 20, ox + 34, SIZE - 20);
  g.fillTriangle(ox + 32, SIZE - 24, ox + 34, SIZE - 20, ox + 30, SIZE - 20);

  // 얼굴
  drawFace(g, ox + 28, SIZE - 34, surprised);

  // 짧은 팔 (티라노 특징 - 웃기게 짧은 팔)
  const darker = Phaser.Display.Color.IntegerToColor(color).darken(15).color;
  g.fillStyle(darker);
  g.fillRoundedRect(ox + 26, SIZE - 18, 3, 5, 1);
  g.fillRoundedRect(ox + 30, SIZE - 17, 3, 5, 1);

  // 꼬리
  g.fillStyle(color);
  g.fillTriangle(ox + 12, SIZE - 18, ox + 6, SIZE - 24, ox + 10, SIZE - 10);

  // 다리 (티라노는 다리가 튼튼)
  g.fillStyle(darker);
  g.fillRoundedRect(ox + 17 + legOffset, SIZE - 8, 5, 8, 1);
  g.fillRoundedRect(ox + 25 - legOffset, SIZE - 8, 5, 8, 1);

  // 넘어짐 표시
  if (isFall) {
    g.lineStyle(1.5, 0x000000, 1);
    g.lineBetween(ox + 25, SIZE - 37, ox + 29, SIZE - 33);
    g.lineBetween(ox + 29, SIZE - 37, ox + 25, SIZE - 33);
  }
}

/**
 * 트리케라 (보라) 그리기: 뿔 + 프릴(목 장식)
 */
function drawTricera(g, ox, frame) {
  const color = DINOS[2].color;
  const isJump = frame === 2;
  const isFall = frame === 3;
  const surprised = isJump || isFall;
  const legOffset = frame === 0 ? 3 : frame === 1 ? -3 : 0;

  // 몸통 (트리케라는 넓적함)
  g.fillStyle(color);
  g.fillEllipse(ox + 22, SIZE - 16, 22, 16);

  // 머리
  g.fillStyle(color);
  g.fillCircle(ox + 34, SIZE - 28, 8);

  // 프릴 (목 뒤 반원 장식 - 트리케라 핵심!)
  const lighter = Phaser.Display.Color.IntegerToColor(color).lighten(30).color;
  g.fillStyle(lighter);
  g.fillCircle(ox + 28, SIZE - 32, 7);
  g.fillStyle(color);
  g.fillCircle(ox + 28, SIZE - 30, 5);

  // 뿔 (머리 위 1개)
  g.fillStyle(0xFFF4C2); // 연한 노란색 뿔
  g.fillTriangle(ox + 38, SIZE - 32, ox + 40, SIZE - 42, ox + 36, SIZE - 32);

  // 코뿔 (작은 것)
  g.fillTriangle(ox + 39, SIZE - 26, ox + 42, SIZE - 30, ox + 39, SIZE - 30);

  // 얼굴
  drawFace(g, ox + 34, SIZE - 28, surprised);

  // 꼬리
  g.fillStyle(color);
  g.fillTriangle(ox + 8, SIZE - 18, ox + 4, SIZE - 22, ox + 8, SIZE - 10);

  // 다리 (튼튼한 4다리)
  const darker = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
  g.fillStyle(darker);
  g.fillRoundedRect(ox + 14 + legOffset, SIZE - 8, 5, 8, 1);
  g.fillRoundedRect(ox + 21 - legOffset, SIZE - 8, 5, 8, 1);
  g.fillRoundedRect(ox + 27 + legOffset, SIZE - 8, 5, 8, 1);
  g.fillRoundedRect(ox + 33 - legOffset, SIZE - 8, 5, 8, 1);

  // 넘어짐 표시
  if (isFall) {
    g.lineStyle(1.5, 0x000000, 1);
    g.lineBetween(ox + 31, SIZE - 31, ox + 35, SIZE - 27);
    g.lineBetween(ox + 35, SIZE - 31, ox + 31, SIZE - 27);
  }
}

/**
 * 프테라노 (파랑) 그리기: 날개 + 볏 + 날씬한 몸
 */
function drawPtera(g, ox, frame) {
  const color = DINOS[3].color;
  const isJump = frame === 2;
  const isFall = frame === 3;
  const surprised = isJump || isFall;

  // 날개 펄럭임 (달리기1: 위, 달리기2: 아래, 점프: 활짝)
  const wingAngle = frame === 0 ? -5 : frame === 1 ? 5 : frame === 2 ? -8 : 0;

  // 날씬한 몸통
  g.fillStyle(color);
  g.fillEllipse(ox + 24, SIZE - 20, 16, 12);

  // 머리
  g.fillStyle(color);
  g.fillCircle(ox + 32, SIZE - 30, 7);

  // 볏 (머리 뒤로 뻗은 뾰족한 장식 - 프테라노 핵심!)
  g.fillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(20).color);
  g.fillTriangle(ox + 28, SIZE - 34, ox + 18, SIZE - 38, ox + 26, SIZE - 28);

  // 부리 (뾰족한 입)
  g.fillStyle(0xFFCC44);
  g.fillTriangle(ox + 37, SIZE - 30, ox + 42, SIZE - 28, ox + 37, SIZE - 26);

  // 얼굴
  drawFace(g, ox + 30, SIZE - 31, surprised);

  // 날개 (양쪽 삼각형 - 프테라노 특징!)
  const darker = Phaser.Display.Color.IntegerToColor(color).darken(10).color;
  g.fillStyle(darker);
  // 왼쪽 날개
  g.fillTriangle(
    ox + 18, SIZE - 20,
    ox + 4, SIZE - 20 + wingAngle,
    ox + 16, SIZE - 14
  );
  // 오른쪽 날개
  g.fillTriangle(
    ox + 30, SIZE - 20,
    ox + 44, SIZE - 20 + wingAngle,
    ox + 32, SIZE - 14
  );

  // 작은 다리 (프테라노는 다리가 짧음)
  g.fillStyle(darker);
  const legOffset = frame === 0 ? 2 : frame === 1 ? -2 : 0;
  g.fillRoundedRect(ox + 20 + legOffset, SIZE - 8, 3, 6, 1);
  g.fillRoundedRect(ox + 27 - legOffset, SIZE - 8, 3, 6, 1);

  // 넘어짐 표시
  if (isFall) {
    g.lineStyle(1.5, 0x000000, 1);
    g.lineBetween(ox + 28, SIZE - 34, ox + 32, SIZE - 30);
    g.lineBetween(ox + 32, SIZE - 34, ox + 28, SIZE - 30);
  }
}

/**
 * 공룡 스프라이트시트를 생성하고 Phaser 텍스처에 등록
 * BootScene에서 호출됨
 * @param {Phaser.Scene} scene - 현재 씬
 */
export function createDinoTextures(scene) {
  // 각 공룡별 그리기 함수 매핑
  const drawFunctions = [drawBrachio, drawTrex, drawTricera, drawPtera];

  DINOS.forEach((dino, index) => {
    // 192x48 RenderTexture 생성 (4프레임 x 48px = 192px 너비)
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

    // RenderTexture의 내용을 텍스처로 저장 (spritesheet처럼 사용 가능)
    rt.saveTexture(dino.key);
    rt.destroy(); // RenderTexture도 정리

    // 스프라이트시트 프레임 정보 등록
    // (Phaser에게 "이 텍스처는 48px씩 잘라서 쓸 거야"라고 알려줌)
    const texture = scene.textures.get(dino.key);
    texture.add(0, 0, 0, 0, SIZE, SIZE);     // 프레임 0: 달리기1
    texture.add(1, 0, SIZE, 0, SIZE, SIZE);   // 프레임 1: 달리기2
    texture.add(2, 0, SIZE * 2, 0, SIZE, SIZE); // 프레임 2: 점프
    texture.add(3, 0, SIZE * 3, 0, SIZE, SIZE); // 프레임 3: 넘어짐

    // 애니메이션 등록 (달리기: 프레임 0-1 반복, 점프: 프레임 2 한 장)
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
