/**
 * GameOverScene.js - 4층: 휴게실 (게임오버 / 스테이지 클리어 화면)
 * 점수 표시, 최고기록 갱신, "다시하기" / "공룡 바꾸기" 버튼
 *
 * 페이즈 2: 스테이지 클리어 시에도 이 씬을 사용 (임시)
 * - 클리어: "스테이지 클리어!" 표시 + "다음 스테이지" 버튼
 * - 실패: 기존과 동일 ("앗!" + "다시하기")
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
    this.finalScore = data.score || 0;
    this.stageClear = data.stageClear || false;
    this.stageData = data.stageData || null;
    this.worldData = data.worldData || null;
    this.isLastStage = data.isLastStage || false;
    this.nextStageId = data.nextStageId || null;
  }

  create() {
    const { width, height } = this.scale;

    // 반투명 오버레이
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    if (this.stageClear) {
      this._createClearScreen(width, height);
    } else {
      this._createGameOverScreen(width, height);
    }
  }

  /**
   * 스테이지 클리어 화면
   */
  _createClearScreen(width, height) {
    // "스테이지 클리어!" 타이틀
    const titleText = this.add.text(width / 2, height * 0.12, '스테이지 클리어!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 반짝이는 효과
    this.tweens.add({
      targets: titleText,
      scaleX: { from: 0.8, to: 1.1 },
      scaleY: { from: 0.8, to: 1.1 },
      duration: 400,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });

    // 월드 + 스테이지 이름
    if (this.stageData && this.worldData) {
      const stageInWorld = ((this.stageData.id - 1) % 5) + 1;
      this.add.text(width / 2, height * 0.22,
        `${this.worldData.emoji} ${this.worldData.name} ${this.worldData.id}-${stageInWorld}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '20px',
        color: '#FFFFFF',
      }).setOrigin(0.5);

      this.add.text(width / 2, height * 0.28, `"${this.stageData.name}"`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#FFE066',
      }).setOrigin(0.5);
    }

    // 공룡 (기뻐하는 모습 = 달리기 프레임)
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    const happyDino = this.add.sprite(width / 2, height * 0.40, dinoKey, 0);
    happyDino.setScale(1.5);
    // 통통 튀는 효과
    this.tweens.add({
      targets: happyDino,
      y: height * 0.40 - 20,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 점수
    this.add.text(width / 2, height * 0.52, `넘은 장애물: ${this.finalScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // === 버튼들 ===
    if (!this.isLastStage && this.nextStageId) {
      // "다음 스테이지" 버튼 (초록)
      this._createButton(
        width / 2, height * 0.66,
        '다음 스테이지 →',
        0x66CC77,
        () => {
          soundGenerator.playSelect();
          // 다음 스테이지로 바로 이동
          this.registry.set('currentStage', this.nextStageId);
          this.scene.start('GameScene');
        }
      );
    } else {
      // 마지막 스테이지 클리어 = 모든 스테이지 완료!
      this.add.text(width / 2, height * 0.62, '모든 모험을 완료했어!', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '22px',
        color: '#FFD700',
        stroke: '#333333',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // "다시하기" 버튼 (노란)
    this._createButton(
      width / 2, height * 0.76,
      '다시하기',
      0xFFCC00,
      () => {
        soundGenerator.playSelect();
        this.scene.start('GameScene');
      }
    );

    // "공룡 바꾸기" 버튼 (보라)
    this._createButton(
      width / 2, height * 0.86,
      '공룡 바꾸기',
      0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.scene.start('SelectScene');
      }
    );
  }

  /**
   * 게임오버(실패) 화면 (기존과 동일)
   */
  _createGameOverScreen(width, height) {
    // 최고기록 확인 및 갱신
    const highScore = parseInt(localStorage.getItem('ruvin_dino_highscore') || '0', 10);
    const isNewRecord = this.finalScore > highScore;
    if (isNewRecord) {
      localStorage.setItem('ruvin_dino_highscore', String(this.finalScore));
    }
    const currentHighScore = isNewRecord ? this.finalScore : highScore;

    // "앗!" 텍스트
    this.add.text(width / 2, height * 0.12, '앗!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '48px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.21, '다시 해볼까?', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 스테이지 정보 (있으면)
    if (this.stageData && this.worldData) {
      const stageInWorld = ((this.stageData.id - 1) % 5) + 1;
      this.add.text(width / 2, height * 0.28,
        `${this.worldData.emoji} ${this.worldData.id}-${stageInWorld} "${this.stageData.name}"`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
        color: '#AAAAAA',
      }).setOrigin(0.5);
    }

    // 넘어진 공룡
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    const fallenDino = this.add.sprite(width / 2, height * 0.38, dinoKey, 3);
    fallenDino.setScale(1.5);
    this.tweens.add({
      targets: fallenDino,
      angle: { from: -5, to: 5 },
      duration: 300,
      yoyo: true,
      repeat: 2,
    });

    // 점수 표시
    this.add.text(width / 2, height * 0.52, `점수: ${this.finalScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '36px',
      color: '#FFD700',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.59, `최고기록: ${currentHighScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '20px',
      color: '#CCCCCC',
    }).setOrigin(0.5);

    // 신기록 효과
    if (isNewRecord && this.finalScore > 0) {
      const newRecordText = this.add.text(width / 2, height * 0.45, '신기록!', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '30px',
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

    // "다시하기" 버튼
    this._createButton(
      width / 2, height * 0.72,
      '다시하기',
      0xFFCC00,
      () => {
        soundGenerator.playSelect();
        this.scene.start('GameScene');
      }
    );

    // "공룡 바꾸기" 버튼
    this._createButton(
      width / 2, height * 0.82,
      '공룡 바꾸기',
      0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.scene.start('SelectScene');
      }
    );
  }

  /**
   * 버튼 생성 헬퍼
   */
  _createButton(x, y, label, color, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - 90, y - 22, 180, 44, 22);

    this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(x, y, 180, 44, 0x000000, 0);
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
