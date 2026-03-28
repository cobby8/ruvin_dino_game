/**
 * SelectScene.js - 2층: 접수처 (공룡 선택 화면)
 * 4마리 공룡 카드 중 하나를 선택하고 "모험 시작!" 버튼으로 게임 진입
 *
 * [개선] 카드 선택 시 가운데 미리보기 애니메이션 + 능력 설명 강화 + 한 줄 설명
 */

import Phaser from 'phaser';
import { DINOS } from '../config.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

// 각 공룡별 한 줄 쉬운 설명 (6살도 이해 가능)
const DINO_EASY_DESC = {
  brachio: '이 공룡은 높이 뛸 수 있어요!',
  trex: '이 공룡은 밟으면 점수가 팡팡!',
  tricera: '이 공룡은 방패가 있어서 든든해요!',
  ptera: '이 공룡은 하늘을 날 수 있어요!',
};

export class SelectScene extends Phaser.Scene {
  constructor() {
    super('SelectScene');
  }

  create() {
    const { width, height } = this.scale;
    this.selectedDino = null; // 선택된 공룡 인덱스
    this.cards = [];          // 공룡 카드 컨테이너 배열

    // 화면 전환 효과: 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // === 배경 그라디언트 (하늘색 -> 연보라) ===
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xD4A5FF, 0xD4A5FF, 1);
    bg.fillRect(0, 0, width, height);

    // === 타이틀 텍스트 ===
    this.add.text(width / 2, height * 0.05, '루빈이의', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.11, '공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '36px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // === "친구를 골라줘!" 안내 텍스트 ===
    this.add.text(width / 2, height * 0.18, '친구를 골라줘!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#555555',
      stroke: '#FFFFFF',
      strokeThickness: 1,
    }).setOrigin(0.5);

    // === 공룡 카드 4장 배치 (2x2 그리드) ===
    this._createCards(width, height);

    // === 미리보기 영역 (선택 시 가운데에 달리기 애니메이션 표시) ===
    this._createPreviewArea(width, height);

    // === "모험 시작!" 버튼 (공룡 선택 전에는 회색) ===
    this._createStartButton(width, height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);

    // 첫 번째 공룡(브라키오)을 기본 선택 - 6살이 버튼 회색 상태에서 혼란하지 않도록
    this._selectDino(0);
  }

  /** 공룡 카드 4장 생성 - 상단에 배치, 좀 더 작게 */
  _createCards(width, height) {
    // 2x2 그리드 레이아웃 (상단 영역에 배치)
    const cardW = Math.min(width * 0.32, 110);
    const cardH = cardW * 1.2;
    const gapX = width * 0.06;
    const gapY = height * 0.02;
    const startY = height * 0.24;

    DINOS.forEach((dino, i) => {
      // 2x2 그리드 위치 계산
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = width / 2 + (col === 0 ? -(cardW / 2 + gapX / 2) : (cardW / 2 + gapX / 2));
      const cy = startY + row * (cardH + gapY) + cardH / 2;

      // 카드 컨테이너 (배경 + 공룡 + 이름을 묶음)
      const container = this.add.container(cx, cy);

      // 카드 그림자 (부드러운 그림자 효과)
      const cardShadow = this.add.graphics();
      cardShadow.fillStyle(0x000000, 0.12);
      cardShadow.fillRoundedRect(-cardW / 2 + 3, -cardH / 2 + 3, cardW, cardH, 16);
      container.add(cardShadow);

      // 카드 배경 (더 둥근 사각형 + 부드러운 테두리)
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0xFFFFFF, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      cardBg.lineStyle(3, dino.color, 1);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 16);
      container.add(cardBg);

      // 컬러 원 (공룡 아이콘 배경)
      const circle = this.add.graphics();
      circle.fillStyle(dino.color, 0.2);
      circle.fillCircle(0, -cardH * 0.1, cardW * 0.28);
      container.add(circle);

      // 공룡 스프라이트 (이미지 텍스처가 있으면 PNG 사용)
      const imgKey = `img_${dino.key}`;
      const useImage = this.textures.exists(imgKey);
      const spriteKey = useImage ? imgKey : dino.key;
      const sprite = this.add.sprite(0, -cardH * 0.1, spriteKey, 0);
      if (useImage) {
        sprite.setScale(Math.min(cardW / 580, 0.16));
      } else {
        sprite.setScale(Math.min(cardW / 110, 1.0));
      }
      sprite.play(`${dino.key}_run`);
      container.add(sprite);

      // 공룡 이름 (한글) - 굵게
      const nameText = this.add.text(0, cardH / 2 - 28, dino.name, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: dino.hex,
        stroke: '#FFFFFF',
        strokeThickness: 2,
      }).setOrigin(0.5);
      container.add(nameText);

      // 특수능력 이름 (카드 하단에 간결하게)
      if (dino.abilityName) {
        const abilityText = this.add.text(0, cardH / 2 - 10, dino.abilityName, {
          fontFamily: 'Jua, sans-serif',
          fontSize: '11px',
          color: '#888888',
          stroke: '#FFFFFF',
          strokeThickness: 1,
        }).setOrigin(0.5);
        container.add(abilityText);
      }

      // 터치 영역 설정 (투명한 히트 영역)
      const hitArea = this.add.rectangle(0, 0, cardW, cardH, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });
      container.add(hitArea);

      // 터치/클릭 이벤트
      hitArea.on('pointerdown', () => {
        this._selectDino(i);
      });

      // 호버 효과 (데스크탑): 살짝 커지는 트윈
      hitArea.on('pointerover', () => {
        if (this.selectedDino !== i) {
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
        if (this.selectedDino !== i) {
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
        cx, cy,
        cardW, cardH,
      });
    });
  }

  /** 미리보기 영역 생성 - 카드와 시작버튼 사이에 표시 */
  _createPreviewArea(width, height) {
    // 미리보기 영역 Y 위치 (카드 아래, 버튼 위)
    const previewY = height * 0.68;

    // 미리보기 배경 (반투명 라운드 박스)
    this.previewBg = this.add.graphics();
    this.previewBg.setAlpha(0); // 처음엔 숨김

    // 미리보기 공룡 스프라이트 (큰 크기)
    this.previewSprite = null;

    // 능력 설명 텍스트 (큰 글씨)
    this.previewAbilityText = this.add.text(width / 2, previewY + 40, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // 한 줄 쉬운 설명 텍스트
    this.previewEasyDesc = this.add.text(width / 2, previewY + 65, '', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '14px',
      color: '#FFE066',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    // 미리보기 Y 위치 저장
    this._previewY = previewY;
  }

  /** 공룡 선택 시 호출 - 미리보기 업데이트 포함 */
  _selectDino(index) {
    // 효과음 시스템 초기화 (첫 터치에서)
    soundGenerator.init();
    soundGenerator.playSelect();

    this.selectedDino = index;
    const dino = DINOS[index];
    const { width } = this.scale;

    // 모든 카드 크기 초기화 후 선택된 카드만 확대 + 금테두리
    this.cards.forEach((card, i) => {
      if (i === index) {
        // 선택된 카드: 확대 + 금색 테두리 반짝
        this.tweens.add({
          targets: card.container,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 200,
          ease: 'Back.easeOut',
        });
        card.container.setAlpha(1);

        // 금색 테두리로 강조 (기존 카드 배경 다시 그림)
        card.cardBg.clear();
        card.cardBg.fillStyle(0xFFFFFF, 0.95);
        card.cardBg.fillRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
        card.cardBg.lineStyle(4, 0xFFD700, 1); // 금색 두꺼운 테두리
        card.cardBg.strokeRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
      } else {
        // 비선택 카드: 축소 + 반투명 + 원래 테두리 복원
        this.tweens.add({
          targets: card.container,
          scaleX: 0.85,
          scaleY: 0.85,
          duration: 200,
          ease: 'Sine.easeOut',
        });
        card.container.setAlpha(0.5);

        // 원래 테두리 복원
        const d = DINOS[i];
        card.cardBg.clear();
        card.cardBg.fillStyle(0xFFFFFF, 0.95);
        card.cardBg.fillRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
        card.cardBg.lineStyle(3, d.color, 1);
        card.cardBg.strokeRoundedRect(-card.cardW / 2, -card.cardH / 2, card.cardW, card.cardH, 16);
      }
    });

    // === 미리보기 영역 업데이트 ===
    // 기존 미리보기 스프라이트 제거
    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    // 미리보기 배경 그리기 (반투명 어두운 라운드 박스)
    const previewW = width * 0.7;
    const previewH = 100;
    this.previewBg.clear();
    this.previewBg.fillStyle(0x000000, 0.3);
    this.previewBg.fillRoundedRect(
      width / 2 - previewW / 2, this._previewY - previewH / 2 + 10,
      previewW, previewH, 20
    );
    // 페이드인 효과
    this.tweens.add({
      targets: this.previewBg,
      alpha: 1,
      duration: 300,
    });

    // 큰 공룡 달리기 애니메이션 (미리보기)
    const imgKey = `img_${dino.key}`;
    const useImage = this.textures.exists(imgKey);
    const spriteKey = useImage ? imgKey : dino.key;
    this.previewSprite = this.add.sprite(width / 2, this._previewY - 5, spriteKey, 0);

    // 미리보기는 카드보다 더 크게 표시
    if (useImage) {
      this.previewSprite.setScale(0.22);
    } else {
      this.previewSprite.setScale(1.3);
    }
    this.previewSprite.play(`${dino.key}_run`);
    this.previewSprite.setAlpha(0);

    // 등장 애니메이션: 왼쪽에서 슬라이드 인
    this.previewSprite.x = width * 0.2;
    this.tweens.add({
      targets: this.previewSprite,
      x: width / 2,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // 능력 설명 텍스트 업데이트
    this.previewAbilityText.setText(`${dino.abilityName}: ${dino.abilityDesc}`);
    this.tweens.add({
      targets: this.previewAbilityText,
      alpha: 1,
      duration: 400,
    });

    // 한 줄 쉬운 설명 업데이트
    this.previewEasyDesc.setText(DINO_EASY_DESC[dino.key] || '');
    this.tweens.add({
      targets: this.previewEasyDesc,
      alpha: 1,
      duration: 400,
      delay: 100,
    });

    // "모험 시작!" 버튼 활성화 (노란색으로 변경)
    this._activateButton();
  }

  /** 시작 버튼 생성 */
  _createStartButton(width, height) {
    const btnY = height * 0.88;

    // 버튼 배경
    this.btnBg = this.add.graphics();
    this.btnBg.fillStyle(0xAAAAAA, 1); // 처음엔 회색 (비활성)
    this.btnBg.fillRoundedRect(-80, -25, 160, 50, 25);
    this.btnBg.setPosition(width / 2, btnY);

    // 버튼 텍스트
    this.btnText = this.add.text(width / 2, btnY, '모험 시작!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // 터치 영역
    this.btnHit = this.add.rectangle(width / 2, btnY, 160, 50, 0x000000, 0);
    this.btnHit.setInteractive({ useHandCursor: true });
    this.btnHit.on('pointerdown', () => {
      if (this.selectedDino !== null) {
        // 선택된 공룡 정보를 글로벌 레지스트리에 저장
        this.registry.set('selectedDino', DINOS[this.selectedDino].key);

        soundGenerator.playSelect();

        // 페이드아웃 후 난이도 선택 화면으로 전환
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('DifficultyScene');
        });
      }
    });
  }

  /** 버튼을 노란색 활성 상태로 변경 */
  _activateButton() {
    this.btnBg.clear();
    this.btnBg.fillStyle(0xFFCC00, 1); // 활성 = 노란색
    this.btnBg.fillRoundedRect(-80, -25, 160, 50, 25);

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
  _onResize(gameSize) {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
