/**
 * StageClearScene.js - 스테이지 클리어 축하 화면
 * 별 1~3개 연출 + 공룡 기뻐하는 모습 + 다음 스테이지/월드맵 버튼
 *
 * 별 기준:
 * - 1개: 목표 달성 (기본)
 * - 2개: 추가 장애물도 넘김 (점수 > 목표 x 1.2)
 * - 3개: 한 번도 안 죽고 클리어 (deathCount === 0)
 *
 * 월드 마지막 스테이지(5,10,15,20,25,30) 클리어 시 새 나라 해금 메시지
 * 스테이지 30 클리어 시 EndingScene으로 이동
 */

import Phaser from 'phaser';
import { soundGenerator } from '../utils/SoundGenerator.js';
import { getWorld } from '../data/worlds.js';

export class StageClearScene extends Phaser.Scene {
  constructor() {
    super('StageClearScene');
  }

  /**
   * @param {object} data - GameScene에서 전달받는 데이터
   * data.score, data.stageData, data.worldData,
   * data.targetScore, data.deathCount, data.nextStageId, data.isLastStage
   */
  init(data) {
    // clearScore = 장애물/적 넘긴 횟수 (클리어 기준), starCount = 별 수집 수
    this.finalScore = data.clearScore || 0;
    this.finalStarCount = data.starCount || 0;
    this.stageData = data.stageData || null;
    this.worldData = data.worldData || null;
    this.targetScore = data.targetScore || 0;
    this.deathCount = data.deathCount || 0;
    this.nextStageId = data.nextStageId || null;
    this.isLastStage = data.isLastStage || false;
  }

  create() {
    const { width, height } = this.scale;

    // === 별 개수 계산 ===
    this.starCount = this._calculateStars();

    // === 진행도 저장 (localStorage) ===
    this._saveProgress();

    // === 반투명 밝은 오버레이 (연금색, 기쁜 느낌) ===
    const overlay = this.add.graphics();
    overlay.fillStyle(0xFFF8DC, 0.85); // 연금색 (cornsilk)
    overlay.fillRect(0, 0, width, height);

    // === 팡파레 효과음 ===
    soundGenerator.playStageClear();

    // === "클리어!" 큰 텍스트 (트윈으로 등장) ===
    const clearText = this.add.text(width / 2, height * 0.10, '클리어!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#FF8C00',
      strokeThickness: 5,
    }).setOrigin(0.5).setScale(0).setDepth(10);

    // 스케일 0에서 1로 바운스하며 등장
    this.tweens.add({
      targets: clearText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // === 월드 + 스테이지 정보 ===
    if (this.stageData && this.worldData) {
      const stageInWorld = ((this.stageData.id - 1) % 5) + 1;
      this.add.text(width / 2, height * 0.20,
        `${this.worldData.emoji} ${this.worldData.name} ${this.worldData.id}-${stageInWorld}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '20px',
        color: '#8B6914',
      }).setOrigin(0.5);

      this.add.text(width / 2, height * 0.26, `"${this.stageData.name}"`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#A0860A',
      }).setOrigin(0.5);
    }

    // === 별 연출 (하나씩 순서대로 등장) ===
    this._showStars(width, height);

    // === 공룡 기뻐하는 스프라이트 (jump 프레임, 위아래 트윈) ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    // 프레임 1 = 점프 프레임 (기뻐하는 모습)
    const happyDino = this.add.sprite(width / 2, height * 0.52, dinoKey, 1);
    happyDino.setScale(1.5);
    // 위아래로 통통 뛰는 애니메이션
    this.tweens.add({
      targets: happyDino,
      y: height * 0.52 - 25,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // === 넘은 장애물 수 + 별 수집 수 표시 ===
    this.add.text(width / 2, height * 0.61, `넘은 장애물: ${this.finalScore}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#5A4A00',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // 별 수집 수 (장애물 아래에 작게 표시)
    if (this.finalStarCount > 0) {
      this.add.text(width / 2, height * 0.66, `모은 별: ${this.finalStarCount}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#B8960A',
      }).setOrigin(0.5);
    }

    // === 월드 마지막 스테이지 클리어 시 새 나라 해금 메시지 ===
    // 스테이지 5, 10, 15, 20, 25, 30이 월드의 마지막
    const isWorldLast = this.stageData && (this.stageData.id % 5 === 0);
    if (isWorldLast && !this.isLastStage) {
      // 다음 월드 정보 가져오기
      const nextWorld = getWorld(this.worldData.id + 1);
      const unlockText = this.add.text(width / 2, height * 0.70,
        `${nextWorld.emoji} 새로운 나라가 열렸어!`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '20px',
        color: '#FF6B00',
        stroke: '#FFFFFF',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0);

      // 페이드인 + 바운스
      this.tweens.add({
        targets: unlockText,
        alpha: 1,
        scaleX: { from: 0.5, to: 1.1 },
        scaleY: { from: 0.5, to: 1.1 },
        duration: 600,
        delay: 1500, // 별 연출 후에 등장
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: unlockText,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
          });
        },
      });
    }

    // === 버튼 영역 ===
    const btnStartY = isWorldLast && !this.isLastStage ? height * 0.78 : height * 0.74;

    if (this.isLastStage) {
      // 스테이지 30 클리어 → EndingScene으로 이동 버튼
      this._createButton(
        width / 2, btnStartY,
        '엔딩 보기 ✨', 200, 50,
        0xFFD700,
        () => {
          soundGenerator.playSelect();
          this.scene.start('EndingScene');
        }
      );
    } else {
      // "다음 스테이지" 버튼 (크게, 초록)
      this._createButton(
        width / 2, btnStartY,
        '다음 스테이지 ▶', 220, 50,
        0x66CC77,
        () => {
          soundGenerator.playSelect();
          this.registry.set('currentStage', this.nextStageId);
          this.scene.start('GameScene');
        }
      );
    }

    // "월드맵" 버튼 (작게, 회색)
    this._createButton(
      width / 2, btnStartY + 60,
      '월드맵', 140, 40,
      0x999999,
      () => {
        soundGenerator.playSelect();
        this.scene.start('WorldMapScene');
      }
    );
  }

  /**
   * 별 개수 계산
   * 1개: 기본 클리어
   * 2개: 추가 장애물도 넘김 (점수가 목표의 120% 이상)
   * 3개: 한 번도 안 죽고 클리어 (deathCount === 0)
   */
  _calculateStars() {
    let stars = 1; // 클리어했으니 최소 1개
    // 2개: 목표보다 20% 이상 넘김
    if (this.finalScore >= Math.ceil(this.targetScore * 1.2)) {
      stars = 2;
    }
    // 3개: 한 번도 안 죽음 (이번 플레이에서)
    if (this.deathCount === 0) {
      stars = 3;
    }
    return stars;
  }

  /**
   * 별 연출: 하나씩 순서대로 scale 0→1 + bounce
   */
  _showStars(width, height) {
    const starY = height * 0.38;
    const starSpacing = 50; // 별 사이 간격
    const totalWidth = (3 - 1) * starSpacing;
    const startX = width / 2 - totalWidth / 2;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * starSpacing;
      // 별 아이콘 (획득 여부에 따라 색상 다름)
      const isEarned = i < this.starCount;
      const starText = this.add.text(x, starY, '⭐', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '36px',
      }).setOrigin(0.5).setScale(0).setAlpha(isEarned ? 1 : 0.3);

      // 하나씩 순서대로 등장 (0.4초 간격)
      this.tweens.add({
        targets: starText,
        scaleX: isEarned ? 1.2 : 0.8,
        scaleY: isEarned ? 1.2 : 0.8,
        duration: 400,
        delay: 600 + i * 400, // 클리어 텍스트 후 0.6초부터 시작
        ease: 'Back.easeOut',
        onComplete: () => {
          // 획득한 별은 살짝 줄어드는 바운스 (1.2 → 1.0)
          if (isEarned) {
            this.tweens.add({
              targets: starText,
              scaleX: 1,
              scaleY: 1,
              duration: 200,
              ease: 'Sine.easeInOut',
            });
          }
        },
      });
    }
  }

  /**
   * 진행도를 localStorage에 저장
   * clearedStages: 클리어한 스테이지 ID 배열
   * bestStars: 각 스테이지의 최고 별 수
   */
  _saveProgress() {
    const key = 'ruvin_dino_progress';
    let progress;
    try {
      progress = JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      progress = {};
    }

    // 클리어한 스테이지 목록
    if (!progress.clearedStages) progress.clearedStages = [];
    const stageId = this.stageData ? this.stageData.id : 1;
    if (!progress.clearedStages.includes(stageId)) {
      progress.clearedStages.push(stageId);
    }

    // 최고 별 수 기록
    if (!progress.bestStars) progress.bestStars = {};
    const currentBest = progress.bestStars[stageId] || 0;
    if (this.starCount > currentBest) {
      progress.bestStars[stageId] = this.starCount;
    }

    localStorage.setItem(key, JSON.stringify(progress));
  }

  /**
   * 버튼 생성 헬퍼
   */
  _createButton(x, y, label, btnW, btnH, color, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: btnH > 44 ? '20px' : '16px',
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
