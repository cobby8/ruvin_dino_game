/**
 * Background.js - 패럴랙스 배경 (레이어가 다른 속도로 스크롤)
 * 4개 레이어가 뒤에서 앞으로 겹쳐져서 입체감을 줌
 * (먼 산은 천천히, 가까운 풀밭은 빨리 움직이는 것처럼)
 *
 * 고도화: 하늘 그라디언트, 뭉게구름, 2겹 산, 꽃 풀밭
 */

/**
 * 배경 텍스처를 코드로 생성하여 등록
 * BootScene에서 호출됨
 * @param {Phaser.Scene} scene
 */
export function createBackgroundTextures(scene) {
  const w = 480; // 텍스처 너비 (반복 타일링할 기본 단위, 넓혀서 자연스럽게)
  const h = 200; // 텍스처 높이

  // === 하늘 레이어 (위에서 아래로 그라디언트 #87CEEB → #E0F0FF) ===
  const gSky = scene.add.graphics();
  // 그라디언트를 세로 줄무늬로 표현 (Phaser Graphics 한계상 fillRect 반복)
  const skySteps = 20;
  for (let i = 0; i < skySteps; i++) {
    const t = i / (skySteps - 1); // 0~1 비율
    // #87CEEB(135,206,235) → #E0F0FF(224,240,255)
    const r = Math.round(135 + (224 - 135) * t);
    const gVal = Math.round(206 + (240 - 206) * t);
    const b = Math.round(235 + (255 - 235) * t);
    const color = (r << 16) | (gVal << 8) | b;
    gSky.fillStyle(color);
    gSky.fillRect(0, (h / skySteps) * i, w, (h / skySteps) + 1);
  }
  gSky.generateTexture('bg_sky', w, h);
  gSky.destroy();

  // === 구름 레이어 (뭉게뭉게 큰 원 3~4개 겹쳐서) ===
  const gCloud = scene.add.graphics();

  // 구름 1 (큰 뭉게구름 - 원 4개 겹침)
  gCloud.fillStyle(0xFFFFFF, 0.85);
  gCloud.fillCircle(60, 70, 24);
  gCloud.fillCircle(82, 60, 30);
  gCloud.fillCircle(108, 65, 26);
  gCloud.fillCircle(92, 76, 22);
  // 구름 하이라이트 (약간 밝은 점)
  gCloud.fillStyle(0xFFFFFF, 0.4);
  gCloud.fillCircle(78, 54, 14);

  // 구름 2 (중간 크기)
  gCloud.fillStyle(0xFFFFFF, 0.8);
  gCloud.fillCircle(260, 50, 20);
  gCloud.fillCircle(282, 42, 28);
  gCloud.fillCircle(305, 48, 22);
  gCloud.fillCircle(290, 58, 18);
  gCloud.fillStyle(0xFFFFFF, 0.35);
  gCloud.fillCircle(278, 38, 12);

  // 구름 3 (작은 구름)
  gCloud.fillStyle(0xFFFFFF, 0.75);
  gCloud.fillCircle(410, 75, 16);
  gCloud.fillCircle(430, 68, 22);
  gCloud.fillCircle(448, 74, 14);

  gCloud.generateTexture('bg_cloud', w, h);
  gCloud.destroy();

  // === 산 레이어 (2겹: 뒷산 연보라 + 앞산 연녹, 부드러운 곡선) ===
  const gMountain = scene.add.graphics();

  // 뒷산 (연보라 #D4B8E0) - 부드러운 곡선 형태
  gMountain.fillStyle(0xD4B8E0, 0.7);
  gMountain.beginPath();
  gMountain.moveTo(0, h);
  // 곡선으로 산 표현 (여러 제어점)
  gMountain.lineTo(0, h * 0.55);
  gMountain.lineTo(40, h * 0.35);
  gMountain.lineTo(80, h * 0.45);
  gMountain.lineTo(120, h * 0.25);
  gMountain.lineTo(160, h * 0.4);
  gMountain.lineTo(200, h * 0.5);
  gMountain.lineTo(250, h * 0.3);
  gMountain.lineTo(300, h * 0.42);
  gMountain.lineTo(350, h * 0.28);
  gMountain.lineTo(400, h * 0.38);
  gMountain.lineTo(440, h * 0.32);
  gMountain.lineTo(w, h * 0.45);
  gMountain.lineTo(w, h);
  gMountain.closePath();
  gMountain.fillPath();

  // 앞산 (연녹 #A8D5A2) - 약간 낮고 덮임
  gMountain.fillStyle(0xA8D5A2, 0.8);
  gMountain.beginPath();
  gMountain.moveTo(0, h);
  gMountain.lineTo(0, h * 0.6);
  gMountain.lineTo(50, h * 0.5);
  gMountain.lineTo(100, h * 0.55);
  gMountain.lineTo(150, h * 0.42);
  gMountain.lineTo(200, h * 0.55);
  gMountain.lineTo(260, h * 0.48);
  gMountain.lineTo(320, h * 0.56);
  gMountain.lineTo(380, h * 0.44);
  gMountain.lineTo(430, h * 0.52);
  gMountain.lineTo(w, h * 0.58);
  gMountain.lineTo(w, h);
  gMountain.closePath();
  gMountain.fillPath();

  gMountain.generateTexture('bg_mountain', w, h);
  gMountain.destroy();

  // === 풀밭 레이어 (연두색 바닥 + 진한 풀 장식 + 작은 꽃) ===
  const gGrass = scene.add.graphics();
  const grassH = 40;

  // 바닥 (연두색)
  gGrass.fillStyle(0x7EC850);
  gGrass.fillRect(0, 0, w, grassH);

  // 약간 밝은 상단부 (그라디언트 느낌)
  gGrass.fillStyle(0x8ED860, 0.6);
  gGrass.fillRect(0, 0, w, 8);

  // 진한 풀 장식 (어두운 녹색 삼각형들 - 다양한 크기)
  gGrass.fillStyle(0x5BA83A);
  for (let i = 0; i < 30; i++) {
    const gx = (i * 16 + 3) % w;
    const gh = 6 + (i % 3) * 4; // 6, 10, 14px 높이 교대
    gGrass.fillTriangle(gx, 0, gx + 2, -gh, gx + 4, 0);
  }
  // 추가 풀 (조금 밝은 녹색)
  gGrass.fillStyle(0x6DBF48);
  for (let i = 0; i < 15; i++) {
    const gx = (i * 32 + 12) % w;
    gGrass.fillTriangle(gx, 0, gx + 3, -10, gx + 6, 0);
  }

  // 작은 꽃들 (분홍 #FFB8D0, 노랑 #FFE066)
  const flowerColors = [0xFFB8D0, 0xFFE066, 0xFFB8D0, 0xFFE066, 0xFFB8D0];
  for (let i = 0; i < 10; i++) {
    const fx = (i * 48 + 20) % w;
    const fc = flowerColors[i % flowerColors.length];

    // 꽃 줄기
    gGrass.lineStyle(1, 0x5BA83A);
    gGrass.lineBetween(fx, 0, fx, -6);

    // 꽃 (작은 원)
    gGrass.fillStyle(fc);
    gGrass.fillCircle(fx, -7, 3);
    // 꽃 중심 (노란 점)
    gGrass.fillStyle(0xFFFF88);
    gGrass.fillCircle(fx, -7, 1.2);
  }

  gGrass.generateTexture('bg_grass', w, grassH);
  gGrass.destroy();
}

/**
 * 패럴랙스 배경 관리 클래스
 * 각 레이어가 서로 다른 속도로 스크롤되어 입체감 연출
 */
export class Background {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} groundY - 바닥 y좌표
   */
  constructor(scene, groundY) {
    this.scene = scene;
    const { width, height } = scene.scale;

    // 하늘 레이어 (고정 배경 - 그라디언트)
    this.sky = scene.add.tileSprite(0, 0, width, height, 'bg_sky');
    this.sky.setOrigin(0, 0);
    this.sky.setDepth(-1);

    // 구름 레이어 (가장 느리게 = 가장 멀리 있음)
    this.clouds = scene.add.tileSprite(0, 0, width, 200, 'bg_cloud');
    this.clouds.setOrigin(0, 0);
    this.clouds.setDepth(0);
    this.clouds.setAlpha(0.8);
    this.cloudSpeed = 0.2;

    // 산 레이어 (중간 속도)
    this.mountains = scene.add.tileSprite(0, groundY - 180, width, 200, 'bg_mountain');
    this.mountains.setOrigin(0, 0);
    this.mountains.setDepth(1);
    this.mountainSpeed = 0.4;

    // 풀밭 레이어 (게임 속도와 동일 = 가장 가까움)
    this.grass = scene.add.tileSprite(0, groundY, width, 40, 'bg_grass');
    this.grass.setOrigin(0, 0);
    this.grass.setDepth(2);
    this.grassSpeed = 1.0;
  }

  /**
   * 매 프레임 호출: 각 레이어를 서로 다른 속도로 스크롤
   * @param {number} speed - 현재 게임 속도
   * @param {number} delta - 프레임 경과 시간 (ms)
   */
  update(speed, delta) {
    const dt = delta / 1000;
    // 하늘은 매우 느리게 (거의 안 움직임)
    this.sky.tilePositionX += speed * 0.05 * dt;
    this.clouds.tilePositionX += speed * this.cloudSpeed * dt;
    this.mountains.tilePositionX += speed * this.mountainSpeed * dt;
    this.grass.tilePositionX += speed * this.grassSpeed * dt;
  }

  /**
   * 화면 크기 변경 시 레이어 크기 재조정
   * @param {number} width - 새 화면 너비
   * @param {number} groundY - 새 바닥 y좌표
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
