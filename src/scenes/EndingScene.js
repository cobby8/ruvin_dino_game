/**
 * EndingScene.js - 엔딩 화면 (모든 스테이지 클리어!)
 * 화려한 축하 연출 + 4마리 공룡 모두 등장
 *
 * 화면 구성:
 * - 그라디언트 배경 + 반짝이 이펙트
 * - "축하해요! 루빈이의 대모험 완료!" 금색 텍스트
 * - 4마리 공룡 나란히 달리기 애니메이션
 * - "대단해! 모든 스테이지를 클리어했어!" 서브 텍스트
 *
 * 버튼:
 * - "처음부터 다시" → 진행도 초기화 + SelectScene
 * - "자유 모드" → 무한 러너 (스테이지 없이)
 */

import Phaser from 'phaser';
import { DINOS } from '../config.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('EndingScene');
  }

  create() {
    const { width, height } = this.scale;

    // === 화려한 배경 (그라디언트: 금색 → 보라) ===
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFD700, 0xFFD700, 0xD4A5FF, 0xD4A5FF, 1);
    bg.fillRect(0, 0, width, height);

    // === 엔딩 축하 멜로디 ===
    soundGenerator.playEnding();

    // === 반짝이 파티클 (여러 개 랜덤 위치에서 트윈) ===
    this._createSparkles(width, height);

    // === "축하해요!" 큰 텍스트 ===
    const congratsText = this.add.text(width / 2, height * 0.12, '축하해요!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '44px',
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 5,
    }).setOrigin(0.5).setScale(0);

    // 바운스 등장
    this.tweens.add({
      targets: congratsText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // === "루빈이의 대모험 완료!" 서브 타이틀 ===
    const subTitle = this.add.text(width / 2, height * 0.22,
      '루빈이의 대모험 완료!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#8B6914',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: subTitle,
      alpha: 1,
      duration: 800,
      delay: 500,
    });

    // === 4마리 공룡 나란히 달리기 ===
    const dinoY = height * 0.42;
    const dinoSpacing = width / 5; // 균등 배치
    DINOS.forEach((dino, i) => {
      const dx = dinoSpacing * (i + 1);
      const sprite = this.add.sprite(dx, dinoY, dino.key, 0);
      sprite.setScale(1.2);
      // 달리기 애니메이션 재생
      sprite.play(`${dino.key}_run`);

      // 약간씩 다른 타이밍으로 통통 뛰기
      this.tweens.add({
        targets: sprite,
        y: dinoY - 15,
        duration: 400 + i * 50,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100,
      });
    });

    // === "대단해! 모든 스테이지를 클리어했어!" ===
    const praiseText = this.add.text(width / 2, height * 0.58,
      '대단해!\n모든 스테이지를 클리어했어!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '20px',
      color: '#5A3A8A',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: praiseText,
      alpha: 1,
      duration: 800,
      delay: 1000,
    });

    // === 버튼들 (1.5초 후에 등장) ===
    this.time.delayedCall(1500, () => {
      // "처음부터 다시" 버튼
      this._createButton(
        width / 2, height * 0.74,
        '처음부터 다시 🔄', 200, 48,
        0xFF8C42,
        () => {
          soundGenerator.playSelect();
          // 진행도 초기화
          localStorage.removeItem('ruvin_dino_progress');
          this.registry.set('currentStage', 1);
          this.scene.start('SelectScene');
        }
      );

      // "자유 모드" 버튼 (무한 러너)
      this._createButton(
        width / 2, height * 0.84,
        '자유 모드 🦕', 200, 48,
        0x66CC77,
        () => {
          soundGenerator.playSelect();
          // 자유 모드: 스테이지 0 = 무한 러너
          this.registry.set('currentStage', 0);
          this.scene.start('GameScene');
        }
      );
    });
  }

  /**
   * 반짝이 파티클 생성
   * 텍스트 기반 이모지로 별/반짝이를 랜덤 위치에 뿌림
   */
  _createSparkles(width, height) {
    const sparkleChars = ['✨', '⭐', '🌟', '💫'];
    // 12개 반짝이를 랜덤 위치에 배치
    for (let i = 0; i < 12; i++) {
      const char = sparkleChars[i % sparkleChars.length];
      const x = Phaser.Math.Between(20, width - 20);
      const y = Phaser.Math.Between(20, height - 20);
      const sparkle = this.add.text(x, y, char, {
        fontSize: `${Phaser.Math.Between(14, 28)}px`,
      }).setOrigin(0.5).setAlpha(0);

      // 페이드인 + 회전 + 반복
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 0.8 },
        scaleX: { from: 0.3, to: 1.2 },
        scaleY: { from: 0.3, to: 1.2 },
        angle: { from: 0, to: 360 },
        duration: Phaser.Math.Between(1500, 3000),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
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
      fontSize: '18px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 1,
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
