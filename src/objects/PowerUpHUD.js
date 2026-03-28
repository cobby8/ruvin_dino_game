/**
 * PowerUpHUD.js - 파워업 상태 표시 UI
 * 화면 오른쪽 상단에 현재 활성 파워업 아이콘 + 남은 시간 바를 표시.
 *
 * 파워업 종류:
 * - 무적 (invincible): 금색 테두리 + 카운트다운 바
 * - 자석 (magnet): 보라 테두리 + 카운트다운 바
 * - 방어막 (shield): 파란 테두리 + "1" 표시 (횟수)
 *
 * depth: 10 (UI 레벨, 게임 오브젝트보다 항상 위)
 */

import { GAME } from '../config.js';

// 파워업별 색상 정의
const POWERUP_COLORS = {
  invincible: { border: 0xFFD700, fill: 0xFFF4CC, label: '무적' },
  magnet:     { border: 0x9B59B6, fill: 0xE8D5F5, label: '자석' },
  shield:     { border: 0x4EAEFF, fill: 0xD0E8FF, label: '방어막' },
};

export class PowerUpHUD {
  /**
   * @param {Phaser.Scene} scene - GameScene
   */
  constructor(scene) {
    this.scene = scene;
    this.currentType = null;    // 현재 표시 중인 파워업 종류
    this.startTime = 0;         // 파워업 시작 시각
    this.duration = 0;          // 파워업 지속 시간 (ms)

    const { width } = scene.scale;

    // === UI 컨테이너 (오른쪽 상단) ===
    this.x = width - 90;
    this.y = 30;

    // 배경 (둥근 사각형)
    this.bg = scene.add.graphics();
    this.bg.setDepth(10);
    this.bg.setVisible(false);

    // 아이콘 (파워업 텍스처 표시)
    this.icon = scene.add.sprite(this.x - 20, this.y, 'item_star');
    this.icon.setDepth(10);
    this.icon.setScale(0.8);
    this.icon.setVisible(false);

    // 라벨 텍스트
    this.label = scene.add.text(this.x + 10, this.y - 8, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '12px',
      color: '#FFFFFF',
    }).setDepth(10).setVisible(false);

    // 시간 바 배경 (회색)
    this.barBg = scene.add.graphics();
    this.barBg.setDepth(10);
    this.barBg.setVisible(false);

    // 시간 바 채움 (색상)
    this.barFill = scene.add.graphics();
    this.barFill.setDepth(10);
    this.barFill.setVisible(false);

    // 업데이트 이벤트 등록
    this._updateEvent = scene.time.addEvent({
      delay: 50, // 50ms마다 바 갱신
      callback: this._update,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * 파워업 HUD 표시 시작
   * @param {string} type - 'invincible', 'magnet', 'shield'
   */
  show(type) {
    this.currentType = type;
    this.startTime = this.scene.time.now;
    this.duration = (type === 'shield') ? 0 : GAME.ITEMS.POWERUP_DURATION;

    const colors = POWERUP_COLORS[type];
    if (!colors) return;

    // 아이콘 변경
    this.icon.setTexture(`item_${type}`);
    this.icon.setVisible(true);

    // 라벨 변경
    this.label.setText(colors.label);
    this.label.setVisible(true);

    // 배경 그리기
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.5);
    this.bg.fillRoundedRect(this.x - 40, this.y - 16, 80, 32, 8);
    this.bg.lineStyle(2, colors.border);
    this.bg.strokeRoundedRect(this.x - 40, this.y - 16, 80, 32, 8);
    this.bg.setVisible(true);

    // 시간 바 (shield는 바 없이 고정 표시)
    if (type !== 'shield') {
      // 바 배경
      this.barBg.clear();
      this.barBg.fillStyle(0x333333, 0.7);
      this.barBg.fillRoundedRect(this.x - 35, this.y + 8, 70, 5, 2);
      this.barBg.setVisible(true);
      this.barFill.setVisible(true);
    } else {
      this.barBg.setVisible(false);
      this.barFill.setVisible(false);
    }
  }

  /**
   * HUD 숨기기 (파워업 종료 시)
   */
  hide() {
    this.currentType = null;
    this.bg.setVisible(false);
    this.icon.setVisible(false);
    this.label.setVisible(false);
    this.barBg.setVisible(false);
    this.barFill.setVisible(false);
  }

  /**
   * 시간 바 갱신 (50ms마다 호출)
   */
  _update() {
    if (!this.currentType || this.currentType === 'shield') return;

    const elapsed = this.scene.time.now - this.startTime;
    const remaining = Math.max(0, 1 - elapsed / this.duration);

    if (remaining <= 0) {
      this.hide();
      return;
    }

    const colors = POWERUP_COLORS[this.currentType];
    const barWidth = 70 * remaining;

    // 바 채움 갱신
    this.barFill.clear();
    this.barFill.fillStyle(colors.border);
    this.barFill.fillRoundedRect(this.x - 35, this.y + 8, barWidth, 5, 2);

    // 시간이 2초 남으면 아이콘 깜빡 (곧 끝난다는 경고)
    if (remaining < 2000 / this.duration) {
      this.icon.setAlpha(Math.sin(this.scene.time.now * 0.01) > 0 ? 1 : 0.3);
    } else {
      this.icon.setAlpha(1);
    }
  }

  /**
   * HUD 정리 (씬 종료 시)
   */
  destroy() {
    if (this._updateEvent) this._updateEvent.destroy();
    this.bg.destroy();
    this.icon.destroy();
    this.label.destroy();
    this.barBg.destroy();
    this.barFill.destroy();
  }
}
