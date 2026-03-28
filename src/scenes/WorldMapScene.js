/**
 * WorldMapScene.js - 월드맵 화면 (리디자인)
 * 6개 월드 x 5개 스테이지를 모험 지도 느낌으로 보여줌
 *
 * 디자인 특징:
 * - 양피지 느낌의 모험 지도 배경
 * - 각 월드를 테마 색상 카드로 표시
 * - 스테이지 버튼: 열림(테마색), 클리어(금색+체크), 잠김(회색+자물쇠)
 * - 월드 간 점선 경로 연결
 * - 선택한 공룡이 현재 위치에 표시
 * - 전체 진행도 표시
 */

import Phaser from 'phaser';
import { WORLDS } from '../data/worlds.js';
import { STAGES } from '../data/stages.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

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

    // === 스크롤용 컨테이너 높이 계산 ===
    // 카드 6개 세로 나열 + 여백
    const cardH = Math.max(height * 0.16, 110);
    const cardGap = 12;
    const titleAreaH = height * 0.12;
    const bottomAreaH = height * 0.14;
    const contentH = titleAreaH + (cardH + cardGap) * 6 + 40;
    this.scrollY = 0;
    this.maxScrollY = Math.max(0, contentH - height + bottomAreaH);

    // === 양피지 느낌 배경 ===
    const bg = this.add.graphics();
    // 상단 ~ 하단 세로 그라디언트 (양피지 색상)
    const bgSteps = 10;
    for (let i = 0; i < bgSteps; i++) {
      const t = i / (bgSteps - 1);
      // 양피지: 따뜻한 베이지에서 살짝 어두운 베이지로
      const r = Math.round(255 - t * 20);
      const gv = Math.round(245 - t * 25);
      const b = Math.round(220 - t * 30);
      const color = (r << 16) | (gv << 8) | b;
      bg.fillStyle(color);
      bg.fillRect(0, (height / bgSteps) * i, width, (height / bgSteps) + 1);
    }
    bg.setDepth(0);

    // 배경 테두리 장식 (양피지 가장자리)
    const border = this.add.graphics();
    border.lineStyle(3, 0xC8A882, 0.6);
    border.strokeRoundedRect(6, 6, width - 12, height - 12, 12);
    border.lineStyle(1.5, 0xD4B896, 0.4);
    border.strokeRoundedRect(12, 12, width - 24, height - 24, 10);
    border.setDepth(100);

    // === 스크롤 가능한 컨테이너 ===
    this.scrollContainer = this.add.container(0, 0);
    this.scrollContainer.setDepth(10);

    // === 상단 타이틀 (화려하게) ===
    // 타이틀 배경 리본
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(0xFF6B6B, 0.9);
    ribbonG.fillRoundedRect(width * 0.1, 8, width * 0.8, 44, 22);
    ribbonG.fillStyle(0xFF8888, 0.6);
    ribbonG.fillRoundedRect(width * 0.12, 10, width * 0.76, 40, 20);
    this.scrollContainer.add(ribbonG);

    const title = this.add.text(width / 2, 30, '루빈이의 공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '26px',
      color: '#FFFFFF',
      stroke: '#CC3333',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000044', blur: 4, fill: true },
    }).setOrigin(0.5);
    this.scrollContainer.add(title);

    // 진행도 표시 (타이틀 아래)
    const progressText = this.add.text(width / 2, 62, `${clearedCount} / ${totalStages} 클리어!`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#8B6914',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.scrollContainer.add(progressText);

    // 진행도 바
    const progBarW = width * 0.5;
    const progBarX = width / 2 - progBarW / 2;
    const progBarY = 78;
    const progBg = this.add.graphics();
    progBg.fillStyle(0xDDCCAA, 1);
    progBg.fillRoundedRect(progBarX, progBarY, progBarW, 8, 4);
    this.scrollContainer.add(progBg);
    const progFill = this.add.graphics();
    const progRatio = clearedCount / totalStages;
    progFill.fillStyle(0xFFD700, 1);
    progFill.fillRoundedRect(progBarX, progBarY, progBarW * progRatio, 8, 4);
    this.scrollContainer.add(progFill);

    // === 월드 카드 + 스테이지 버튼 생성 ===
    const startY = 96;
    this._currentStagePos = null; // 선택한 공룡 표시 위치

    WORLDS.forEach((world, wi) => {
      const cardY = startY + wi * (cardH + cardGap);
      this._createWorldCard(world, wi, width, cardY, cardH);

      // 월드 간 점선 경로 (마지막 월드 제외)
      if (wi < WORLDS.length - 1) {
        const nextWorld = WORLDS[wi + 1];
        const isNextLocked = !this._isWorldUnlocked(nextWorld.id);
        this._drawPathBetweenCards(width / 2, cardY + cardH, cardY + cardH + cardGap, isNextLocked);
      }
    });

    // === 선택한 공룡을 현재 스테이지 위치에 표시 ===
    if (this._currentStagePos) {
      const dinoKey = this.registry.get('selectedDino') || 'brachio';
      const dinoMarker = this.add.sprite(
        this._currentStagePos.x,
        this._currentStagePos.y - 24,
        dinoKey + '_idle'
      ).setScale(0.35).setOrigin(0.5, 1);
      this.scrollContainer.add(dinoMarker);

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

    // === 하단 버튼 영역 (고정, 스크롤에 영향 안 받음) ===
    this._createBottomButtons(width, height);

    // === 스크롤 입력 설정 ===
    this._setupScroll(height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 월드 카드 하나 생성
   * 라운드 사각형 카드 안에 월드 이름 + 스테이지 버튼 5개 배치
   */
  _createWorldCard(world, worldIndex, screenW, cardY, cardH) {
    const cardW = screenW * 0.88;
    const cardX = (screenW - cardW) / 2;
    const colors = WORLD_CARD_COLORS[world.id] || { bg: 0xF5F5F5, border: 0xCCCCCC };
    const isWorldUnlocked = this._isWorldUnlocked(world.id);

    // 카드 배경
    const cardBg = this.add.graphics();
    if (isWorldUnlocked) {
      // 열린 월드: 테마 색상 카드
      cardBg.fillStyle(colors.bg, 1);
      cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 14);
      cardBg.lineStyle(2.5, colors.border, 1);
      cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);
      // 카드 그림자 효과
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.08);
      shadow.fillRoundedRect(cardX + 3, cardY + 3, cardW, cardH, 14);
      this.scrollContainer.add(shadow);
    } else {
      // 잠긴 월드: 반투명 회색
      cardBg.fillStyle(0xDDDDDD, 0.5);
      cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 14);
      cardBg.lineStyle(2, 0xBBBBBB, 0.5);
      cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);
    }
    this.scrollContainer.add(cardBg);

    // 카드 상단: 월드 이모지 + 이름 (큰 글씨)
    const headerY = cardY + 18;
    const nameColor = isWorldUnlocked ? '#333333' : '#999999';
    const worldLabel = this.add.text(cardX + cardW / 2, headerY, `${world.emoji} ${world.name}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: nameColor,
      stroke: isWorldUnlocked ? '#FFFFFF' : undefined,
      strokeThickness: isWorldUnlocked ? 2 : 0,
    }).setOrigin(0.5);
    this.scrollContainer.add(worldLabel);

    // 잠긴 월드에 자물쇠 표시
    if (!isWorldUnlocked) {
      const lockText = this.add.text(cardX + cardW / 2, cardY + cardH / 2 + 10, '잠겨있어요', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '13px',
        color: '#AAAAAA',
      }).setOrigin(0.5);
      this.scrollContainer.add(lockText);
      return; // 잠긴 월드는 스테이지 버튼 안 그림
    }

    // === 스테이지 버튼 5개 (가로 배치) ===
    const stageIds = STAGES.filter(s => s.world === world.id).map(s => s.id);
    const btnR = Math.min(cardW * 0.065, 22); // 버튼 반지름 (크게)
    const btnSpacing = cardW / 6; // 균등 배치
    const btnY = cardY + cardH * 0.65;
    const stageColor = WORLD_STAGE_COLORS[world.id] || 0x888888;

    stageIds.forEach((stageId, si) => {
      const bx = cardX + btnSpacing * (si + 1);
      const stageInWorld = si + 1;

      const isCleared = this.progress.clearedStages.includes(stageId);
      const isUnlocked = this._isStageUnlocked(stageId);
      const bestStar = this.progress.bestStars[stageId] || 0;

      // 버튼 그래픽
      const btnG = this.add.graphics();

      if (isCleared) {
        // 클리어: 금색 원 + 그림자
        btnG.fillStyle(0x000000, 0.1);
        btnG.fillCircle(bx + 2, btnY + 2, btnR); // 그림자
        btnG.fillStyle(0xFFD700, 1);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(2.5, 0xFFA500, 1);
        btnG.strokeCircle(bx, btnY, btnR);
        // 안쪽 하이라이트
        btnG.fillStyle(0xFFE44D, 0.4);
        btnG.fillCircle(bx - 3, btnY - 3, btnR * 0.5);
      } else if (isUnlocked) {
        // 열린 스테이지: 테마 색상 원 + 그림자
        btnG.fillStyle(0x000000, 0.1);
        btnG.fillCircle(bx + 2, btnY + 2, btnR);
        btnG.fillStyle(stageColor, 1);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(2, 0xFFFFFF, 0.8);
        btnG.strokeCircle(bx, btnY, btnR);
        // 안쪽 하이라이트
        btnG.fillStyle(0xFFFFFF, 0.25);
        btnG.fillCircle(bx - 3, btnY - 3, btnR * 0.4);

        // 현재 플레이할 스테이지 위치 기록 (첫 번째 미클리어 해제 스테이지)
        if (!this._currentStagePos) {
          this._currentStagePos = { x: bx, y: btnY };
        }
      } else {
        // 잠금: 어두운 회색 원
        btnG.fillStyle(0x999999, 0.5);
        btnG.fillCircle(bx, btnY, btnR);
        btnG.lineStyle(1.5, 0x777777, 0.5);
        btnG.strokeCircle(bx, btnY, btnR);
      }
      this.scrollContainer.add(btnG);

      // 버튼 안 텍스트/아이콘
      if (isCleared) {
        // 클리어한 스테이지: 체크마크
        const checkText = this.add.text(bx, btnY - 1, '\u2713', {
          fontFamily: 'Jua, sans-serif',
          fontSize: `${btnR * 1.2}px`,
          color: '#FFFFFF',
          stroke: '#8B6914',
          strokeThickness: 1,
        }).setOrigin(0.5);
        this.scrollContainer.add(checkText);
      } else if (isUnlocked) {
        // 열린 스테이지: 흰색 숫자
        const numText = this.add.text(bx, btnY, `${stageInWorld}`, {
          fontFamily: 'Jua, sans-serif',
          fontSize: `${btnR * 1.0}px`,
          color: '#FFFFFF',
          stroke: '#00000033',
          strokeThickness: 1,
        }).setOrigin(0.5);
        this.scrollContainer.add(numText);
      } else {
        // 잠금: 자물쇠 텍스트
        const lockText = this.add.text(bx, btnY, '\uD83D\uDD12', {
          fontSize: `${btnR * 0.8}px`,
        }).setOrigin(0.5);
        this.scrollContainer.add(lockText);
      }

      // 별 표시 (클리어한 스테이지, 버튼 아래)
      if (isCleared && bestStar > 0) {
        const starStr = '\u2B50'.repeat(bestStar);
        const starText = this.add.text(bx, btnY + btnR + 6, starStr, {
          fontSize: '8px',
        }).setOrigin(0.5);
        this.scrollContainer.add(starText);
      }

      // 터치 영역 (잠금 안 된 스테이지만)
      if (isUnlocked) {
        const hitArea = this.add.rectangle(bx, btnY, btnR * 2.8, btnR * 2.8, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        this.scrollContainer.add(hitArea);

        // pointerup에서 드래그 여부를 확인한 후 클릭 처리
        // (드래그 스크롤과 클릭 충돌 방지)
        hitArea.on('pointerup', () => {
          // 드래그 중이었으면 클릭 무시
          if (this._wasDragging) return;

          soundGenerator.playSelect();

          // 선택 시 확대 + 반짝이 효과
          this.tweens.add({
            targets: btnG,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 120,
            yoyo: true,
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

    // 스테이지 버튼 사이 연결선 (작은 점선)
    const lineG = this.add.graphics();
    lineG.lineStyle(1.5, colors.border, 0.4);
    for (let si = 0; si < stageIds.length - 1; si++) {
      const x1 = cardX + btnSpacing * (si + 1) + btnR + 2;
      const x2 = cardX + btnSpacing * (si + 2) - btnR - 2;
      // 점선 그리기
      const dashLen = 4;
      const gapLen = 3;
      let cx = x1;
      while (cx < x2) {
        const endX = Math.min(cx + dashLen, x2);
        lineG.lineBetween(cx, btnY, endX, btnY);
        cx = endX + gapLen;
      }
    }
    this.scrollContainer.add(lineG);
  }

  /**
   * 월드 카드 사이에 점선 경로 그리기 (모험 경로 느낌)
   */
  _drawPathBetweenCards(centerX, fromY, toY, isLocked) {
    const pathG = this.add.graphics();
    const color = isLocked ? 0xBBBBBB : 0xC8A882;
    const alpha = isLocked ? 0.3 : 0.6;
    pathG.lineStyle(2, color, alpha);

    // 세로 점선
    const dashLen = 4;
    const gapLen = 4;
    let cy = fromY + 2;
    while (cy < toY - 2) {
      const endY = Math.min(cy + dashLen, toY - 2);
      pathG.lineBetween(centerX, cy, centerX, endY);
      cy = endY + gapLen;
    }

    // 화살표 삼각형
    if (!isLocked) {
      pathG.fillStyle(color, alpha);
      const arrowY = toY - 2;
      pathG.fillTriangle(
        centerX, arrowY,
        centerX - 5, arrowY - 8,
        centerX + 5, arrowY - 8
      );
    }

    this.scrollContainer.add(pathG);
  }

  /**
   * 하단 고정 버튼 영역 (스크롤에 영향 안 받음)
   */
  _createBottomButtons(width, height) {
    // 하단 영역 배경 (양피지보다 약간 진한 색)
    const bottomBg = this.add.graphics();
    bottomBg.fillStyle(0xE8D8C0, 0.95);
    bottomBg.fillRect(0, height - height * 0.12, width, height * 0.12);
    bottomBg.lineStyle(1.5, 0xC8A882, 0.5);
    bottomBg.lineBetween(10, height - height * 0.12, width - 10, height - height * 0.12);
    bottomBg.setDepth(50);

    const btnY = height - height * 0.06;
    const btnW = Math.min(width * 0.28, 110);
    const btnH = Math.min(height * 0.06, 42);
    const gap = Math.min(width * 0.02, 10);

    // 3개 버튼 균등 배치: 공룡 바꾸기 | 난이도 변경 | 처음부터
    const totalW = btnW * 3 + gap * 2;
    const startX = (width - totalW) / 2 + btnW / 2;

    // "공룡 바꾸기" 버튼
    this._createPrettyButton(
      startX, btnY,
      '공룡 바꾸기', btnW, btnH,
      0x9B72CF,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('SelectScene');
        });
      }
    );

    // "난이도 변경" 버튼
    this._createPrettyButton(
      startX + btnW + gap, btnY,
      '난이도 변경', btnW, btnH,
      0x4EAEFF,
      () => {
        soundGenerator.playSelect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('DifficultyScene');
        });
      }
    );

    // "처음부터" 버튼
    this._createPrettyButton(
      startX + (btnW + gap) * 2, btnY,
      '처음부터', btnW, btnH,
      0xE55B5B,
      () => {
        soundGenerator.playSelect();
        this._showResetConfirm(width, height);
      }
    );
  }

  /**
   * "처음부터" 확인 다이얼로그
   * 실수로 누르는 것을 방지하기 위해 확인 메시지 표시
   */
  _showResetConfirm(width, height) {
    // 반투명 오버레이
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    // 다이얼로그 박스
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

    // 메시지
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

    // "네" 버튼
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

    // "아니오" 버튼
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
      // 다이얼로그 닫기
      overlay.destroy();
      dlgBg.destroy();
      msg.destroy();
      subMsg.destroy();
      yesBg.destroy();
      yesText.destroy();
      yesHit.destroy();
      noBg.destroy();
      noText.destroy();
      noHit.destroy();
    });
  }

  /**
   * 예쁜 라운드 버튼 (그림자 + 호버 효과)
   */
  _createPrettyButton(x, y, label, btnW, btnH, color, callback) {
    // 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.15);
    shadow.fillRoundedRect(x - btnW / 2 + 2, y - btnH / 2 + 2, btnW, btnH, btnH / 2);
    shadow.setDepth(51);

    // 버튼 배경
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);
    // 상단 하이라이트
    bg.fillStyle(0xFFFFFF, 0.2);
    bg.fillRoundedRect(x - btnW / 2 + 4, y - btnH / 2 + 2, btnW - 8, btnH * 0.4, btnH / 3);
    bg.setDepth(52);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '15px',
      color: '#FFFFFF',
      stroke: '#00000033',
      strokeThickness: 1,
    }).setOrigin(0.5).setDepth(53);

    const hitArea = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true }).setDepth(54);

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, shadow, text],
        scaleX: 0.93,
        scaleY: 0.93,
        duration: 80,
        yoyo: true,
        onComplete: callback,
      });
    });

    // 호버 효과 (데스크탑)
    hitArea.on('pointerover', () => {
      bg.setAlpha(0.85);
    });
    hitArea.on('pointerout', () => {
      bg.setAlpha(1);
    });
  }

  /**
   * 스크롤 입력 설정 (드래그로 세로 스크롤)
   */
  _setupScroll(screenH) {
    // 드래그/클릭 구분용 변수 (스크롤이 없어도 초기화)
    this._wasDragging = false;
    this._pointerStartX = 0;
    this._pointerStartY = 0;

    if (this.maxScrollY <= 0) return; // 스크롤 필요 없으면 스크롤 설정 안 함

    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartScrollY = 0;

    this.input.on('pointerdown', (pointer) => {
      // 드래그 판별을 위해 시작 위치 기록
      this._pointerStartX = pointer.x;
      this._pointerStartY = pointer.y;
      this._wasDragging = false;

      // 하단 버튼 영역은 스크롤 무시
      if (pointer.y > screenH * 0.88) return;
      this.isDragging = true;
      this.dragStartY = pointer.y;
      this.dragStartScrollY = this.scrollY;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.isDragging) return;
      const dy = this.dragStartY - pointer.y;

      // 이동 거리가 5px 이상이면 드래그로 판정
      const totalDist = Math.abs(pointer.x - this._pointerStartX) + Math.abs(pointer.y - this._pointerStartY);
      if (totalDist >= 5) {
        this._wasDragging = true;
      }

      this.scrollY = Phaser.Math.Clamp(
        this.dragStartScrollY + dy,
        0,
        this.maxScrollY
      );
      this.scrollContainer.y = -this.scrollY;
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  /**
   * 월드가 해제되었는지 (월드의 첫 스테이지가 해제되었는지)
   */
  _isWorldUnlocked(worldId) {
    // 첫 번째 월드는 항상 열림
    if (worldId === 1) return true;
    // 이전 월드 마지막 스테이지가 클리어되어야 열림
    const prevWorldLastStage = (worldId - 1) * 5;
    return this.progress.clearedStages.includes(prevWorldLastStage);
  }

  /**
   * 스테이지 잠금 해제 여부
   */
  _isStageUnlocked(stageId) {
    if (stageId === 1) return true;
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

  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
