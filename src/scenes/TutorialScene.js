/**
 * TutorialScene.js - 튜토리얼 (조작 안내) 화면
 * 첫 플레이 시에만 표시되는 3장 슬라이드 방식 안내
 *
 * 슬라이드 순서:
 * 1. "터치/스페이스 → 점프!" (기본 점프 설명)
 * 2. "길게 누르면 높이! 공중에서 한번 더!" (높은 점프 + 2단 점프)
 * 3. "↓키/아래 스와이프 → 슬라이드!" (슬라이드 설명)
 *
 * 완료 시 localStorage에 'ruvin_tutorial_done' 저장하여 다시 안 보여줌
 */

import Phaser from 'phaser';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super('TutorialScene');
  }

  create() {
    const { width, height } = this.scale;

    // 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // 현재 슬라이드 인덱스
    this.slideIndex = 0;

    // 슬라이드 데이터 (3장)
    this.slides = [
      {
        title: '낮은 점프!',
        desc: '왼쪽을 터치하거나\nZ키를 누르면\n살짝 점프해요!',
        icon: 'jump',       // 그리기 타입
        color: '#66CC77',
      },
      {
        title: '높은 점프!',
        desc: '오른쪽을 터치하거나\nX키/스페이스를 누르면\n높이 뛰어요!\n공중에서 한번 더 = 2단 점프!',
        icon: 'highJump',
        color: '#4EAEFF',
      },
      {
        title: '슬라이드!',
        desc: '↓키 또는 아래로 스와이프\n하면 납작하게 슬라이드!',
        icon: 'slide',
        color: '#FF8C42',
      },
    ];

    // === 배경: 반투명 검정 오버레이 ===
    this.bgOverlay = this.add.graphics();
    this.bgOverlay.fillStyle(0x000000, 0.75);
    this.bgOverlay.fillRect(0, 0, width, height);

    // === 슬라이드 컨테이너 (중앙 카드) ===
    this.slideContainer = this.add.container(width / 2, height * 0.4);

    // 카드 배경 (흰색 둥근 사각형)
    const cardW = Math.min(width * 0.85, 300);
    const cardH = Math.min(height * 0.55, 350);
    this.cardW = cardW;
    this.cardH = cardH;

    this.cardBg = this.add.graphics();
    this.cardBg.fillStyle(0xFFFFFF, 0.95);
    this.cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    this.slideContainer.add(this.cardBg);

    // === 상단: "조작 안내" 타이틀 ===
    this.add.text(width / 2, height * 0.08, '조작 안내', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // === 페이지 인디케이터 (1/3, 2/3, 3/3) ===
    this.pageText = this.add.text(width / 2, height * 0.14, '1 / 3', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(10);

    // === 슬라이드 내용 표시 영역 ===
    // 아이콘 영역 (그래픽으로 그림)
    this.iconGraphics = this.add.graphics();
    this.iconGraphics.setDepth(10);

    // 제목 텍스트
    this.titleText = this.add.text(width / 2, height * 0.52, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '32px',
      color: '#333333',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // 설명 텍스트
    this.descText = this.add.text(width / 2, height * 0.62, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#666666',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5).setDepth(10);

    // === 하단 버튼 ===
    this.nextBtnBg = this.add.graphics().setDepth(10);
    this.nextBtnText = this.add.text(width / 2, height * 0.80, '다음', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(10);

    const btnHit = this.add.rectangle(width / 2, height * 0.80, 160, 50, 0x000000, 0);
    btnHit.setInteractive({ useHandCursor: true }).setDepth(11);
    btnHit.on('pointerdown', () => this._nextSlide());

    // 터치해서도 넘어갈 수 있도록 전체 영역에 포인터 이벤트 추가
    // (하단 버튼 외에도 아무 곳이나 터치하면 다음으로)
    this.input.on('pointerdown', (pointer) => {
      // 버튼 영역이 아닌 곳을 터치하면 다음 슬라이드
      if (pointer.y < height * 0.75) {
        this._nextSlide();
      }
    });

    // 키보드(스페이스)로도 넘어갈 수 있게
    this.input.keyboard.on('keydown-SPACE', () => this._nextSlide());

    // 건너뛰기 버튼 (우상단)
    const skipText = this.add.text(width - 15, 15, '건너뛰기', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#AAAAAA',
    }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true });
    skipText.on('pointerdown', () => this._finish());

    // 첫 번째 슬라이드 표시
    this._showSlide(0);
  }

  /**
   * 현재 슬라이드 인덱스의 내용을 표시
   * @param {number} index - 슬라이드 인덱스 (0~2)
   */
  _showSlide(index) {
    const { width, height } = this.scale;
    const slide = this.slides[index];

    // 페이지 인디케이터 갱신
    this.pageText.setText(`${index + 1} / 3`);

    // 제목 + 설명 갱신
    this.titleText.setText(slide.title);
    this.titleText.setColor(slide.color);
    this.descText.setText(slide.desc);

    // 아이콘 그리기 (이전 것 지우고 새로 그림)
    this.iconGraphics.clear();
    this._drawIcon(width / 2, height * 0.35, slide.icon, slide.color);

    // 버튼 텍스트 (마지막이면 "시작!")
    const isLast = index === this.slides.length - 1;
    this.nextBtnText.setText(isLast ? '시작!' : '다음');

    // 버튼 색상 갱신
    const btnColor = isLast ? 0xFFCC00 : 0x66CC77;
    this.nextBtnBg.clear();
    this.nextBtnBg.fillStyle(btnColor, 1);
    this.nextBtnBg.fillRoundedRect(width / 2 - 80, height * 0.80 - 25, 160, 50, 25);

    // 슬라이드 전환 애니메이션 (살짝 바운스)
    this.titleText.setScale(0.8);
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }

  /**
   * 다음 슬라이드로 이동 또는 완료
   */
  _nextSlide() {
    soundGenerator.playSelect();
    this.slideIndex++;

    if (this.slideIndex >= this.slides.length) {
      // 모든 슬라이드 완료 → 게임 시작
      this._finish();
    } else {
      this._showSlide(this.slideIndex);
    }
  }

  /**
   * 튜토리얼 완료: localStorage에 저장 후 GameScene으로 이동
   */
  _finish() {
    // 튜토리얼 완료 플래그 저장 (다음부터 건너뜀)
    localStorage.setItem('ruvin_tutorial_done', 'true');

    // 페이드아웃 후 게임 시작
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  /**
   * 슬라이드 아이콘 그리기 (그래픽으로 간단한 그림)
   * @param {number} cx - 중심 x
   * @param {number} cy - 중심 y
   * @param {string} type - 아이콘 종류 ('jump', 'highJump', 'slide')
   * @param {string} colorHex - 테마 색상 (#rrggbb)
   */
  _drawIcon(cx, cy, type, colorHex) {
    const g = this.iconGraphics;
    const color = parseInt(colorHex.replace('#', ''), 16);

    if (type === 'jump') {
      // 공룡 실루엣 (작은 사각형) + 위쪽 화살표
      g.fillStyle(color, 0.8);
      g.fillRoundedRect(cx - 20, cy - 10, 40, 40, 8); // 공룡 몸통
      g.fillStyle(color, 0.6);
      g.fillCircle(cx + 10, cy - 15, 10); // 머리

      // 위쪽 화살표 (점프 방향)
      g.lineStyle(4, color, 1);
      g.lineBetween(cx, cy - 30, cx, cy - 60);
      // 화살표 머리
      g.lineBetween(cx - 10, cy - 50, cx, cy - 60);
      g.lineBetween(cx + 10, cy - 50, cx, cy - 60);

      // "터치!" 또는 손가락 아이콘 (원으로 대체)
      g.lineStyle(2, 0x999999, 0.5);
      g.strokeCircle(cx, cy + 40, 15);
      g.fillStyle(0x999999, 0.3);
      g.fillCircle(cx, cy + 40, 15);

    } else if (type === 'highJump') {
      // 공룡 더 높이 + 2단 점프 표시
      g.fillStyle(color, 0.8);
      g.fillRoundedRect(cx - 20, cy - 25, 40, 40, 8);
      g.fillStyle(color, 0.6);
      g.fillCircle(cx + 10, cy - 30, 10);

      // 긴 위쪽 화살표 (높은 점프)
      g.lineStyle(4, color, 1);
      g.lineBetween(cx, cy - 45, cx, cy - 85);
      g.lineBetween(cx - 10, cy - 75, cx, cy - 85);
      g.lineBetween(cx + 10, cy - 75, cx, cy - 85);

      // 2단 점프 표시 (작은 화살표 옆에)
      g.lineStyle(3, 0xFF6B6B, 0.8);
      g.lineBetween(cx + 30, cy - 50, cx + 30, cy - 70);
      g.lineBetween(cx + 24, cy - 64, cx + 30, cy - 70);
      g.lineBetween(cx + 36, cy - 64, cx + 30, cy - 70);

      // "x2" 텍스트 대신 두 번째 화살표로 표현
      g.fillStyle(0xFF6B6B, 0.6);
      g.fillCircle(cx + 30, cy - 42, 8);

    } else if (type === 'slide') {
      // 납작해진 공룡 (가로로 긴 형태) + 아래쪽 화살표
      g.fillStyle(color, 0.8);
      g.fillRoundedRect(cx - 30, cy + 5, 60, 20, 6); // 납작한 몸통
      g.fillStyle(color, 0.6);
      g.fillCircle(cx + 25, cy + 2, 8); // 머리 (앞쪽)

      // 아래쪽 화살표 (슬라이드 방향)
      g.lineStyle(4, color, 1);
      g.lineBetween(cx, cy - 30, cx, cy - 5);
      g.lineBetween(cx - 10, cy - 15, cx, cy - 5);
      g.lineBetween(cx + 10, cy - 15, cx, cy - 5);

      // 바닥선 (슬라이딩 느낌)
      g.lineStyle(2, 0x999999, 0.4);
      g.lineBetween(cx - 40, cy + 25, cx + 40, cy + 25);
      // 먼지 효과 (작은 원들)
      g.fillStyle(0xCCBBAA, 0.5);
      g.fillCircle(cx - 35, cy + 20, 3);
      g.fillCircle(cx - 42, cy + 18, 2);
      g.fillCircle(cx - 38, cy + 14, 2);
    }
  }

  shutdown() {
    this.input.keyboard.off('keydown-SPACE');
  }
}
