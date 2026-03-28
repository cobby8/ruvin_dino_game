/**
 * BootScene.js - 1층: 로비 (에셋 로딩)
 * 게임에 필요한 모든 텍스처(공룡, 장애물, 배경)를 코드로 생성하는 씬
 * 실제 이미지 파일 없이 Phaser Graphics로 직접 그림
 *
 * 페이즈 2: 6개 월드 x 4레이어 배경 + 18종 장애물 전부 생성
 * 텍스처가 많아져서 로딩 진행 바를 표시함
 */

import Phaser from 'phaser';
import { createDinoTextures } from '../objects/DinoGraphics.js';
import { createAllObstacleTextures } from '../objects/Obstacle.js';
import { createAllBackgroundTextures } from '../objects/Background.js';
import { createAllEnemyTextures } from '../objects/Enemy.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const { width, height } = this.scale;

    // 로딩 텍스트
    const loadingText = this.add.text(width / 2, height / 2 - 50, '루빈이의 공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // "준비 중..." 하위 텍스트
    const subText = this.add.text(width / 2, height / 2, '열심히 준비 중...', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);

    // === 진행 바 (텍스처 생성이 오래 걸릴 수 있으므로) ===
    const barWidth = 200;
    const barHeight = 16;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2 + 35;

    // 바 배경 (회색)
    const barBg = this.add.graphics();
    barBg.fillStyle(0xDDDDDD);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 8);

    // 바 채움 (초록)
    const barFill = this.add.graphics();

    // Jua 폰트 로딩 완료를 기다린 후 텍스처 생성 시작
    document.fonts.ready.then(() => {
      loadingText.setStyle({ fontFamily: 'Jua, sans-serif' });
      subText.setStyle({ fontFamily: 'Jua, sans-serif' });

      this.time.delayedCall(200, () => {
        // 단계별 텍스처 생성 (진행 바 업데이트를 위해 분리)
        const steps = [
          { label: '공룡 그리는 중...', fn: () => createDinoTextures(this) },
          { label: '장애물 그리는 중...', fn: () => createAllObstacleTextures(this) },
          { label: '적 캐릭터 그리는 중...', fn: () => createAllEnemyTextures(this) },
          { label: '배경 그리는 중...', fn: () => createAllBackgroundTextures(this) },
        ];

        let stepIndex = 0;

        // 각 단계를 순차적으로 실행 (사이에 프레임을 줘서 화면이 갱신되도록)
        const runNextStep = () => {
          if (stepIndex < steps.length) {
            const step = steps[stepIndex];
            subText.setText(step.label);

            // 진행 바 업데이트
            const progress = (stepIndex + 1) / steps.length;
            barFill.clear();
            barFill.fillStyle(0x66CC77);
            barFill.fillRoundedRect(barX, barY, barWidth * progress, barHeight, 8);

            // 실제 텍스처 생성
            step.fn();
            stepIndex++;

            // 다음 단계 (프레임 한 번 쉬어가기)
            this.time.delayedCall(50, runNextStep);
          } else {
            // 모든 텍스처 생성 완료
            subText.setText('준비 완료!');
            barFill.clear();
            barFill.fillStyle(0x66CC77);
            barFill.fillRoundedRect(barX, barY, barWidth, barHeight, 8);

            // 0.5초 후 공룡 선택 화면으로 전환
            this.time.delayedCall(500, () => {
              this.scene.start('SelectScene');
            });
          }
        };

        runNextStep();
      });
    });
  }
}
