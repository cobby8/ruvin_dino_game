/**
 * PowerUpHUD.js - 파워업 상태 표시 UI
 * 공룡 머리 위에 현재 활성 파워업 아이콘 + 남은 시간 바를 표시.
 * 공룡을 따라다니므로 항상 눈에 들어옴.
 *
 * 파워업 종류:
 * - 무적 (invincible): 금색 테두리 + 카운트다운 바
 * - 자석 (magnet): 보라 테두리 + 카운트다운 바
 * - 방어막 (shield): 파란 테두리 + "1" 표시 (횟수)
 *
 * depth: 100 (UI 레벨, 게임 오브젝트보다 항상 위)
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
   * @param {Phaser.GameObjects.Sprite} dino - 공룡 스프라이트 (위치 추적용)
   */
  constructor(scene, dino) {
    this.scene = scene;
    this.dino = dino;             // 공룡 참조 (머리 위에 표시하기 위해)
    this.currentType = null;      // 현재 표시 중인 파워업 종류
    this.startTime = 0;           // 파워업 시작 시각
    this.duration = 0;            // 파워업 지속 시간 (ms)

    // === 공룡 머리 위 오프셋 (공룡 y좌표에서 이만큼 위로) ===
    this.offsetY = -60;

    // 배경 (둥근 사각형) - 공룡 위에 떠다님
    this.bg = scene.add.graphics();
    this.bg.setDepth(100);
    this.bg.setVisible(false);

    // 아이콘 (파워업 텍스처 표시)
    this.icon = scene.add.sprite(0, 0, 'item_star');
    this.icon.setDepth(100);
    this.icon.setScale(0.8);
    this.icon.setVisible(false);

    // 라벨 텍스트 (크기 확대: 12px -> 14px)
    this.label = scene.add.text(0, 0, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 2,
    }).setDepth(100).setVisible(false);

    // 시간 바 배경 (회색)
    this.barBg = scene.add.graphics();
    this.barBg.setDepth(100);
    this.barBg.setVisible(false);

    // 시간 바 채움 (색상)
    this.barFill = scene.add.graphics();
    this.barFill.setDepth(100);
    this.barFill.setVisible(false);

    // 업데이트 이벤트 등록 (50ms마다 위치+시간 바 갱신)
    this._updateEvent = scene.time.addEvent({
      delay: 50,
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

    // 배경은 _updatePosition에서 매번 다시 그림 (공룡 위치가 변하므로)
    this.bg.setVisible(true);
    this._cachedBorderColor = colors.border;

    // 시간 바 (shield는 바 없이 고정 표시)
    if (type !== 'shield') {
      this.barBg.setVisible(true);
      this.barFill.setVisible(true);
    } else {
      this.barBg.setVisible(false);
      this.barFill.setVisible(false);
    }

    // 즉시 위치 갱신
    this._updatePosition();
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
   * 공룡 머리 위로 HUD 위치 갱신 (내부용)
   * 공룡의 현재 좌표를 추적하여 UI 요소를 이동시킴
   */
  _updatePosition() {
    if (!this.dino || !this.currentType) return;

    // 공룡 머리 위 좌표 계산
    const cx = this.dino.x;
    const cy = this.dino.y + this.offsetY;

    // 아이콘: 공룡 머리 위 왼쪽
    this.icon.setPosition(cx - 20, cy);

    // 라벨: 아이콘 오른쪽
    this.label.setPosition(cx + 10, cy - 8);

    // 배경 (둥근 사각형) - 매 프레임 다시 그림
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.5);
    this.bg.fillRoundedRect(cx - 40, cy - 16, 80, 32, 8);
    this.bg.lineStyle(2, this._cachedBorderColor || 0xFFFFFF);
    this.bg.strokeRoundedRect(cx - 40, cy - 16, 80, 32, 8);

    // 시간 바 위치 갱신
    if (this.currentType !== 'shield') {
      this.barBg.clear();
      this.barBg.fillStyle(0x333333, 0.7);
      this.barBg.fillRoundedRect(cx - 35, cy + 8, 70, 5, 2);
    }
  }

  /**
   * 시간 바 + 위치 갱신 (50ms마다 호출)
   */
  _update() {
    if (!this.currentType) return;

    // 공룡 위치 추적 (매 갱신마다)
    this._updatePosition();

    // shield는 시간 바 불필요
    if (this.currentType === 'shield') return;

    const elapsed = this.scene.time.now - this.startTime;
    const remaining = Math.max(0, 1 - elapsed / this.duration);

    if (remaining <= 0) {
      this.hide();
      return;
    }

    const colors = POWERUP_COLORS[this.currentType];
    const cx = this.dino ? this.dino.x : 0;
    const cy = this.dino ? (this.dino.y + this.offsetY) : 0;
    const barWidth = 70 * remaining;

    // 바 채움 갱신
    this.barFill.clear();
    this.barFill.fillStyle(colors.border);
    this.barFill.fillRoundedRect(cx - 35, cy + 8, barWidth, 5, 2);

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
