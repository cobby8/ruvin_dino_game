/**
 * Background.js - 패럴랙스 배경 (레이어가 다른 속도로 스크롤)
 * 4개 레이어가 뒤에서 앞으로 겹쳐져서 입체감을 줌
 * (먼 산은 천천히, 가까운 풀밭은 빨리 움직이는 것처럼)
 */

/**
 * 배경 텍스처를 코드로 생성하여 등록
 * BootScene에서 호출됨
 * @param {Phaser.Scene} scene
 */
export function createBackgroundTextures(scene) {
  const w = 360; // 텍스처 너비 (반복 타일링할 기본 단위)
  const h = 200; // 텍스처 높이

  // === 구름 레이어 (뭉게뭉게 흰 구름) ===
  const gCloud = scene.add.graphics();
  // 구름 1 (큰 뭉게구름)
  gCloud.fillStyle(0xFFFFFF, 0.8);
  gCloud.fillCircle(60, 50, 20);
  gCloud.fillCircle(80, 45, 25);
  gCloud.fillCircle(100, 50, 18);
  // 구름 2 (작은 구름)
  gCloud.fillCircle(220, 35, 15);
  gCloud.fillCircle(240, 30, 20);
  gCloud.fillCircle(255, 35, 12);
  // 구름 3
  gCloud.fillCircle(330, 55, 12);
  gCloud.fillCircle(345, 50, 16);

  gCloud.generateTexture('bg_cloud', w, h);
  gCloud.destroy();

  // === 산 레이어 (연보라/연녹 삼각형 산맥) ===
  const gMountain = scene.add.graphics();
  // 뒤쪽 산 (연보라)
  gMountain.fillStyle(0xC9B8E8, 0.6);
  gMountain.fillTriangle(0, h, 70, 40, 140, h);
  gMountain.fillTriangle(200, h, 280, 50, 360, h);

  // 앞쪽 산 (연녹색)
  gMountain.fillStyle(0xA8D8A8, 0.7);
  gMountain.fillTriangle(50, h, 130, 70, 210, h);
  gMountain.fillTriangle(250, h, 320, 80, 390, h);

  gMountain.generateTexture('bg_mountain', w, h);
  gMountain.destroy();

  // === 풀밭 레이어 (연두색 바닥 + 꽃, 풀) ===
  const gGrass = scene.add.graphics();
  // 바닥 (연두색)
  gGrass.fillStyle(0x7EC850);
  gGrass.fillRect(0, 0, w, 40);

  // 풀 (어두운 녹색 작은 삼각형들)
  gGrass.fillStyle(0x5BA83A);
  for (let i = 0; i < 20; i++) {
    const gx = (i * 18 + 5) % w;
    gGrass.fillTriangle(gx, 0, gx + 3, -8, gx + 6, 0);
  }

  // 꽃 (빨강, 노랑, 분홍 점들)
  const flowerColors = [0xFF6B6B, 0xFFE066, 0xFF9FF3, 0xFFFFFF];
  for (let i = 0; i < 8; i++) {
    const fx = (i * 45 + 20) % w;
    gGrass.fillStyle(flowerColors[i % flowerColors.length]);
    gGrass.fillCircle(fx, -2, 2.5);
    // 꽃 줄기
    gGrass.lineStyle(1, 0x5BA83A);
    gGrass.lineBetween(fx, -2, fx, 3);
  }

  gGrass.generateTexture('bg_grass', w, 40);
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

    // 구름 레이어 (가장 느리게 = 가장 멀리 있음)
    this.clouds = scene.add.tileSprite(0, 0, width, 200, 'bg_cloud');
    this.clouds.setOrigin(0, 0);
    this.clouds.setDepth(0);             // 가장 뒤
    this.clouds.setAlpha(0.8);
    this.cloudSpeed = 0.2;               // 게임 속도의 20%

    // 산 레이어 (중간 속도)
    this.mountains = scene.add.tileSprite(0, groundY - 180, width, 200, 'bg_mountain');
    this.mountains.setOrigin(0, 0);
    this.mountains.setDepth(1);
    this.mountainSpeed = 0.4;            // 게임 속도의 40%

    // 풀밭 레이어 (게임 속도와 동일 = 가장 가까움)
    this.grass = scene.add.tileSprite(0, groundY, width, 40, 'bg_grass');
    this.grass.setOrigin(0, 0);
    this.grass.setDepth(2);
    this.grassSpeed = 1.0;               // 게임 속도의 100%
  }

  /**
   * 매 프레임 호출: 각 레이어를 서로 다른 속도로 스크롤
   * @param {number} speed - 현재 게임 속도
   * @param {number} delta - 프레임 경과 시간 (ms)
   */
  update(speed, delta) {
    // tilePositionX를 증가시키면 왼쪽으로 스크롤되는 효과
    const dt = delta / 1000; // ms -> 초 변환
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
    this.clouds.width = width;
    this.mountains.width = width;
    this.mountains.y = groundY - 180;
    this.grass.width = width;
    this.grass.y = groundY;
  }
}
