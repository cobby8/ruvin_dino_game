/**
 * HeartHUD.js - 하트(HP) 표시 UI
 * 화면 왼쪽 상단 2행에 하트 아이콘을 표시하는 HUD.
 * 빨간 하트 = 남은 체력, 회색 빈 하트 = 잃은 체력.
 *
 * 배치: HUD 2행 좌측 (y=58, x=15부터)
 * - 하트 크기: 32px (6살이 잘 볼 수 있는 크기)
 * - 하트 간격: 42px (겹치지 않으면서 콤팩트)
 * - 프로그레스 바, 별 카운터와 같은 행에 배치 (겹침 없음)
 */

import { GAME } from '../config.js';

export class HeartHUD {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} maxHearts - 최대 하트 수 (난이도에 따라 1~5)
   * @param {number} x - 첫 하트의 x 좌표
   * @param {number} y - 하트의 y 좌표
   */
  constructor(scene, maxHearts, x, y) {
    this.scene = scene;
    this.maxHearts = maxHearts;
    this.currentHearts = maxHearts;
    this.x = x;
    this.y = y;
    this.heartSize = 32;           // 하트 크기 32px (6살 눈에 잘 보임)
    this.spacing = 42;             // 하트 간격 42px (겹치지 않으면서 콤팩트)
    this.hearts = [];

    this._createHearts();
  }

  /**
   * 하트 아이콘들을 생성하여 화면에 배치
   * Graphics API로 하트 모양을 그림 (원 2개 + 아래 삼각형)
   */
  _createHearts() {
    for (let i = 0; i < this.maxHearts; i++) {
      const hx = this.x + i * this.spacing;

      const g = this.scene.add.graphics();
      g.setDepth(100);
      g.setPosition(hx, this.y);

      // 빨간 하트 그리기 (초기 상태 = 모두 채워진 하트)
      this._drawHeart(g, 0, 0, true);

      this.hearts.push({
        graphics: g,
        filled: true,
        x: hx,
        y: this.y,
      });
    }
  }

  /**
   * 하트 모양 그리기 (두 개의 원 + 아래 삼각형 조합)
   * @param {Phaser.GameObjects.Graphics} g - Graphics 객체
   * @param {number} cx - 중심 x (로컬 좌표)
   * @param {number} cy - 중심 y (로컬 좌표)
   * @param {boolean} filled - true=빨간 하트, false=빈 하트(회색)
   */
  _drawHeart(g, cx, cy, filled) {
    g.clear();
    const s = this.heartSize;

    if (filled) {
      // 채워진 빨간 하트
      g.fillStyle(0xFF4444, 1);
      g.fillCircle(cx - s * 0.3, cy - s * 0.15, s * 0.45);
      g.fillCircle(cx + s * 0.3, cy - s * 0.15, s * 0.45);
      g.fillTriangle(
        cx - s * 0.7, cy,
        cx + s * 0.7, cy,
        cx, cy + s * 0.75
      );

      // 하이라이트 (반짝이는 느낌)
      g.fillStyle(0xFFAAAA, 0.6);
      g.fillCircle(cx - s * 0.2, cy - s * 0.3, s * 0.15);
    } else {
      // 빈 하트 (회색)
      g.fillStyle(0x666666, 0.3);
      g.fillCircle(cx - s * 0.3, cy - s * 0.15, s * 0.45);
      g.fillCircle(cx + s * 0.3, cy - s * 0.15, s * 0.45);
      g.fillTriangle(
        cx - s * 0.7, cy,
        cx + s * 0.7, cy,
        cx, cy + s * 0.75
      );

      // 외곽선
      g.lineStyle(1.5, 0x999999, 0.5);
      g.strokeCircle(cx - s * 0.3, cy - s * 0.15, s * 0.45);
      g.strokeCircle(cx + s * 0.3, cy - s * 0.15, s * 0.45);
    }
  }

  /**
   * 피격! 하트 1개 감소
   * @returns {boolean} true면 하트 0 = 게임오버
   */
  takeDamage() {
    if (this.currentHearts <= 0) return true;

    this.currentHearts--;

    const idx = this.currentHearts;
    const heart = this.hearts[idx];

    if (heart) {
      heart.filled = false;

      // 흔들림 애니메이션 (아파하는 느낌)
      this.scene.tweens.add({
        targets: heart.graphics,
        x: heart.x - 3,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          heart.graphics.setPosition(heart.x, heart.y);
          this._drawHeart(heart.graphics, 0, 0, false);
        },
      });
    }

    // 마지막 1개 남으면 깜빡 (위험 경고)
    if (this.currentHearts <= 1 && this.currentHearts > 0) {
      const lastHeart = this.hearts[0];
      this.scene.tweens.add({
        targets: lastHeart.graphics,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        repeat: 1,
      });
    }

    return this.currentHearts <= 0;
  }

  /**
   * 하트 1개 회복 (하트 아이템 먹었을 때)
   */
  heal() {
    if (this.currentHearts >= this.maxHearts) return;

    const idx = this.currentHearts;
    this.currentHearts++;

    const heart = this.hearts[idx];
    if (heart) {
      heart.filled = true;
      this._drawHeart(heart.graphics, 0, 0, true);

      // 팡! 커졌다 줄어듦 (회복 축하 느낌)
      this.scene.tweens.add({
        targets: heart.graphics,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }

  /**
   * 현재 하트 수 반환
   * @returns {number}
   */
  getHearts() {
    return this.currentHearts;
  }

  /**
   * HUD 정리 (씬 종료 시)
   */
  destroy() {
    this.hearts.forEach(h => h.graphics.destroy());
    this.hearts = [];
  }
}
