/**
 * WorldMapScene.js - 월드맵 화면 (좌우 스와이프 리디자인)
 * 6개 월드 x 5개 스테이지를 좌우 스와이프로 탐색
 *
 * [개선] 세로 스크롤 -> 좌우 스와이프 + 포커스 모드
 * - 현재 월드를 크게, 나머지는 작게 표시
 * - 좌우 화살표 네비게이션 버튼
 * - 각 월드 카드에 테마 배경색/이모지 미리보기
 */

import Phaser from 'phaser';
import { WORLDS } from '../data/worlds.js';
import { STAGES } from '../data/stages.js';
import { soundGenerator } from '../utils/SoundGenerator.js';
import { ACHIEVEMENTS, loadUnlockedAchievements } from '../data/achievements.js';

// 각 월드의 테마 카드 배경색 (연한 파스텔)
const WORLD_CARD_COLORS = {
  1: { bg: 0xE8F5E9, border: 0x81C784 }, // 풀밭 = 연녹색
  2: { bg: 0xFFF8E1, border: 0xFFD54F }, // 사막 = 연노랑
  3: { bg: 0xE0F2E0, border: 0x4CAF50 }, // 숲 = 진녹색
  4: { bg: 0xFFEBEE, border: 0xEF5350 }, // 화산 = 연빨강
  5: { bg: 0xE3F2FD, border: 0x42A5F5 }, // 바다 = 연파랑
  6: { bg: 0xF3E5F5, border: 0xAB47BC }, // 하늘 = 연보라
};

// 스테이지 버튼에 쓸 테마 색상 (진한 버전)
const WORLD_STAGE_COLORS = {
  1: 0x66BB6A, 2: 0xFFC107, 3: 0x388E3C,
  4: 0xE53935, 5: 0x1E88E5, 6: 0x8E24AA,
};

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create() {
    const { width, height } = this.scale;

    // 화면 전환 효과: 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // === 진행도 불러오기 ===
    this.progress = this._loadProgress();

    // === 전체 진행도 계산 ===
    const clearedCount = this.progress.clearedStages.length;
    const totalStages = 30;

    // === 현재 포커스 월드 인덱스 (0~5) ===
    // 첫 번째 미클리어 월드를 초기 포커스로 설정
    this.currentWorldIndex = this._getFirstUnfinishedWorldIndex();

    // === 양피지 느낌 배경 ===
    const bg = this.add.graphics();
    const bgSteps = 10;
    for (let i = 0; i < bgSteps; i++) {
      const t = i / (bgSteps - 1);
      const r = Math.round(255 - t * 20);
      const gv = Math.round(245 - t * 25);
      const b = Math.round(220 - t * 30);
      const color = (r << 16) | (gv << 8) | b;
      bg.fillStyle(color);
      bg.fillRect(0, (height / bgSteps) * i, width, (height / bgSteps) + 1);
    }
    bg.setDepth(0);

    // 배경 테두리 장식
    const border = this.add.graphics();
    border.lineStyle(3, 0xC8A882, 0.6);
    border.strokeRoundedRect(6, 6, width - 12, height - 12, 12);
    border.lineStyle(1.5, 0xD4B896, 0.4);
    border.strokeRoundedRect(12, 12, width - 24, height - 24, 10);
    border.setDepth(100);

    // === 상단 타이틀 (화려하게) ===
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(0xFF6B6B, 0.9);
    ribbonG.fillRoundedRect(width * 0.1, 8, width * 0.8, 44, 22);
    ribbonG.fillStyle(0xFF8888, 0.6);
    ribbonG.fillRoundedRect(width * 0.12, 10, width * 0.76, 40, 20);
    ribbonG.setDepth(10);

    this.add.text(width / 2, 30, '루빈이의 공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '26px',
      color: '#FFFFFF',
      stroke: '#CC3333',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000044', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(11);

    // 진행도 표시
    this.add.text(width / 2, 62, `${clearedCount} / ${totalStages} 클리어!`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#8B6914',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(11);

    // 진행도 바
    const progBarW = width * 0.5;
    const progBarX = width / 2 - progBarW / 2;
    const progBarY = 78;
    const progBg2 = this.add.graphics();
    progBg2.fillStyle(0xDDCCAA, 1);
    progBg2.fillRoundedRect(progBarX, progBarY, progBarW, 8, 4);
    progBg2.setDepth(11);
    const progFill = this.add.graphics();
    const progRatio = clearedCount / totalStages;
    progFill.fillStyle(0xFFD700, 1);
    progFill.fillRoundedRect(progBarX, progBarY, progBarW * progRatio, 8, 4);
    progFill.setDepth(11);

    // === 월드 인디케이터 (점 6개 - 현재 위치 표시) ===
    this._createWorldIndicator(width, 95);

    // === 월드 카드 영역 (가운데 큰 카드 + 좌우 미리보기) ===
    this.worldCardContainer = this.add.container(0, 0).setDepth(20);
    this._renderFocusedWorld();

    // === 좌우 화살표 네비게이션 버튼 ===
    this._createNavArrows(width, height);

    // === 하단 버튼 영역 (고정) ===
    this._createBottomButtons(width, height);

    // === 좌우 스와이프 입력 설정 ===
    this._setupSwipe(width, height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /** 첫 번째 미완료 월드 인덱스를 계산 */
  _getFirstUnfinishedWorldIndex() {
    for (let wi = 0; wi < WORLDS.length; wi++) {
      const world = WORLDS[wi];
      const stageIds = STAGES.filter(s => s.world === world.id).map(s => s.id);
      // 이 월드의 모든 스테이지가 클리어되지 않았다면 여기가 현재 월드
      const allCleared = stageIds.every(id => this.progress.clearedStages.includes(id));
      if (!allCleared) return wi;
    }
    return 0; // 모두 클리어했으면 첫 번째로
  }

  /** 월드 인디케이터 (점 6개) 생성 */
  _createWorldIndicator(screenW, y) {
    this.indicatorDots = [];
    const dotR = 5;
    const dotGap = 18;
    const totalW = (dotR * 2 + dotGap) * WORLDS.length - dotGap;
    const startX = screenW / 2 - totalW / 2 + dotR;

    for (let i = 0; i < WORLDS.length; i++) {
      const dx = startX + i * (dotR * 2 + dotGap);
      const dot = this.add.graphics();
      dot.setDepth(15);
      this.indicatorDots.push({ g: dot, x: dx, y });
    }
    this._updateIndicator();
  }

  /** 인디케이터 점 색상 업데이트 */
  _updateIndicator() {
    this.indicatorDots.forEach((dot, i) => {
      dot.g.clear();
      if (i === this.currentWorldIndex) {
        // 현재 월드: 크고 밝은 점
        dot.g.fillStyle(0xFF6B6B, 1);
        dot.g.fillCircle(dot.x, dot.y, 7);
        dot.g.lineStyle(2, 0xFFFFFF, 1);
        dot.g.strokeCircle(dot.x, dot.y, 7);
      } else if (this._isWorldUnlocked(WORLDS[i].id)) {
        // 해제된 월드: 보통 점
        const colors = WORLD_CARD_COLORS[WORLDS[i].id];
        dot.g.fillStyle(colors.border, 0.8);
        dot.g.fillCircle(dot.x, dot.y, 5);
      } else {
        // 잠긴 월드: 회색 점
        dot.g.fillStyle(0xBBBBBB, 0.5);
        dot.g.fillCircle(dot.x, dot.y, 4);
      }
    });
  }

  /** 현재 포커스 월드 카드를 크게 렌더링 + 좌우 미니 카드 */
  _renderFocusedWorld() {
    const { width, height } = this.scale;

    // 기존 카드 모두 제거
    this.worldCardContainer.removeAll(true);

    // 카드 크기 설정
    const bigCardW = width * 0.82;
    const bigCardH = height * 0.52;
    const bigCardY = height * 0.38;

    // === 현재 월드 (가운데 큰 카드) ===
    const currentWorld = WORLDS[this.currentWorldIndex];
    this._drawWorldCard(currentWorld, width / 2, bigCardY, bigCardW, bigCardH, true);

    // === 왼쪽 미니 카드 (이전 월드) ===
    if (this.currentWorldIndex > 0) {
      const prevWorld = WORLDS[this.currentWorldIndex - 1];
      const miniW = bigCardW * 0.3;
      const miniH = bigCardH * 0.35;
      this._drawMiniWorldCard(prevWorld, -miniW * 0.15, bigCardY, miniW, miniH);
    }

    // === 오른쪽 미니 카드 (다음 월드) ===
    if (this.currentWorldIndex < WORLDS.length - 1) {
      const nextWorld = WORLDS[this.currentWorldIndex + 1];
      const miniW = bigCardW * 0.3;
      const miniH = bigCardH * 0.35;
      this._drawMiniWorldCard(nextWorld, width + miniW * 0.15, bigCardY, miniW, miniH);
    }
  }

  /** 큰 월드 카드 (포커스 상태) 그리기 */
  _drawWorldCard(world, cx, cy, cardW, cardH, isFocused) {
    const colors = WORLD_CARD_COLORS[world.id] || { bg: 0xF5F5F5, border: 0xCCCCCC };
    const isUnlocked = this._isWorldUnlocked(world.id);

    // 카드 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.12);
    shadow.fillRoundedRect(cx - cardW / 2 + 4, cy - cardH / 2 + 4, cardW, cardH, 20);
    this.worldCardContainer.add(shadow);

    // 카드 배경
    const cardBg = this.add.graphics();
    if (isUnlocked) {
      cardBg.fillStyle(colors.bg, 1);
      cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 20);
      cardBg.lineStyle(3, colors.border, 1);
      cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 20);
    } else {
      cardBg.fillStyle(0xDDDDDD, 0.6);
      cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 20);
      cardBg.lineStyle(2, 0xBBBBBB, 0.6);
      cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 20);
    }
    this.worldCardContainer.add(cardBg);

    // 테마 배경 그라디언트 띠 (카드 상단에 월드 색상 미리보기)
    if (isUnlocked) {
      const stripH = cardH * 0.18;
      const stripG = this.add.graphics();
      stripG.fillStyle(colors.border, 0.25);
      stripG.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, stripH, { tl: 20, tr: 20, bl: 0, br: 0 });
      this.worldCardContainer.add(stripG);
    }

    // 월드 이모지 (큰 크기)
    const emojiSize = isUnlocked ? 42 : 28;
    const emojiText = this.add.text(cx, cy - cardH * 0.28, world.emoji, {
      fontSize: `${emojiSize}px`,
    }).setOrigin(0.5);
    this.worldCardContainer.add(emojiText);

    // 월드 이름
    const nameColor = isUnlocked ? '#333333' : '#999999';
    const nameSize = isUnlocked ? '24px' : '18px';
    const worldLabel = this.add.text(cx, cy - cardH * 0.12, world.name, {
      fontFamily: 'Jua, sans-serif',
      fontSize: nameSize,
      color: nameColor,
      stroke: '#FFFFFF',
      strokeThickness: isUnlocked ? 3 : 1,
    }).setOrigin(0.5);
    this.worldCardContainer.add(worldLabel);

    // 잠긴 월드 표시
    if (!isUnlocked) {
      const lockText = this.add.text(cx, cy + 10, '잠겨있어요', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: '#AAAAAA',
        stroke: '#FFFFFF',
        strokeThickness: 1,
      }).setOrigin(0.5);
      this.worldCardContainer.add(lockText);
      return;
    }

    // === 스테이지 버튼 5개 (가로 배치) ===
    const stageIds = STAGES.filter(s => s.world === world.id).map(s => s.id);
    const btnR = Math.min(cardW * 0.09, 36); // 반지름 확대: 24->36px (터치 타겟 키움)
    const btnSpacing = cardW / 6;
    const btnY = cy + cardH * 0.15;
    const stageColor = WORLD_STAGE_COLORS[world.id] || 0x888888;
    const cardLeft = cx - cardW / 2;

    // 선택한 공룡 표시 위치 (첫 번째 미클리어 해제 스테이지)
    let dinoMarkerPos = null;

    stageIds.forEach((stageId, si) => {
      const bx = cardLeft + btnSpacing * (si + 1);
      const stageInWorld = si + 1;

      const isCleared = this.progress.clearedStages.includes(stageId);
      const isStageUnlocked = this._isStageUnlocked(stageId);
      const bestStar = this.progress.bestStars[stageId] || 0;

      // 버튼 그래픽
      const btnG = this.add.graphics();

      if (isCleared) {
        // 클리어: 금색 원
        btnG.fillStyle(0x000000, 0.1);
        btnG.fillCircle(bx + 2, btnY + 2, btnR);
        btnG.fillStyle(0xFFD700, 1);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(2.5, 0xFFA500, 1);
        btnG.strokeCircle(bx, btnY, btnR);
        btnG.fillStyle(0xFFE44D, 0.4);
        btnG.fillCircle(bx - 3, btnY - 3, btnR * 0.5);
      } else if (isStageUnlocked) {
        // 열린 스테이지: 테마 색상 원
        btnG.fillStyle(0x000000, 0.1);
        btnG.fillCircle(bx + 2, btnY + 2, btnR);
        btnG.fillStyle(stageColor, 1);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(2, 0xFFFFFF, 0.8);
        btnG.strokeCircle(bx, btnY, btnR);
        btnG.fillStyle(0xFFFFFF, 0.25);
        btnG.fillCircle(bx - 3, btnY - 3, btnR * 0.4);

        // 첫 번째 미클리어 해제 스테이지 위치 기록
        if (!dinoMarkerPos) {
          dinoMarkerPos = { x: bx, y: btnY };
        }
      } else {
        // 잠금: 어두운 회색 원
        btnG.fillStyle(0x999999, 0.5);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(1.5, 0x777777, 0.5);
        btnG.strokeCircle(bx, btnY, btnR);
      }
      this.worldCardContainer.add(btnG);

      // 버튼 안 텍스트/아이콘
      if (isCleared) {
        const checkText = this.add.text(bx, btnY - 1, '\u2713', {
          fontFamily: 'Jua, sans-serif',
          fontSize: `${btnR * 1.2}px`,
          color: '#FFFFFF',
          stroke: '#8B6914',
          strokeThickness: 1,
        }).setOrigin(0.5);
        this.worldCardContainer.add(checkText);
      } else if (isStageUnlocked) {
        const numText = this.add.text(bx, btnY, `${stageInWorld}`, {
          fontFamily: 'Jua, sans-serif',
          fontSize: `${btnR * 1.0}px`,
          color: '#FFFFFF',
          stroke: '#00000033',
          strokeThickness: 1,
        }).setOrigin(0.5);
        this.worldCardContainer.add(numText);
      } else {
        const lockIcon = this.add.text(bx, btnY, '\uD83D\uDD12', {
          fontSize: `${btnR * 0.8}px`,
        }).setOrigin(0.5);
        this.worldCardContainer.add(lockIcon);
      }

      // 별 표시 (클리어 스테이지)
      if (isCleared && bestStar > 0) {
        const starStr = '\u2B50'.repeat(bestStar);
        const starText = this.add.text(bx, btnY + btnR + 8, starStr, {
          fontSize: '9px',
        }).setOrigin(0.5);
        this.worldCardContainer.add(starText);
      }

      // 터치 영역 (해제된 스테이지만)
      if (isStageUnlocked) {
        const hitArea = this.add.rectangle(bx, btnY, btnR * 2.8, btnR * 2.8, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.worldCardContainer.add(hitArea);

        hitArea.on('pointerover', () => {
          this.tweens.add({
            targets: btnG, scaleX: 1.15, scaleY: 1.15,
            duration: 120, ease: 'Sine.easeOut',
          });
        });
        hitArea.on('pointerout', () => {
          this.tweens.add({
            targets: btnG, scaleX: 1, scaleY: 1,
            duration: 120, ease: 'Sine.easeOut',
          });
        });

        // 클릭으로 스테이지 시작 (스와이프와 구분)
        hitArea.on('pointerup', () => {
          if (this._wasSwiping) return;
          soundGenerator.playSelect();
          this.tweens.add({
            targets: btnG,
            scaleX: 1.2, scaleY: 1.2,
            duration: 120, yoyo: true,
            onComplete: () => {
              this.registry.set('currentStage', stageId);
              this.cameras.main.fadeOut(300, 0, 0, 0);
              this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
              });
            },
          });
        });
      }
    });

    // 스테이지 버튼 사이 연결선
    const lineG = this.add.graphics();
    lineG.lineStyle(1.5, colors.border, 0.4);
    for (let si = 0; si < stageIds.length - 1; si++) {
      const x1 = cardLeft + btnSpacing * (si + 1) + btnR + 2;
      const x2 = cardLeft + btnSpacing * (si + 2) - btnR - 2;
      const dashLen = 4;
      const gapLen = 3;
      let lx = x1;
      while (lx < x2) {
        const endX = Math.min(lx + dashLen, x2);
        lineG.lineBetween(lx, btnY, endX, btnY);
        lx = endX + gapLen;
      }
    }
    this.worldCardContainer.add(lineG);

    // === 월드 클리어 현황 텍스트 ===
    const clearedInWorld = stageIds.filter(id => this.progress.clearedStages.includes(id)).length;
    const statusText = this.add.text(cx, cy + cardH * 0.35, `${clearedInWorld} / ${stageIds.length} 스테이지 클리어`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#8B6914',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.worldCardContainer.add(statusText);

    // === 선택한 공룡을 현재 스테이지 위치에 표시 ===
    if (dinoMarkerPos) {
      const dinoKey = this.registry.get('selectedDino') || 'brachio';
      const imgKey = `img_${dinoKey}`;
      const useImage = this.textures.exists(imgKey);
      const markerKey = useImage ? imgKey : dinoKey;

      const dinoMarker = this.add.sprite(
        dinoMarkerPos.x, dinoMarkerPos.y - 28,
        markerKey, 0
      ).setOrigin(0.5, 1);

      if (useImage) {
        dinoMarker.setScale(0.08);
      } else {
        dinoMarker.setScale(0.35);
      }
      this.worldCardContainer.add(dinoMarker);

      // 통통 튀는 애니메이션
      this.tweens.add({
        targets: dinoMarker,
        y: dinoMarker.y - 6,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /** 미니 월드 카드 (좌우 미리보기) */
  _drawMiniWorldCard(world, cx, cy, cardW, cardH) {
    const colors = WORLD_CARD_COLORS[world.id] || { bg: 0xF5F5F5, border: 0xCCCCCC };
    const isUnlocked = this._isWorldUnlocked(world.id);

    const cardBg = this.add.graphics();
    if (isUnlocked) {
      cardBg.fillStyle(colors.bg, 0.6);
      cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      cardBg.lineStyle(2, colors.border, 0.5);
      cardBg.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    } else {
      cardBg.fillStyle(0xDDDDDD, 0.3);
      cardBg.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
    }
    this.worldCardContainer.add(cardBg);

    // 이모지
    const emojiText = this.add.text(cx, cy - 8, world.emoji, {
      fontSize: '20px',
    }).setOrigin(0.5).setAlpha(isUnlocked ? 0.7 : 0.3);
    this.worldCardContainer.add(emojiText);

    // 이름
    const nameText = this.add.text(cx, cy + 16, world.name, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '11px',
      color: isUnlocked ? '#666666' : '#AAAAAA',
      stroke: '#FFFFFF',
      strokeThickness: 1,
    }).setOrigin(0.5);
    this.worldCardContainer.add(nameText);
  }

  /** 좌우 화살표 네비게이션 버튼 */
  _createNavArrows(width, height) {
    const arrowY = height * 0.38;
    const arrowSize = 36;
    const arrowPad = 12;

    // 왼쪽 화살표
    this.leftArrow = this.add.text(arrowPad + arrowSize / 2, arrowY, '\u25C0', {
      fontSize: `${arrowSize}px`,
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30).setAlpha(0.8);
    this.leftArrow.setInteractive({ useHandCursor: true });

    this.leftArrow.on('pointerdown', () => {
      this._navigateWorld(-1);
    });
    this.leftArrow.on('pointerover', () => this.leftArrow.setAlpha(1));
    this.leftArrow.on('pointerout', () => this.leftArrow.setAlpha(0.8));

    // 오른쪽 화살표
    this.rightArrow = this.add.text(width - arrowPad - arrowSize / 2, arrowY, '\u25B6', {
      fontSize: `${arrowSize}px`,
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30).setAlpha(0.8);
    this.rightArrow.setInteractive({ useHandCursor: true });

    this.rightArrow.on('pointerdown', () => {
      this._navigateWorld(1);
    });
    this.rightArrow.on('pointerover', () => this.rightArrow.setAlpha(1));
    this.rightArrow.on('pointerout', () => this.rightArrow.setAlpha(0.8));

    // 화살표 가시성 업데이트
    this._updateArrowVisibility();
  }

  /** 화살표 가시성: 첫 월드면 왼쪽 숨김, 마지막이면 오른쪽 숨김 */
  _updateArrowVisibility() {
    if (this.leftArrow) {
      this.leftArrow.setVisible(this.currentWorldIndex > 0);
    }
    if (this.rightArrow) {
      this.rightArrow.setVisible(this.currentWorldIndex < WORLDS.length - 1);
    }
  }

  /** 월드 이동 (방향: -1=왼쪽, +1=오른쪽) */
  _navigateWorld(direction) {
    const newIndex = this.currentWorldIndex + direction;
    if (newIndex < 0 || newIndex >= WORLDS.length) return;

    soundGenerator.init();
    soundGenerator.playSelect();

    this.currentWorldIndex = newIndex;

    // 카드 전환 애니메이션 (슬라이드)
    const { width } = this.scale;
    const slideDir = direction > 0 ? -1 : 1; // 반대 방향으로 밀려남

    // 기존 카드를 밀어내는 효과
    this.tweens.add({
      targets: this.worldCardContainer,
      x: slideDir * width * 0.3,
      alpha: 0,
      duration: 200,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // 새 카드를 반대쪽에서 등장
        this.worldCardContainer.x = -slideDir * width * 0.3;
        this._renderFocusedWorld();
        this.tweens.add({
          targets: this.worldCardContainer,
          x: 0,
          alpha: 1,
          duration: 300,
          ease: 'Back.easeOut',
        });
      },
    });

    // 인디케이터 + 화살표 업데이트
    this._updateIndicator();
    this._updateArrowVisibility();
  }

  /** 좌우 스와이프 입력 설정 */
  _setupSwipe(screenW, screenH) {
    this._wasSwiping = false;
    this._swipeStartX = 0;
    this._swipeStartY = 0;

    this.input.on('pointerdown', (pointer) => {
      // 하단 버튼 영역은 스와이프 무시
      if (pointer.y > screenH * 0.88) return;
      this._swipeStartX = pointer.x;
      this._swipeStartY = pointer.y;
      this._wasSwiping = false;
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const dx = Math.abs(pointer.x - this._swipeStartX);
      const dy = Math.abs(pointer.y - this._swipeStartY);
      // 수평 이동이 30px 이상이고 수평>수직이면 스와이프로 판정
      if (dx > 30 && dx > dy) {
        this._wasSwiping = true;
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this._wasSwiping) return;
      const dx = pointer.x - this._swipeStartX;
      // 50px 이상 스와이프해야 월드 전환
      if (Math.abs(dx) > 50) {
        this._navigateWorld(dx < 0 ? 1 : -1);
      }
    });
  }

  /**
   * 하단 고정 버튼 영역 (스크롤에 영향 안 받음)
   */
  _createBottomButtons(width, height) {
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0xE8D8C0, 0.95);
    bottomBg.fillRect(0, height - height * 0.12, width, height * 0.12);
    bottomBg.lineStyle(1.5, 0xC8A882, 0.5);
    bottomBg.lineBetween(10, height - height * 0.12, width - 10, height - height * 0.12);
    bottomBg.setDepth(50);

    const btnY = height - height * 0.06;
    const btnW = Math.min(width * 0.17, 72);
    const btnH = Math.min(height * 0.06, 42);
    const gap = Math.min(width * 0.01, 6);

    const totalW = btnW * 5 + gap * 4;
    const startX = (width - totalW) / 2 + btnW / 2;

    // "상점" 버튼
    this._createPrettyButton(
      startX, btnY, '상점', btnW, btnH, 0xFF8C00,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('ShopScene');
        });
      }
    );

    // "업적" 버튼
    this._createPrettyButton(
      startX + btnW + gap, btnY, '업적', btnW, btnH, 0xFFAA00,
      () => {
        soundGenerator.playSelect();
        this._showAchievementOverlay(width, height);
      }
    );

    // "공룡" 버튼
    this._createPrettyButton(
      startX + (btnW + gap) * 2, btnY, '공룡', btnW, btnH, 0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('SelectScene');
        });
      }
    );

    // "난이도" 버튼
    this._createPrettyButton(
      startX + (btnW + gap) * 3, btnY, '난이도', btnW, btnH, 0x4EAEFF,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('DifficultyScene');
        });
      }
    );

    // "리셋" 버튼
    this._createPrettyButton(
      startX + (btnW + gap) * 4, btnY, '리셋', btnW, btnH, 0xE55B5B,
      () => {
        soundGenerator.playSelect();
        this._showResetConfirm(width, height);
      }
    );
  }

  /** "처음부터" 확인 다이얼로그 */
  _showResetConfirm(width, height) {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    const dlgW = Math.min(width * 0.75, 300);
    const dlgH = 160;
    const dlgX = (width - dlgW) / 2;
    const dlgY = (height - dlgH) / 2;

    const dlgBg = this.add.graphics();
    dlgBg.fillStyle(0xFFF8E8, 1);
    dlgBg.fillRoundedRect(dlgX, dlgY, dlgW, dlgH, 16);
    dlgBg.lineStyle(3, 0xE55B5B, 1);
    dlgBg.strokeRoundedRect(dlgX, dlgY, dlgW, dlgH, 16);
    dlgBg.setDepth(201);

    const msg = this.add.text(width / 2, dlgY + 40, '정말 처음부터 할까요?', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#333333',
    }).setOrigin(0.5).setDepth(202);

    const subMsg = this.add.text(width / 2, dlgY + 65, '모든 진행 기록이 사라져요!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
      color: '#999999',
    }).setOrigin(0.5).setDepth(202);

    const yesBtnW = 90;
    const yesBtnH = 36;
    const yesBtnX = width / 2 - 55;
    const yesBtnY = dlgY + dlgH - 45;

    const yesBg = this.add.graphics();
    yesBg.fillStyle(0xE55B5B, 1);
    yesBg.fillRoundedRect(yesBtnX - yesBtnW / 2, yesBtnY - yesBtnH / 2, yesBtnW, yesBtnH, yesBtnH / 2);
    yesBg.setDepth(202);

    const yesText = this.add.text(yesBtnX, yesBtnY, '네!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(203);

    const yesHit = this.add.rectangle(yesBtnX, yesBtnY, yesBtnW, yesBtnH, 0x000000, 0);
    yesHit.setInteractive({ useHandCursor: true }).setDepth(204);

    yesHit.on('pointerdown', () => {
      localStorage.removeItem('ruvin_dino_progress');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('SelectScene');
      });
    });

    const noBtnX = width / 2 + 55;

    const noBg = this.add.graphics();
    noBg.fillStyle(0xAAAAAA, 1);
    noBg.fillRoundedRect(noBtnX - yesBtnW / 2, yesBtnY - yesBtnH / 2, yesBtnW, yesBtnH, yesBtnH / 2);
    noBg.setDepth(202);

    const noText = this.add.text(noBtnX, yesBtnY, '아니오', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(203);

    const noHit = this.add.rectangle(noBtnX, yesBtnY, yesBtnW, yesBtnH, 0x000000, 0);
    noHit.setInteractive({ useHandCursor: true }).setDepth(204);

    noHit.on('pointerdown', () => {
      overlay.destroy(); dlgBg.destroy(); msg.destroy(); subMsg.destroy();
      yesBg.destroy(); yesText.destroy(); yesHit.destroy();
      noBg.destroy(); noText.destroy(); noHit.destroy();
    });
  }

  /** 업적 목록 오버레이 팝업 */
  _showAchievementOverlay(width, height) {
    const unlocked = loadUnlockedAchievements();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    const dlgW = Math.min(width * 0.9, 340);
    const dlgH = Math.min(height * 0.8, 500);
    const dlgX = (width - dlgW) / 2;
    const dlgY = (height - dlgH) / 2;

    const dlgBg = this.add.graphics();
    dlgBg.fillStyle(0xFFF8E1, 1);
    dlgBg.fillRoundedRect(dlgX, dlgY, dlgW, dlgH, 16);
    dlgBg.lineStyle(3, 0xFFAA00, 1);
    dlgBg.strokeRoundedRect(dlgX, dlgY, dlgW, dlgH, 16);
    dlgBg.setDepth(201);

    const title = this.add.text(width / 2, dlgY + 25, '업적', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#8B6914',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(202);

    const count = this.add.text(width / 2, dlgY + 50, `${unlocked.length} / ${ACHIEVEMENTS.length} 달성`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
      color: '#AA8800',
    }).setOrigin(0.5).setDepth(202);

    const achElements = [];
    const listStartY = dlgY + 70;
    const itemH = 32;

    ACHIEVEMENTS.forEach((ach, i) => {
      const isUnlocked = unlocked.includes(ach.id);
      const itemY = listStartY + i * itemH;

      const iconText = this.add.text(dlgX + 15, itemY, ach.icon, {
        fontSize: '18px',
      }).setOrigin(0, 0.5).setDepth(202);

      const nameText = this.add.text(dlgX + 40, itemY - 5, ach.name, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
        color: isUnlocked ? '#333333' : '#BBBBBB',
      }).setOrigin(0, 0.5).setDepth(202);

      const descText = this.add.text(dlgX + 40, itemY + 10, ach.desc, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '10px',
        color: isUnlocked ? '#888888' : '#CCCCCC',
      }).setOrigin(0, 0.5).setDepth(202);

      if (!isUnlocked) iconText.setAlpha(0.3);
      achElements.push(iconText, nameText, descText);
    });

    const closeBtnW = 100;
    const closeBtnH = 36;
    const closeBtnX = width / 2;
    const closeBtnY = dlgY + dlgH - 30;

    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xFFAA00, 1);
    closeBg.fillRoundedRect(closeBtnX - closeBtnW / 2, closeBtnY - closeBtnH / 2, closeBtnW, closeBtnH, closeBtnH / 2);
    closeBg.setDepth(202);

    const closeText = this.add.text(closeBtnX, closeBtnY, '닫기', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(203);

    const closeHit = this.add.rectangle(closeBtnX, closeBtnY, closeBtnW, closeBtnH, 0x000000, 0);
    closeHit.setInteractive({ useHandCursor: true }).setDepth(204);

    closeHit.on('pointerdown', () => {
      overlay.destroy(); dlgBg.destroy(); title.destroy(); count.destroy();
      closeBg.destroy(); closeText.destroy(); closeHit.destroy();
      achElements.forEach(el => el.destroy());
    });
  }

  /** 예쁜 라운드 버튼 */
  _createPrettyButton(x, y, label, btnW, btnH, color, callback) {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.15);
    shadow.fillRoundedRect(x - btnW / 2 + 2, y - btnH / 2 + 2, btnW, btnH, btnH / 2);
    shadow.setDepth(51);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);
    bg.fillStyle(0xFFFFFF, 0.2);
    bg.fillRoundedRect(x - btnW / 2 + 4, y - btnH / 2 + 2, btnW - 8, btnH * 0.4, btnH / 3);
    bg.setDepth(52);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
      color: '#FFFFFF',
      stroke: '#00000033',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(53);

    const hitArea = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true }).setDepth(54);

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, shadow, text],
        scaleX: 0.93, scaleY: 0.93,
        duration: 80, yoyo: true,
        onComplete: callback,
      });
    });

    hitArea.on('pointerover', () => bg.setAlpha(0.85));
    hitArea.on('pointerout', () => bg.setAlpha(1));
  }

  /** 월드가 해제되었는지 */
  _isWorldUnlocked(worldId) {
    if (worldId === 1) return true;
    const prevWorldLastStage = (worldId - 1) * 5;
    return this.progress.clearedStages.includes(prevWorldLastStage);
  }

  /** 스테이지 잠금 해제 여부 */
  _isStageUnlocked(stageId) {
    if (stageId === 1) return true;
    return this.progress.clearedStages.includes(stageId - 1);
  }

  /** localStorage에서 진행도 불러오기 */
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
      // 파싱 실패
    }
    return { clearedStages: [], bestStars: {} };
  }

  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
