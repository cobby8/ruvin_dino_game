/**
 * WorldMapScene.js - 월드맵 화면
 * 6개 월드 x 5개 스테이지를 보여주는 맵
 *
 * 진행도 관리:
 * - localStorage 'ruvin_dino_progress' 키로 저장/불러오기
 * - clearedStages: 클리어한 스테이지 ID 배열
 * - bestStars: 각 스테이지의 최고 별 수
 * - 잠금 해제: 이전 스테이지 클리어 → 다음 스테이지 열림
 * - 스테이지 1은 항상 열려있음
 *
 * 화면 구성:
 * - 상단: 타이틀
 * - 중앙: 6개 월드 세로 나열, 각 월드에 5개 스테이지 버튼 (원형)
 * - 하단: "공룡 바꾸기" + "난이도 바꾸기" 버튼
 */

import Phaser from 'phaser';
import { WORLDS } from '../data/worlds.js';
import { STAGES } from '../data/stages.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create() {
    const { width, height } = this.scale;

    // === 진행도 불러오기 ===
    this.progress = this._loadProgress();

    // === 배경 (하늘색 그라디언트) ===
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE8D5F5, 0xE8D5F5, 1);
    bg.fillRect(0, 0, width, height);

    // === 상단 타이틀 ===
    this.add.text(width / 2, height * 0.04, '루빈이의 공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // === 스크롤 가능한 월드맵 컨텐츠 ===
    // 6개 월드를 세로로 나열 (스크롤 영역)
    this._createWorldMap(width, height);

    // === 하단 버튼 영역 (고정) ===
    this._createBottomButtons(width, height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 6개 월드 + 스테이지 버튼 생성
   * 화면에 맞게 2열 x 3행 그리드로 배치
   */
  _createWorldMap(width, height) {
    // 월드맵 영역: 상단(9%) ~ 하단(88%)
    const areaTop = height * 0.09;
    const areaBottom = height * 0.88;
    const areaHeight = areaBottom - areaTop;

    // 6개 월드를 3행 2열로 배치
    const cols = 2;
    const rows = 3;
    const cellW = width / cols;
    const cellH = areaHeight / rows;

    WORLDS.forEach((world, wi) => {
      const col = wi % cols;
      const row = Math.floor(wi / cols);
      const cx = cellW * col + cellW / 2;
      const cy = areaTop + cellH * row + cellH * 0.15;

      // 월드 이름 + 이모지
      this.add.text(cx, cy, `${world.emoji} ${world.name}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
        color: '#333333',
      }).setOrigin(0.5);

      // 5개 스테이지 버튼 (원형, 가로 나열)
      const stageIds = STAGES.filter(s => s.world === world.id).map(s => s.id);
      const btnR = Math.min(cellW * 0.08, 18); // 원형 버튼 반지름
      const btnSpacing = Math.min(cellW * 0.18, 32); // 버튼 간격
      const totalBtnW = (stageIds.length - 1) * btnSpacing;
      const btnStartX = cx - totalBtnW / 2;
      const btnY = cy + cellH * 0.35;

      stageIds.forEach((stageId, si) => {
        const bx = btnStartX + si * btnSpacing;
        const stageInWorld = si + 1;

        // 스테이지 상태 판별
        const isCleared = this.progress.clearedStages.includes(stageId);
        const isUnlocked = this._isStageUnlocked(stageId);
        const bestStar = this.progress.bestStars[stageId] || 0;

        // 원형 배경 그리기
        const circle = this.add.graphics();
        if (isCleared) {
          // 클리어: 금색 원
          circle.fillStyle(0xFFD700, 1);
          circle.fillCircle(bx, btnY, btnR);
          circle.lineStyle(2, 0xFFA500, 1);
          circle.strokeCircle(bx, btnY, btnR);
        } else if (isUnlocked) {
          // 플레이 가능: 밝은 원
          circle.fillStyle(0xFFFFFF, 1);
          circle.fillCircle(bx, btnY, btnR);
          circle.lineStyle(2, 0x66CC77, 1);
          circle.strokeCircle(bx, btnY, btnR);
        } else {
          // 잠금: 회색 원
          circle.fillStyle(0xBBBBBB, 0.6);
          circle.fillCircle(bx, btnY, btnR);
          circle.lineStyle(2, 0x999999, 1);
          circle.strokeCircle(bx, btnY, btnR);
        }

        // 원 안 텍스트
        if (isCleared) {
          // 클리어한 스테이지: 별 아이콘
          const starStr = bestStar > 0 ? '⭐' : `${stageInWorld}`;
          this.add.text(bx, btnY, starStr, {
            fontFamily: 'Jua, sans-serif',
            fontSize: bestStar > 0 ? '14px' : '12px',
            color: '#8B6914',
          }).setOrigin(0.5);
        } else if (isUnlocked) {
          // 플레이 가능: 숫자 표시
          this.add.text(bx, btnY, `${stageInWorld}`, {
            fontFamily: 'Jua, sans-serif',
            fontSize: '13px',
            color: '#333333',
          }).setOrigin(0.5);
        } else {
          // 잠금: 자물쇠
          this.add.text(bx, btnY, '🔒', {
            fontSize: '11px',
          }).setOrigin(0.5);
        }

        // 별 표시 (클리어한 스테이지만, 원 아래에 작게)
        if (isCleared && bestStar > 0) {
          const miniStars = '⭐'.repeat(bestStar);
          this.add.text(bx, btnY + btnR + 8, miniStars, {
            fontSize: '7px',
          }).setOrigin(0.5);
        }

        // 터치 영역 (잠금 안된 스테이지만 인터랙션)
        if (isUnlocked) {
          const hitArea = this.add.rectangle(bx, btnY, btnR * 2.5, btnR * 2.5, 0x000000, 0);
          hitArea.setInteractive({ useHandCursor: true });
          hitArea.on('pointerdown', () => {
            soundGenerator.playSelect();
            // 해당 스테이지로 게임 시작
            this.registry.set('currentStage', stageId);
            this.scene.start('GameScene');
          });
        }
      });
    });
  }

  /**
   * 하단 고정 버튼 영역
   */
  _createBottomButtons(width, height) {
    const btnY = height * 0.94;
    const btnW = 110;
    const btnH = 36;
    const gap = 15;

    // "공룡 바꾸기" 버튼
    this._createSmallButton(
      width / 2 - btnW / 2 - gap, btnY,
      '공룡 바꾸기', btnW, btnH,
      0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.scene.start('SelectScene');
      }
    );

    // "난이도 바꾸기" 버튼
    this._createSmallButton(
      width / 2 + btnW / 2 + gap, btnY,
      '난이도 변경', btnW, btnH,
      0x4EAEFF,
      () => {
        soundGenerator.playSelect();
        this.scene.start('DifficultyScene');
      }
    );
  }

  /**
   * 스테이지 잠금 해제 여부 판단
   * 스테이지 1은 항상 열림, 나머지는 이전 스테이지 클리어해야 열림
   */
  _isStageUnlocked(stageId) {
    if (stageId === 1) return true;
    // 이전 스테이지가 클리어되었으면 열림
    return this.progress.clearedStages.includes(stageId - 1);
  }

  /**
   * localStorage에서 진행도 불러오기
   */
  _loadProgress() {
    const key = 'ruvin_dino_progress';
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (data && data.clearedStages) {
        return {
          clearedStages: data.clearedStages || [],
          bestStars: data.bestStars || {},
        };
      }
    } catch {
      // 파싱 실패 시 초기값
    }
    return { clearedStages: [], bestStars: {} };
  }

  /**
   * 작은 버튼 생성 헬퍼
   */
  _createSmallButton(x, y, label, btnW, btnH, color, callback) {
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);

    this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
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

  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
