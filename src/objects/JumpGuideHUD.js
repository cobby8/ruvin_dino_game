/**
 * JumpButtonHUD - 점프 안내 (게임 시작 시 5초간 표시 후 사라짐)
 *
 * 기존: 낮은/높은 점프 버튼 2개를 화면에 표시
 * 변경: 단순 안내 텍스트만 표시 후 자동 소멸
 * 이유: 점프를 "화면 아무 곳 터치 = 점프"로 극단 단순화했기 때문에 버튼 불필요
 */

import Phaser from 'phaser';

export class JumpButtonHUD {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    // 심플 안내 텍스트 (5초 후 사라짐)
    // 6살도 이해할 수 있도록 짧고 명확하게
    this.guideText = scene.add.text(width / 2, height * 0.85, '화면을 터치하면 점프!', {
      fontSize: '20px',
      fontFamily: 'Jua, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: '#00000055',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(200);

    // 4초 대기 후 1초에 걸쳐 서서히 투명해지며 사라짐
    scene.tweens.add({
      targets: this.guideText,
      alpha: 0,
      duration: 1000,
      delay: 4000,
      onComplete: () => {
        if (this.guideText) this.guideText.destroy();
      }
    });
  }

  destroy() {
    if (this.guideText) this.guideText.destroy();
  }
}
