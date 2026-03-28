/**
 * GameOverScene.js - 게임오버(실패) 화면
 * 장애물에 부딪혀서 실패했을 때 표시
 *
 * 페이즈 3: 클리어는 StageClearScene이 담당, 여기는 실패만 처리
 * - 현재 스테이지 정보 표시 (월드 이름 + 스테이지 번호)
 * - "재도전" → 같은 스테이지로 GameScene 재시작
 * - "월드맵" → WorldMapScene으로 이동
 * - "공룡 바꾸기" → SelectScene으로 이동
 */

import Phaser from 'phaser';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  /**
   * @param {object} data - GameScene에서 전달받은 데이터
   */
  init(data) {
    // clearScore = 장애물/적 넘긴 횟수, starCount = 별 수집 수
    this.finalScore = data.clearScore || 0;
    this.finalStarCount = data.starCount || 0;
    this.stageData = data.stageData || null;
    this.worldData = data.worldData || null;
    this.isFreeMode = data.isFreeMode || false;
    this.hitCount = data.hitCount || 0; // [P1] 피격 횟수
  }

  create() {
    const { width, height } = this.scale;

    // 화면 전환 효과: 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // === 배경 붉은색에서 서서히 어두운색으로 전환 ===
    const redOverlay = this.add.graphics();
    redOverlay.fillStyle(0x660000, 0.7);
    redOverlay.fillRect(0, 0, width, height);
    redOverlay.setDepth(0);

    // 붉은 배경 → 어두운 배경으로 서서히 전환 (1.5초)
    this.tweens.add({
      targets: redOverlay,
      alpha: 0,
      duration: 1500,
      ease: 'Sine.easeOut',
    });

    // 최종 어두운 오버레이 (위 붉은색이 사라지면 이게 보임)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(-1); // 붉은색 뒤에

    // === 최고기록 확인 및 갱신 ===
    const highScore = parseInt(localStorage.getItem('ruvin_dino_highscore') || '0', 10);
    const isNewRecord = this.finalScore > highScore;
    if (isNewRecord) {
      localStorage.setItem('ruvin_dino_highscore', String(this.finalScore));
    }
    const currentHighScore = isNewRecord ? this.finalScore : highScore;

    // === "앗!" 텍스트 (흔들리며 등장!) ===
    const oopsText = this.add.text(width / 2, height * 0.10, '앗!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '48px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0).setDepth(10);

    // 확대되면서 흔들리는 등장 효과
    this.tweens.add({
      targets: oopsText,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 좌우로 살짝 흔들림 (놀란 느낌)
        this.tweens.add({
          targets: oopsText,
          angle: { from: -8, to: 8 },
          duration: 100,
          yoyo: true,
          repeat: 3,
          onComplete: () => { oopsText.setAngle(0); },
        });
      },
    });

    this.add.text(width / 2, height * 0.19, '다시 해볼까?', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // === 스테이지 정보 표시 (자유 모드가 아닐 때) ===
    if (this.stageData && this.worldData && !this.isFreeMode) {
      const stageInWorld = ((this.stageData.id - 1) % 5) + 1;
      this.add.text(width / 2, height * 0.27,
        `${this.worldData.emoji} ${this.worldData.name} ${this.worldData.id}-${stageInWorld}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#AAAAAA',
      }).setOrigin(0.5);

      this.add.text(width / 2, height * 0.31, `"${this.stageData.name}"`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
        color: '#999999',
      }).setOrigin(0.5);
    }

    // === 넘어진 공룡 (프레임 3 = 넘어진 모습, 바운스하며 등장!) ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    const fallenDino = this.add.sprite(width / 2, -50, dinoKey, 3);
    fallenDino.setScale(1.5).setDepth(10);

    // 위에서 떨어지면서 바닥에 "꿀렁" 바운스!
    this.tweens.add({
      targets: fallenDino,
      y: height * 0.40,
      duration: 600,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // 착지 후 좌우 흔들림
        this.tweens.add({
          targets: fallenDino,
          angle: { from: -8, to: 8 },
          duration: 250,
          yoyo: true,
          repeat: 2,
          onComplete: () => { fallenDino.setAngle(0); },
        });
      },
    });

    // === 점수 표시 ===
    this.add.text(width / 2, height * 0.52, `넘은 장애물: ${this.finalScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '32px',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.59, `최고기록: ${currentHighScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#CCCCCC',
    }).setOrigin(0.5);

    // 별 수집 수 표시
    if (this.finalStarCount > 0) {
      this.add.text(width / 2, height * 0.63, `모은 별: ${this.finalStarCount}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#FFD700',
      }).setOrigin(0.5);
    }

    // [P1] 피격 횟수 표시 (맞은 횟수가 있을 때만)
    if (this.hitCount > 0) {
      this.add.text(width / 2, height * 0.67, `${this.hitCount}번 맞았어!`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
        color: '#FF9999',
      }).setOrigin(0.5);
    }

    // === 신기록 효과 ===
    if (isNewRecord && this.finalScore > 0) {
      const newRecordText = this.add.text(width / 2, height * 0.46, '신기록!', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '28px',
        color: '#FF0',
        stroke: '#FF6B00',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: newRecordText,
        alpha: { from: 1, to: 0.3 },
        scaleX: { from: 1, to: 1.3 },
        scaleY: { from: 1, to: 1.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // === 버튼들 ===
    // "재도전" 버튼 (같은 스테이지 다시)
    this._createButton(
      width / 2, height * 0.70,
      '재도전', 180, 44,
      0xFFCC00,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
      }
    );

    // "월드맵" 버튼 (자유 모드가 아닐 때만)
    if (!this.isFreeMode) {
      this._createButton(
        width / 2, height * 0.80,
        '월드맵', 180, 44,
        0x999999,
        () => {
          soundGenerator.playSelect();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('WorldMapScene');
          });
        }
      );
    }

    // "공룡 바꾸기" 버튼
    this._createButton(
      width / 2, this.isFreeMode ? height * 0.80 : height * 0.90,
      '공룡 바꾸기', 180, 44,
      0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('SelectScene');
        });
      }
    );
  }

  /**
   * 버튼 생성 헬퍼
   */
  _createButton(x, y, label, btnW, btnH, color, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);

    this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });
  }
}
