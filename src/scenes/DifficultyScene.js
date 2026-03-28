/**
 * DifficultyScene.js - 난이도 선택 화면
 * 5단계 난이도 중 하나를 골라 게임 시작
 *
 * 화면 구성:
 * - 상단: "얼마나 용감할까?" 제목
 * - 중앙: 5개 카드 세로 나열 (별 + 이름 + 설명)
 * - 하단: "출발!" 버튼
 *
 * 각 카드는 파스텔 색상의 라운드 사각형
 * 터치/클릭으로 선택하면 확대 + 반짝, 나머지는 축소 + 반투명
 */

import Phaser from 'phaser';
import { DIFFICULTIES } from '../data/difficulties.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class DifficultyScene extends Phaser.Scene {
  constructor() {
    super('DifficultyScene');
  }

  create() {
    const { width, height } = this.scale;
    this.selectedIndex = null; // 선택된 난이도 인덱스
    this.cards = [];           // 카드 컨테이너 배열

    // === 배경 (연보라 파스텔 그라디언트) ===
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xE8D5F5, 0xE8D5F5, 0xD4A5FF, 0xD4A5FF, 1);
    bg.fillRect(0, 0, width, height);

    // === 상단 타이틀 ===
    this.add.text(width / 2, height * 0.06, '얼마나 용감할까?', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#7B4FA2',
      stroke: '#FFFFFF',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // === 5개 난이도 카드 생성 ===
    this._createCards(width, height);

    // === 하단 "출발!" 버튼 ===
    this._createStartButton(width, height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 5개 난이도 카드를 세로로 나열
   * 화면 높이에 맞춰 반응형으로 카드 크기/간격 계산
   */
  _createCards(width, height) {
    // 카드 영역: 상단(10%) ~ 하단(85%) 사이에 5개 배치
    const areaTop = height * 0.13;
    const areaBottom = height * 0.82;
    const areaHeight = areaBottom - areaTop;

    // 카드 크기 계산 (화면에 맞게 반응형)
    const cardW = Math.min(width * 0.85, 320);  // 최대 320px
    const cardH = Math.min(areaHeight / 5.5, 65); // 5개 + 간격 고려
    const gap = (areaHeight - cardH * 5) / 4;   // 카드 사이 간격

    DIFFICULTIES.forEach((diff, i) => {
      // 각 카드의 중심 Y 좌표
      const cy = areaTop + cardH / 2 + i * (cardH + gap);
      const cx = width / 2;

      // 카드 컨테이너 (배경 + 텍스트들을 한 묶음으로)
      const container = this.add.container(cx, cy);

      // --- 카드 배경 (라운드 사각형) ---
      const cardBg = this.add.graphics();
      const colorNum = parseInt(diff.color.replace('#', ''), 16); // hex → 숫자
      const borderNum = parseInt(diff.borderColor.replace('#', ''), 16);
      cardBg.fillStyle(colorNum, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      cardBg.lineStyle(3, borderNum, 1);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      container.add(cardBg);

      // --- 왼쪽: 별 표시 (난이도 시각화) ---
      const starsStr = '⭐'.repeat(diff.stars);
      const starsText = this.add.text(-cardW / 2 + 15, -8, starsStr, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
      }).setOrigin(0, 0.5);
      container.add(starsText);

      // --- 중앙: 이모지 + 이름 ---
      const nameText = this.add.text(0, -cardH * 0.15, `${diff.emoji} ${diff.name}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '20px',
        color: '#333333',
      }).setOrigin(0.5);
      container.add(nameText);

      // --- 하단: 설명 텍스트 ---
      const descText = this.add.text(0, cardH * 0.25, diff.description, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '13px',
        color: '#666666',
      }).setOrigin(0.5);
      container.add(descText);

      // --- 터치 영역 (투명 히트 박스) ---
      const hitArea = this.add.rectangle(0, 0, cardW, cardH, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      // 터치/클릭 이벤트
      hitArea.on('pointerdown', () => {
        this._selectDifficulty(i);
      });

      // 카드 정보 저장
      this.cards.push({
        container,
        cardBg,
        index: i,
        cardW,
        cardH,
        colorNum,
        borderNum,
      });
    });
  }

  /**
   * 난이도 선택 시 호출
   * - 선택 카드 확대(1.1) + 테두리 반짝
   * - 나머지 축소(0.9) + 반투명
   */
  _selectDifficulty(index) {
    soundGenerator.init();
    soundGenerator.playSelect();

    this.selectedIndex = index;

    this.cards.forEach((card, i) => {
      if (i === index) {
        // 선택된 카드: 확대 + 완전 불투명
        this.tweens.add({
          targets: card.container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Back.easeOut',
        });
        card.container.setAlpha(1);

        // 테두리 반짝 효과 (트윈으로 밝기 변화)
        this.tweens.add({
          targets: card.cardBg,
          alpha: 0.7,
          duration: 150,
          yoyo: true,
          repeat: 1,
        });
      } else {
        // 비선택 카드: 축소 + 반투명
        this.tweens.add({
          targets: card.container,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 200,
          ease: 'Sine.easeOut',
        });
        card.container.setAlpha(0.5);
      }
    });

    // "출발!" 버튼 활성화
    this._activateButton();
  }

  /** "출발!" 버튼 생성 */
  _createStartButton(width, height) {
    const btnY = height * 0.91;
    const btnW = 160;
    const btnH = 50;

    // 버튼 배경 (처음엔 회색 = 비활성)
    this.btnBg = this.add.graphics();
    this.btnBg.fillStyle(0xAAAAAA, 1);
    this.btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);
    this.btnBg.setPosition(width / 2, btnY);

    // 버튼 텍스트
    this.btnText = this.add.text(width / 2, btnY, '출발!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // 터치 영역
    this.btnHit = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x000000, 0);
    this.btnHit.setInteractive({ useHandCursor: true });
    this.btnHit.setDepth(10);

    this.btnHit.on('pointerdown', () => {
      if (this.selectedIndex !== null) {
        // 선택한 난이도를 글로벌 레지스트리에 저장
        const selectedDifficulty = DIFFICULTIES[this.selectedIndex];
        this.registry.set('selectedDifficulty', selectedDifficulty);

        soundGenerator.playSelect();

        // 게임 씬으로 출발!
        this.scene.start('GameScene');
      }
    });
  }

  /** 버튼을 초록색 활성 상태로 변경 */
  _activateButton() {
    const btnW = 160;
    const btnH = 50;

    this.btnBg.clear();
    this.btnBg.fillStyle(0x66CC77, 1); // 초록색 = 활성
    this.btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 25);

    // 버튼 바운스 애니메이션
    this.tweens.add({
      targets: [this.btnBg, this.btnText, this.btnHit],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  /** 화면 크기 변경 대응 */
  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
