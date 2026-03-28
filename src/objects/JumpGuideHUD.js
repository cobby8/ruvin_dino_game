/**
 * JumpButtonHUD - 점프 버튼 시각 표시 (우하단 고정)
 *
 * 버튼은 시각적 표시만 담당하고, 실제 터치 입력은 GameScene에서 처리.
 * (Phaser 컨테이너 내 setInteractive 터치 문제 회피)
 *
 * - "톡" 버튼 (파란): 낮은 점프
 * - "쑥" 버튼 (주황): 높은 점프
 */

import Phaser from 'phaser';

export class JumpButtonHUD {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    // 버튼 크기 및 배치 설정
    this.btnRadius = 35;        // 버튼 반지름
    const gap = 15;
    const marginRight = 20;
    const marginBottom = 25;

    // 버튼 중심 좌표 (GameScene에서 터치 판정에 사용)
    this.highX = width - marginRight - this.btnRadius;
    this.highY = height - marginBottom - this.btnRadius;
    this.lowX = this.highX - this.btnRadius * 2 - gap;
    this.lowY = this.highY;

    // === 낮은 점프 버튼 (파란색) ===
    this.lowBg = scene.add.circle(this.lowX, this.lowY, this.btnRadius, 0x4488ff, 0.7);
    this.lowBg.setStrokeStyle(3, 0xffffff, 0.9);
    this.lowBg.setDepth(200);

    this.lowArrow = scene.add.text(this.lowX, this.lowY - 8, '▲', {
      fontSize: '24px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201);

    this.lowLabel = scene.add.text(this.lowX, this.lowY + 18, '톡', {
      fontSize: '14px', fontFamily: 'Jua, Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201);

    // === 높은 점프 버튼 (주황색) ===
    this.highBg = scene.add.circle(this.highX, this.highY, this.btnRadius, 0xff6644, 0.7);
    this.highBg.setStrokeStyle(3, 0xffffff, 0.9);
    this.highBg.setDepth(200);

    this.highArrow = scene.add.text(this.highX, this.highY - 8, '▲▲', {
      fontSize: '24px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201);

    this.highLabel = scene.add.text(this.highX, this.highY + 18, '쑥', {
      fontSize: '14px', fontFamily: 'Jua, Arial', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(201);
  }

  /**
   * 터치 좌표가 낮은 점프 버튼 영역인지 확인
   */
  isLowButton(x, y) {
    const dx = x - this.lowX;
    const dy = y - this.lowY;
    return (dx * dx + dy * dy) <= (this.btnRadius + 10) * (this.btnRadius + 10);
  }

  /**
   * 터치 좌표가 높은 점프 버튼 영역인지 확인
   */
  isHighButton(x, y) {
    const dx = x - this.highX;
    const dy = y - this.highY;
    return (dx * dx + dy * dy) <= (this.btnRadius + 10) * (this.btnRadius + 10);
  }

  /** 낮은 버튼 눌림 효과 */
  pressLow() {
    this.lowBg.setFillStyle(0x2266dd, 0.9);
  }

  /** 높은 버튼 눌림 효과 */
  pressHigh() {
    this.highBg.setFillStyle(0xdd4422, 0.9);
  }

  /** 버튼 원래 색으로 복원 */
  release() {
    this.lowBg.setFillStyle(0x4488ff, 0.7);
    this.highBg.setFillStyle(0xff6644, 0.7);
  }

  destroy() {
    [this.lowBg, this.lowArrow, this.lowLabel,
     this.highBg, this.highArrow, this.highLabel].forEach(obj => {
      if (obj) obj.destroy();
    });
  }
}
