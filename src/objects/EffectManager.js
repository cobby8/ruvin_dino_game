/**
 * EffectManager.js - 이펙트 관리자
 * 적 처치 시 별 파티클 + "퍽!" 텍스트 팝업 + 점수 팝업을 관리
 * Phaser 트윈으로 구현 (파티클 시스템 대신 단순 그래픽 객체 활용)
 */

export class EffectManager {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 적 처치 이펙트: 별 파티클(5~8개) + "퍽!" 텍스트
   * 적이 사라지는 위치에서 별이 사방으로 퍼지고, "퍽!" 글자가 튀어오름
   * @param {number} x - 이펙트 중심 x
   * @param {number} y - 이펙트 중심 y
   */
  showDefeatEffect(x, y) {
    const scene = this.scene;

    // === 별 파티클 (5~8개가 사방으로 퍼짐) ===
    const starCount = Phaser.Math.Between(5, 8);
    for (let i = 0; i < starCount; i++) {
      // 별 모양을 작은 원으로 대체 (간단하고 가벼움)
      const star = scene.add.graphics();
      // 노란색 + 흰색 별 모양
      const colors = [0xFFD700, 0xFFFF00, 0xFFA500, 0xFFFFFF];
      const color = colors[i % colors.length];
      const size = Phaser.Math.Between(3, 6);

      // 별 십자 모양 그리기 (단순화된 별)
      star.fillStyle(color);
      star.fillRect(-size / 2, -1, size, 2);  // 가로줄
      star.fillRect(-1, -size / 2, 2, size);  // 세로줄
      // 대각선 추가 (별 느낌)
      star.fillStyle(color, 0.7);
      star.fillCircle(0, 0, size * 0.4);

      star.setPosition(x, y);
      star.setDepth(20); // UI보다 앞에 표시

      // 랜덤 방향으로 날아감
      const angle = (Math.PI * 2 / starCount) * i + Math.random() * 0.5;
      const distance = Phaser.Math.Between(30, 60);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance - 20; // 살짝 위로

      scene.tweens.add({
        targets: star,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Sine.easeOut',
        onComplete: () => star.destroy(),
      });
    }

    // === "퍽!" 텍스트 팝업 ===
    const pukText = scene.add.text(x, y - 10, '퍽!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FF4444',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);

    // 위로 떠오르며 커졌다가 사라짐
    scene.tweens.add({
      targets: pukText,
      y: y - 50,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => pukText.destroy(),
    });
  }

  /**
   * 점수 팝업: "+3" 같은 텍스트가 위로 떠오르며 사라짐
   * @param {number} x - 팝업 위치 x
   * @param {number} y - 팝업 위치 y
   * @param {number} points - 획득 점수
   */
  showScorePopup(x, y, points) {
    const scene = this.scene;

    const scoreText = scene.add.text(x + 20, y - 20, `+${points}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(21);

    // 위로 떠오르며 서서히 사라짐
    scene.tweens.add({
      targets: scoreText,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => scoreText.destroy(),
    });
  }
}
