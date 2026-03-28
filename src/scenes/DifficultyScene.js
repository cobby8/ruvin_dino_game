/**
 * DifficultyScene.js - 난이도 선택 화면
 * 5단계 난이도 중 하나를 골라 게임 시작
 *
 * [개선] 성장 단계 시각적 차별화 (크기 차이 + 색상 강조)
 * - 난이도가 높을수록 카드가 크고 진하게
 * - 설명 텍스트 크기 증가 + 스트로크 추가
 * - 선택 시 금테두리 + 글로우 효과
 */

import Phaser from 'phaser';
import { DIFFICULTIES } from '../data/difficulties.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

// 각 난이도별 성장 단계 설명 (6살도 이해 가능)
const GROWTH_DESC = [
  '알에서 막 나왔어요!',        // 아기공룡
  '조금 자랐어요!',             // 꼬마공룡
  '이제 멋진 공룡이에요!',       // 씩씩한공룡
  '아주 강해졌어요!',           // 용감한공룡
  '전설이 되었어요!',           // 전설의공룡
];

// 난이도별 카드 스케일 계수 (성장 단계 느낌)
const CARD_SCALE = [0.85, 0.90, 1.0, 1.05, 1.1];

export class DifficultyScene extends Phaser.Scene {
  constructor() {
    super('DifficultyScene');
  }

  create() {
    const { width, height } = this.scale;
    this.selectedIndex = null; // 선택된 난이도 인덱스
    this.cards = [];           // 카드 컨테이너 배열

    // 화면 전환 효과: 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

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
   * 난이도가 올라갈수록 카드가 살짝 커지는 "성장 단계" 시각효과
   */
  _createCards(width, height) {
    // 카드 영역: 상단(12%) ~ 하단(84%) 사이에 5개 배치
    const areaTop = height * 0.12;
    const areaBottom = height * 0.84;
    const areaHeight = areaBottom - areaTop;

    // 기본 카드 크기 계산
    const baseCardW = Math.min(width * 0.85, 320);
    const baseCardH = Math.min(areaHeight / 5.5, 70);
    const gap = (areaHeight - baseCardH * 5) / 4;

    DIFFICULTIES.forEach((diff, i) => {
      // 난이도별 스케일 적용 (높은 난이도일수록 카드가 커짐)
      const scale = CARD_SCALE[i];
      const cardW = baseCardW * scale;
      const cardH = baseCardH * scale;

      // 각 카드의 중심 좌표
      const cy = areaTop + baseCardH / 2 + i * (baseCardH + gap);
      const cx = width / 2;

      // 카드 컨테이너
      const container = this.add.container(cx, cy);

      // --- 카드 색상 파싱 ---
      const colorNum = parseInt(diff.color.replace('#', ''), 16);
      const borderNum = parseInt(diff.borderColor.replace('#', ''), 16);

      // --- 카드 그림자 (입체감) ---
      const cardShadow = this.add.graphics();
      cardShadow.fillStyle(0x000000, 0.1 + i * 0.02); // 높은 난이도일수록 그림자 진하게
      cardShadow.fillRoundedRect(-cardW / 2 + 3, -cardH / 2 + 3, cardW, cardH, 16);
      container.add(cardShadow);

      // --- 카드 배경 (라운드 사각형) ---
      const cardBg = this.add.graphics();
      cardBg.fillStyle(colorNum, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      cardBg.lineStyle(3, borderNum, 1);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      container.add(cardBg);

      // --- 왼쪽: 이모지를 크게 표시 (성장 단계 아이콘) ---
      const emojiSize = 20 + i * 4; // 난이도가 높을수록 이모지도 커짐
      const emojiText = this.add.text(-cardW / 2 + 25, 0, diff.emoji, {
        fontSize: `${emojiSize}px`,
      }).setOrigin(0.5);
      container.add(emojiText);

      // --- 중앙: 이름 (크고 굵게, 스트로크 추가) ---
      const nameFontSize = 18 + i * 2; // 난이도별로 폰트 크기 점진적 증가
      const nameText = this.add.text(10, -cardH * 0.18, diff.name, {
        fontFamily: 'Jua, sans-serif',
        fontSize: `${nameFontSize}px`,
        color: '#333333',
        stroke: '#FFFFFF',
        strokeThickness: 2,
      }).setOrigin(0.5);
      container.add(nameText);

      // --- 별 표시 (이름 오른쪽에 수평 배치) ---
      const starsStr = '\u2B50'.repeat(diff.stars);
      const starsText = this.add.text(cardW / 2 - 20, -cardH * 0.18, starsStr, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '14px',
      }).setOrigin(1, 0.5);
      container.add(starsText);

      // --- 하단: 설명 + 성장 단계 설명 (더 크고 읽기 쉽게) ---
      const descFontSize = 13 + Math.floor(i * 0.5);
      const descText = this.add.text(10, cardH * 0.22, `${diff.description}  -  ${GROWTH_DESC[i]}`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: `${descFontSize}px`,
        color: '#666666',
        stroke: '#FFFFFF',
        strokeThickness: 1,
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

      // 호버 효과: 살짝 커지고 테두리 반짝
      hitArea.on('pointerover', () => {
        if (this.selectedIndex !== i) {
          this.tweens.add({
            targets: container,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 150,
            ease: 'Sine.easeOut',
          });
        }
      });
      hitArea.on('pointerout', () => {
        if (this.selectedIndex !== i) {
          this.tweens.add({
            targets: container,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Sine.easeOut',
          });
        }
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
   * - 선택 카드: 금테두리 + 확대 + 밝기 반짝
   * - 나머지: 축소 + 반투명
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
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 200,
          ease: 'Back.easeOut',
        });
        card.container.setAlpha(1);

        // 금색 두꺼운 테두리 + 글로우 효과
        card.cardBg.clear();
        card.cardBg.fillStyle(card.colorNum, 1);
        card.cardBg.fillRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
        // 바깥쪽 글로우 (연한 금색 테두리)
        card.cardBg.lineStyle(6, 0xFFD700, 0.4);
        card.cardBg.strokeRoundedRect(-card.cardW / 2 - 2, -card.cardH / 2 - 2, card.cardW + 4, card.cardH + 4, 18);
        // 안쪽 금색 테두리
        card.cardBg.lineStyle(4, 0xFFD700, 1);
        card.cardBg.strokeRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);

        // 반짝 트윈
        this.tweens.add({
          targets: card.cardBg,
          alpha: 0.7,
          duration: 150,
          yoyo: true,
          repeat: 1,
        });
      } else {
        // 비선택 카드: 축소 + 반투명 + 원래 테두리
        this.tweens.add({
          targets: card.container,
          scaleX: 0.9,
          scaleY: 0.9,
          duration: 200,
          ease: 'Sine.easeOut',
        });
        card.container.setAlpha(0.45);

        // 원래 색상 테두리 복원
        card.cardBg.clear();
        card.cardBg.fillStyle(card.colorNum, 0.95);
        card.cardBg.fillRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
        card.cardBg.lineStyle(3, card.borderNum, 1);
        card.cardBg.strokeRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
      }
    });

    // "출발!" 버튼 활성화
    this._activateButton();
  }

  /** "출발!" 버튼 생성 */
  _createStartButton(width, height) {
    const btnY = height * 0.92;
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

        // 페이드아웃 후 다음 씬으로 전환
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          const progress = this._loadProgress();

          // 튜토리얼 미완료 시 -> TutorialScene 먼저
          const tutorialDone = localStorage.getItem('ruvin_tutorial_done');
          if (!tutorialDone) {
            this.registry.set('currentStage', 1);
            this.scene.start('TutorialScene');
            return;
          }

          if (progress.clearedStages.length > 0) {
            // 이어하기: 월드맵에서 스테이지 선택
            this.scene.start('WorldMapScene');
          } else {
            // 첫 플레이: 스테이지 1로 바로 시작
            this.registry.set('currentStage', 1);
            this.scene.start('GameScene');
          }
        });
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

  /**
   * localStorage에서 진행도 불러오기
   */
  _loadProgress() {
    try {
      const data = JSON.parse(localStorage.getItem('ruvin_dino_progress'));
      if (data && data.clearedStages) {
        return { clearedStages: data.clearedStages };
      }
    } catch {
      // 파싱 실패
    }
    return { clearedStages: [] };
  }

  /** 화면 크기 변경 대응 */
  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
