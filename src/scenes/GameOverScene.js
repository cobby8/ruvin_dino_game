/**
 * GameOverScene.js - 4층: 휴게실 (게임오버 화면)
 * 점수 표시, 최고기록 갱신, "다시하기" / "공룡 바꾸기" 버튼
 */

import Phaser from 'phaser';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  /**
   * @param {object} data - GameScene에서 전달받은 데이터
   * @param {number} data.score - 이번 게임 점수
   */
  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const { width, height } = this.scale;

    // === 반투명 검정 오버레이 (뒤 배경을 어둡게) ===
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);

    // === 최고기록 확인 및 갱신 ===
    const highScore = parseInt(localStorage.getItem('ruvin_dino_highscore') || '0', 10);
    const isNewRecord = this.finalScore > highScore;

    if (isNewRecord) {
      // 신기록 저장
      localStorage.setItem('ruvin_dino_highscore', String(this.finalScore));
    }

    const currentHighScore = isNewRecord ? this.finalScore : highScore;

    // === "앗! 다시 해볼까?" 텍스트 ===
    this.add.text(width / 2, height * 0.15, '앗!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '48px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.24, '다시 해볼까?', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // === 넘어진 공룡 표시 ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    const fallenDino = this.add.sprite(width / 2, height * 0.38, dinoKey, 3); // 프레임 3 = 넘어짐
    // 96px 스프라이트이므로 확대 배율을 줄임 (2.5 → 1.5)
    fallenDino.setScale(1.5);

    // 공룡이 살짝 흔들리는 효과 (넘어진 느낌)
    this.tweens.add({
      targets: fallenDino,
      angle: { from: -5, to: 5 },
      duration: 300,
      yoyo: true,
      repeat: 2,
    });

    // === 점수 표시 ===
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

    // === 신기록 효과 ===
    if (isNewRecord && this.finalScore > 0) {
      const newRecordText = this.add.text(width / 2, height * 0.45, '신기록!', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '30px',
        color: '#FF0',
        stroke: '#FF6B00',
        strokeThickness: 3,
      }).setOrigin(0.5);

      // 반짝이는 효과
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

    // === "다시하기" 버튼 (노란색) ===
    this._createButton(
      width / 2, height * 0.72,
      '다시하기',
      0xFFCC00,
      () => {
        soundGenerator.playSelect();
        this.scene.start('GameScene');
      }
    );

    // === "공룡 바꾸기" 버튼 (연보라) ===
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
   * @param {number} x - 중심 x
   * @param {number} y - 중심 y
   * @param {string} label - 버튼 텍스트
   * @param {number} color - 배경색
   * @param {function} callback - 터치 시 실행할 함수
   */
  _createButton(x, y, label, color, callback) {
    // 버튼 배경 (둥근 사각형)
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - 90, y - 22, 180, 44, 22);

    // 버튼 텍스트
    this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '20px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 터치 영역
    const hitArea = this.add.rectangle(x, y, 180, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    // 터치 시 살짝 눌리는 효과 + 콜백 실행
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
