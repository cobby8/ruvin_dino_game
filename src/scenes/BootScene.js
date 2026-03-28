/**
 * BootScene.js - 1층: 로비 (에셋 로딩)
 * 게임에 필요한 모든 텍스처(공룡, 장애물, 배경)를 코드로 생성하는 씬
 * 실제 이미지 파일 없이 Phaser Graphics로 직접 그림
 */

import Phaser from 'phaser';
import { createDinoTextures } from '../objects/DinoGraphics.js';
import { createObstacleTextures } from '../objects/Obstacle.js';
import { createBackgroundTextures } from '../objects/Background.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene'); // 씬 이름 등록
  }

  create() {
    const { width, height } = this.scale;

    // 로딩 텍스트 표시 ("루빈이의 공룡 모험" 타이틀)
    const loadingText = this.add.text(width / 2, height / 2 - 30, '루빈이의 공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // "불러오는 중..." 하위 텍스트
    const subText = this.add.text(width / 2, height / 2 + 20, '불러오는 중...', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: '#666666',
    }).setOrigin(0.5);

    // Jua 폰트 로딩 완료를 기다린 후 텍스처 생성 시작
    // (폰트가 아직 안 불러와졌으면 기본 폰트로 보이는 문제 방지)
    document.fonts.ready.then(() => {
      // 텍스트 다시 그리기 (폰트 로드 완료 후)
      loadingText.setStyle({ fontFamily: 'Jua, sans-serif' });
      subText.setStyle({ fontFamily: 'Jua, sans-serif' });

      // 약간의 딜레이 후 텍스처 생성 (로딩 화면이 보이도록)
      this.time.delayedCall(300, () => {
        this._createAllTextures();

        // 효과음 시스템 초기화는 사용자 입력 시 하기 위해 여기서는 스킵
        // (브라우저 정책: 사용자 터치 없이 AudioContext 생성 불가)

        subText.setText('준비 완료!');

        // 0.5초 후 공룡 선택 화면으로 전환
        this.time.delayedCall(500, () => {
          this.scene.start('SelectScene');
        });
      });
    });
  }

  /** 모든 텍스처를 코드로 생성하는 내부 메서드 */
  _createAllTextures() {
    // 공룡 4마리 스프라이트시트 생성
    createDinoTextures(this);

    // 장애물(선인장, 돌멩이) 텍스처 생성
    createObstacleTextures(this);

    // 배경(구름, 산, 풀밭) 텍스처 생성
    createBackgroundTextures(this);
  }
}
