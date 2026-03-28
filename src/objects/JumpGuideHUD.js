/**
 * JumpGuideHUD.js - 점프 가이드 UI
 * 게임 시작 시 5초간 화면 하단에 좌우 영역 안내를 보여주는 반투명 가이드.
 * 왼쪽 = "톡! 낮은점프", 오른쪽 = "쑥! 높은점프"
 * 4초 후 1초에 걸쳐 페이드아웃되고 자동 파괴됨.
 */

import Phaser from 'phaser';

export class JumpGuideHUD {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    // 컨테이너: 모든 가이드 요소를 묶어서 한번에 페이드아웃
    this.container = scene.add.container(0, 0);
    this.container.setDepth(15); // UI 위에 표시 (HUD depth=10 보다 위)

    // === 왼쪽 가이드 (낮은 점프) ===
    const leftBg = scene.add.rectangle(width * 0.25, height * 0.85, width * 0.4, 60, 0x000000, 0.3);
    leftBg.setStrokeStyle(2, 0xffffff, 0.3);
    const leftText = scene.add.text(width * 0.25, height * 0.85, '톡! 낮은점프', {
      fontSize: '18px',
      fontFamily: 'Jua, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // === 오른쪽 가이드 (높은 점프) ===
    const rightBg = scene.add.rectangle(width * 0.75, height * 0.85, width * 0.4, 60, 0x000000, 0.3);
    rightBg.setStrokeStyle(2, 0xffffff, 0.3);
    const rightText = scene.add.text(width * 0.75, height * 0.85, '쑥! 높은점프', {
      fontSize: '18px',
      fontFamily: 'Jua, Arial, sans-serif',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.container.add([leftBg, leftText, rightBg, rightText]);

    // 5초 후 페이드아웃 (4초 대기 + 1초 페이드)
    scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 1000,
      delay: 4000,
      onComplete: () => {
        this.container.destroy();
      }
    });
  }
}
