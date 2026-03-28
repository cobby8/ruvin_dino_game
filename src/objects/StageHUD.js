/**
 * StageHUD.js - 스테이지 진행 상황을 보여주는 HUD (헤드업 디스플레이)
 * 화면 상단에 현재 월드, 스테이지, 점수/목표, 난이도를 표시
 *
 * 구성:
 * - 상단 왼쪽: 월드 이름 + 스테이지 번호 (예: "🌿 풀밭 나라 1-3")
 * - 상단 중앙: 현재 점수 / 목표 (예: "3 / 10")
 * - 상단 오른쪽: 난이도 별 표시 (⭐⭐⭐)
 * - 프로그레스 바: 목표까지 진행도
 */

/**
 * StageHUD 클래스
 * GameScene에서 생성하여 스테이지 정보를 화면에 표시
 */
export class StageHUD {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {object} stageData - stages.js의 스테이지 데이터
   * @param {object} worldData - worlds.js의 월드 데이터
   * @param {object} difficulty - difficulties.js의 난이도 데이터
   * @param {number} targetScore - 실제 목표 점수 (난이도 배율 적용 후)
   */
  constructor(scene, stageData, worldData, difficulty, targetScore) {
    this.scene = scene;
    this.targetScore = targetScore;
    const { width } = scene.scale;

    // 깊이를 높게 설정해서 항상 맨 위에 표시 (depth: 100)
    const depth = 100;

    // === 상단 왼쪽: 월드 + 스테이지 이름 ===
    // 월드 내 스테이지 번호 계산 (예: 스테이지 13 = 월드3의 3번째 = "3-3")
    const stageInWorld = ((stageData.id - 1) % 5) + 1;
    const worldLabel = `${worldData.emoji} ${worldData.name} ${worldData.id}-${stageInWorld}`;

    this.worldText = scene.add.text(10, 8, worldLabel, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0, 0).setDepth(depth);

    // === 스테이지 이름 (월드 아래 작게) ===
    this.stageNameText = scene.add.text(10, 28, `"${stageData.name}"`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '12px',
      color: '#FFE066',
      stroke: '#333333',
      strokeThickness: 1,
    }).setOrigin(0, 0).setDepth(depth);

    // === 상단 중앙: 점수 / 목표 ===
    this.scoreText = scene.add.text(width / 2, 10, `0 / ${targetScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(depth);

    // === 상단 오른쪽: 난이도 별 표시 ===
    const stars = '⭐'.repeat(difficulty.stars);
    this.difficultyText = scene.add.text(width - 10, 8, stars, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#FFD700',
    }).setOrigin(1, 0).setDepth(depth);

    // 난이도 이름 (별 아래 작게)
    this.diffNameText = scene.add.text(width - 10, 26, difficulty.name, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '11px',
      color: '#CCCCCC',
    }).setOrigin(1, 0).setDepth(depth);

    // === 프로그레스 바 (점수 텍스트 아래) ===
    const barWidth = 120;
    const barHeight = 8;
    const barX = width / 2 - barWidth / 2;
    const barY = 42;

    // 바 배경 (어두운 반투명)
    this.barBg = scene.add.graphics().setDepth(depth);
    this.barBg.fillStyle(0x000000, 0.3);
    this.barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // 바 채움 (밝은 초록)
    this.barFill = scene.add.graphics().setDepth(depth);
    this.barX = barX;
    this.barY = barY;
    this.barWidth = barWidth;
    this.barHeight = barHeight;

    // 초기 상태 (0%)
    this._drawProgressBar(0);
  }

  /**
   * 점수 업데이트 → 텍스트 + 프로그레스 바 갱신
   * @param {number} current - 현재 점수
   */
  updateScore(current) {
    // 텍스트 업데이트
    this.scoreText.setText(`${current} / ${this.targetScore}`);

    // 프로그레스 바 업데이트
    const progress = Math.min(current / this.targetScore, 1);
    this._drawProgressBar(progress);

    // 점수 텍스트 바운스 효과
    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
    });
  }

  /**
   * 프로그레스 바 그리기 (내부용)
   * @param {number} progress - 0~1 비율
   */
  _drawProgressBar(progress) {
    this.barFill.clear();
    if (progress <= 0) return;

    // 진행도에 따라 색상 변화 (초록 → 노랑 → 빨강... 아니, 초록 유지가 나음)
    const color = progress >= 1 ? 0xFFD700 : 0x66CC77; // 완료 시 금색
    this.barFill.fillStyle(color);
    this.barFill.fillRoundedRect(
      this.barX, this.barY,
      this.barWidth * progress, this.barHeight,
      4
    );
  }

  /**
   * 목표 달성 시 호출 → 축하 효과
   */
  showClear() {
    this.scoreText.setColor('#FFD700');
    this.scoreText.setStroke('#FF6B00', 4);
    this.scoreText.setText('클리어!');

    this.scene.tweens.add({
      targets: this.scoreText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      yoyo: true,
      repeat: 1,
    });
  }
}
