/**
 * StageHUD.js - 스테이지 진행 상황을 보여주는 HUD (헤드업 디스플레이)
 * 6살 아이가 쉽게 읽을 수 있도록 2행 레이아웃으로 구성
 *
 * 레이아웃 (높이 95px, 반투명 배경):
 * ┌──────────────────────────────────────────────┐
 * │ 1행: 월드명 + 스테이지 번호          ⏸ 일시정지 │
 * │ 2행: ❤️❤️❤️   ═══ 0/50 ═══        ⭐ 0     │
 * └──────────────────────────────────────────────┘
 *
 * 제거된 요소 (겹침 방지):
 * - 스테이지 부제목 ("첫걸음") → 제거
 * - 난이도 이름 ("씩씩한공룡") → 제거 (DifficultyScene에서 이미 선택)
 * - 난이도 별 (★★★) → 제거 (중복 정보)
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

    // === 반투명 배경 패널 (높이 95px로 확대 - 2행이 들어갈 공간 확보) ===
    this.bgPanel = scene.add.graphics();
    this.bgPanel.setDepth(99);
    this.bgPanel.fillStyle(0x000000, 0.35);
    this.bgPanel.fillRect(0, 0, width, 95);

    const depth = 100;

    // === 1행 (y=12): 월드명 + 스테이지 번호 (fontSize 24px, 6살이 읽을 수 있는 크기) ===
    const stageInWorld = ((stageData.id - 1) % 5) + 1;
    const worldLabel = `${worldData.emoji} ${worldData.name} ${worldData.id}-${stageInWorld}`;

    this.worldText = scene.add.text(15, 12, worldLabel, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0, 0).setDepth(depth);

    // === 2행 중앙: 프로그레스 바 + 점수 텍스트 (y=55~75) ===
    // 바 크기를 키우고 흰 테두리를 추가해서 배경과 구분
    const barWidth = 180;
    const barHeight = 18;
    const barX = width / 2 - barWidth / 2;
    const barY = 58;

    // 바 외곽 테두리 (흰색, 배경과 확실히 구분)
    this.barBorder = scene.add.graphics().setDepth(depth);
    this.barBorder.lineStyle(2, 0xFFFFFF, 0.8);
    this.barBorder.strokeRoundedRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, 5);

    // 바 배경 (어두운 반투명)
    this.barBg = scene.add.graphics().setDepth(depth);
    this.barBg.fillStyle(0x000000, 0.4);
    this.barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // 바 채움 (밝은 초록)
    this.barFill = scene.add.graphics().setDepth(depth);
    this.barX = barX;
    this.barY = barY;
    this.barWidth = barWidth;
    this.barHeight = barHeight;

    // 프로그레스 바 위에 점수 텍스트 (바 중앙에 겹쳐서 표시)
    this.scoreText = scene.add.text(width / 2, barY + barHeight / 2, `0 / ${targetScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(depth + 1);

    // === 2행 우측: 별 카운터 (큰 아이콘 + 숫자, y=60) ===
    this.starCountText = scene.add.text(width - 15, 60, '⭐ 0', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(depth);

    // 초기 상태 (0%)
    this._drawProgressBar(0);
  }

  /**
   * 점수 업데이트 -> 텍스트 + 프로그레스 바 갱신
   * @param {number} current - 현재 점수
   */
  updateScore(current) {
    this.scoreText.setText(`${current} / ${this.targetScore}`);

    const progress = Math.min(current / this.targetScore, 1);
    this._drawProgressBar(progress);

    // 점수 텍스트 바운스 효과 (아이가 좋아하는 통통 튀는 느낌)
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

    // 진행도에 따라 색상 변화 (초록 -> 금색 when 완료)
    const color = progress >= 1 ? 0xFFD700 : 0x66CC77;
    this.barFill.fillStyle(color);
    this.barFill.fillRoundedRect(
      this.barX, this.barY,
      this.barWidth * progress, this.barHeight,
      4
    );
  }

  /**
   * 별 수집 수 업데이트
   * @param {number} starCount - 현재 별 수집 수
   */
  updateStarCount(starCount) {
    this.starCountText.setText(`⭐ ${starCount}`);
  }

  /**
   * 목표 달성 시 호출 -> 축하 효과
   */
  showClear() {
    this.scoreText.setColor('#FFD700');
    this.scoreText.setStroke('#FF6B00', 4);
    this.scoreText.setText('클리어!');
    this.scoreText.setFontSize(22);

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
