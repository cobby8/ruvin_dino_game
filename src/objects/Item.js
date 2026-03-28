/**
 * Item.js - 수집 아이템 시스템
 * 별(코인), 하트, 무적별, 자석, 방어막 5종 아이템 + 아이템 매니저
 *
 * 마리오의 코인/버섯처럼, 공룡이 닿으면 자동으로 수집됨.
 * 별은 공중에 3~5개씩 줄지어 배치, 하트/파워업은 단독 배치.
 *
 * 오브젝트 풀링: Obstacle/Enemy와 동일한 패턴.
 * setup()으로 재활용, cleanup()으로 화면 밖 비활성화.
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';

// ============================================================
// 아이템 텍스처 생성 (Phaser Graphics로 코드만으로 그림)
// ============================================================

/**
 * 모든 아이템 텍스처를 생성하는 함수 (BootScene에서 호출)
 * @param {Phaser.Scene} scene - BootScene
 */
export function createAllItemTextures(scene) {
  _createStarTexture(scene);
  _createHeartItemTexture(scene);
  _createInvincibleTexture(scene);
  _createMagnetTexture(scene);
  _createShieldTexture(scene);
}

/** 별 (star): 노란색 오각별, 30x30, 반짝이 효과 */
function _createStarTexture(scene) {
  const size = 30;
  const g = scene.add.graphics();

  // 오각별 그리기 (10개 꼭짓점: 외곽 5개 + 내곽 5개)
  const cx = size / 2, cy = size / 2;
  const outerR = 13, innerR = 6; // 바깥/안쪽 반지름

  g.fillStyle(0xFFD700); // 금색
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    // 짝수 = 바깥 꼭짓점, 홀수 = 안쪽 꼭짓점
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * 2 / 10) * i - Math.PI / 2; // -90도부터 (꼭대기가 위)
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillPath();

  // 가운데 하이라이트 (반짝이 느낌)
  g.fillStyle(0xFFFF88, 0.7);
  g.fillCircle(cx - 2, cy - 2, 3);

  g.generateTexture('item_star', size, size);
  g.destroy();
}

/** 하트 아이템 (heart): 분홍 하트, 25x25 */
function _createHeartItemTexture(scene) {
  const size = 25;
  const g = scene.add.graphics();
  const cx = size / 2, cy = size / 2;
  const s = 10; // 하트 크기 기준

  // 분홍색 하트 (HeartHUD와 동일한 모양)
  g.fillStyle(0xFF6B9D);
  g.fillCircle(cx - s * 0.3, cy - s * 0.15, s * 0.45);
  g.fillCircle(cx + s * 0.3, cy - s * 0.15, s * 0.45);
  g.fillTriangle(
    cx - s * 0.7, cy,
    cx + s * 0.7, cy,
    cx, cy + s * 0.75
  );

  // 하이라이트
  g.fillStyle(0xFFAAAA, 0.6);
  g.fillCircle(cx - s * 0.2, cy - s * 0.3, s * 0.15);

  g.generateTexture('item_heart', size, size);
  g.destroy();
}

/** 무적별 (invincible): 큰 노란별 + 무지개 테두리, 35x35 */
function _createInvincibleTexture(scene) {
  const size = 35;
  const g = scene.add.graphics();
  const cx = size / 2, cy = size / 2;
  const outerR = 15, innerR = 7;

  // 무지개 테두리 (원형)
  g.lineStyle(3, 0xFF0000, 0.8);
  g.strokeCircle(cx, cy, 16);
  g.lineStyle(2, 0xFF8800, 0.6);
  g.strokeCircle(cx, cy, 15);
  g.lineStyle(2, 0x00FF00, 0.4);
  g.strokeCircle(cx, cy, 14);

  // 금색 별 (star와 동일 모양, 더 큼)
  g.fillStyle(0xFFD700);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * 2 / 10) * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fillPath();

  // 가운데 밝은 원
  g.fillStyle(0xFFFFCC, 0.8);
  g.fillCircle(cx, cy, 4);

  g.generateTexture('item_invincible', size, size);
  g.destroy();
}

/** 자석 (magnet): U자 자석 빨강/파랑, 30x30 */
function _createMagnetTexture(scene) {
  const size = 30;
  const g = scene.add.graphics();

  // U자 자석 그리기
  // 왼쪽 다리 (빨강)
  g.fillStyle(0xFF4444);
  g.fillRect(4, 4, 8, 20);
  // 아래 곡선 (회색 - 자석 바닥)
  g.fillStyle(0xAAAAAA);
  g.fillRect(4, 20, 22, 6);
  // 오른쪽 다리 (파랑)
  g.fillStyle(0x4444FF);
  g.fillRect(18, 4, 8, 20);

  // 자석 끝 흰색 팁
  g.fillStyle(0xFFFFFF);
  g.fillRect(4, 4, 8, 4);
  g.fillRect(18, 4, 8, 4);

  g.generateTexture('item_magnet', size, size);
  g.destroy();
}

/** 방어막 (shield): 파란 방패 모양, 30x30 */
function _createShieldTexture(scene) {
  const size = 30;
  const g = scene.add.graphics();
  const cx = size / 2, cy = size / 2;

  // 방패 외곽 (파란색)
  g.fillStyle(0x4EAEFF, 0.9);
  g.beginPath();
  g.moveTo(cx, 3);          // 꼭대기
  g.lineTo(size - 3, 8);    // 오른쪽 위
  g.lineTo(size - 5, 20);   // 오른쪽 아래
  g.lineTo(cx, size - 2);   // 아래 꼭지점
  g.lineTo(5, 20);          // 왼쪽 아래
  g.lineTo(3, 8);           // 왼쪽 위
  g.closePath();
  g.fillPath();

  // 테두리
  g.lineStyle(2, 0x2080CC);
  g.beginPath();
  g.moveTo(cx, 3);
  g.lineTo(size - 3, 8);
  g.lineTo(size - 5, 20);
  g.lineTo(cx, size - 2);
  g.lineTo(5, 20);
  g.lineTo(3, 8);
  g.closePath();
  g.strokePath();

  // 가운데 별 무늬
  g.fillStyle(0xFFFFFF, 0.6);
  g.fillCircle(cx, cy + 1, 5);

  g.generateTexture('item_shield', size, size);
  g.destroy();
}

// ============================================================
// Item 클래스: 개별 아이템 오브젝트
// ============================================================

export class Item extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'item_star');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 기본 설정
    this.body.setAllowGravity(false); // 공중에 떠있음 (중력 무시)
    this.setDepth(4); // 배경(0-3)보다 앞, 장애물(5)보다 뒤

    this.itemType = 'star'; // 아이템 종류 ('star', 'heart', 'invincible', 'magnet', 'shield')
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 아이템 초기화 (풀링에서 꺼낼 때)
   * @param {string} type - 아이템 종류
   * @param {number} x - x좌표
   * @param {number} y - y좌표
   * @param {number} speed - 현재 게임 속도 (왼쪽으로 이동)
   */
  setup(type, x, y, speed) {
    this.itemType = type;

    // 아이템 이미지 프레임 매핑 (img_items 스프라이트시트)
    // 0=별, 1=하트, 2=무적별, 3=자석, 4=방어막, 5=물음표블록, 6=스프링, 7=부스트
    const ITEM_FRAME_MAP = { star: 0, heart: 1, invincible: 2, magnet: 3, shield: 4 };

    // 이미지 텍스처(PNG)가 있으면 사용, 없으면 기존 Graphics 텍스처
    const useImage = this.scene.textures.exists('img_items') && ITEM_FRAME_MAP[type] !== undefined;
    if (useImage) {
      this.setTexture('img_items', ITEM_FRAME_MAP[type]);
    } else {
      this.setTexture(`item_${type}`);
    }

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);

    // 이미지(366x352)를 기존 아이템 크기(약 30px)에 맞게 축소
    if (useImage) {
      this.setScale(30 / 352);
    } else {
      this.setScale(1);
    }

    // 왼쪽으로 이동 (장애물과 같은 속도)
    this.body.setVelocityX(-speed);
    this.body.setAllowGravity(false);

    // 히트박스를 텍스처 크기에 맞춤
    this.body.setSize(this.width * 0.8, this.height * 0.8);

    // 위아래 살짝 흔들림 (떠있는 느낌) - 트윈
    if (this._floatTween) this._floatTween.destroy();
    this._floatTween = this.scene.tweens.add({
      targets: this,
      y: y - 8, // 위로 8px 왔다갔다
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * 수집 이펙트: 확대 후 사라짐
   */
  collect() {
    // 흔들림 트윈 정지
    if (this._floatTween) {
      this._floatTween.destroy();
      this._floatTween = null;
    }

    // 수집 애니메이션 (커졌다가 투명해지며 사라짐)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.body.setVelocityX(0);
      },
    });
  }

  /**
   * 비활성화 (화면 밖으로 나갔을 때)
   */
  deactivate() {
    if (this._floatTween) {
      this._floatTween.destroy();
      this._floatTween = null;
    }
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocityX(0);
  }
}

// ============================================================
// ItemManager: 아이템 풀링 + 스폰 관리
// ============================================================

export class ItemManager {
  /**
   * @param {Phaser.Scene} scene - GameScene
   */
  constructor(scene) {
    this.scene = scene;

    // 물리 그룹 (오브젝트 풀링)
    this.group = scene.physics.add.group({
      classType: Item,
      maxSize: 30,     // 최대 30개 아이템 풀
      runChildUpdate: false,
    });

    // 풀에 아이템 미리 생성 (비활성 상태)
    for (let i = 0; i < 30; i++) {
      const item = new Item(scene, -100, -100);
      this.group.add(item);
      item.setActive(false);
      item.setVisible(false);
    }
  }

  /**
   * 아이템 하나 스폰
   * @param {string} type - 아이템 종류
   * @param {number} x - x좌표
   * @param {number} y - y좌표
   * @param {number} speed - 현재 게임 속도
   */
  spawnItem(type, x, y, speed) {
    // 풀에서 비활성 아이템 꺼내기
    const item = this.group.getChildren().find(i => !i.active);
    if (!item) return null; // 풀 소진

    item.setup(type, x, y, speed);
    return item;
  }

  /**
   * 별 3~5개를 공중에 아치형으로 배치
   * 마리오 코인 줄처럼, 장애물 뒤에 보상으로 배치됨
   * @param {number} startX - 시작 x좌표
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   */
  spawnStarLine(startX, groundY, speed) {
    const count = Phaser.Math.Between(3, 5);
    const spacing = 35; // 별 간격 (px)

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing;
      // 아치형 높이 (가운데가 가장 높음)
      const archHeight = Math.sin((i / (count - 1)) * Math.PI) * 60;
      const y = groundY - 80 - archHeight; // 바닥 위 80~140px
      this.spawnItem('star', x, y, speed);
    }
  }

  /**
   * 화면 밖으로 나간 아이템 비활성화
   */
  cleanup() {
    this.group.getChildren().forEach(item => {
      if (item.active && item.x < -50) {
        item.deactivate();
      }
    });
  }
}
