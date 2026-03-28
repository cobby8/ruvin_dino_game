/**
 * SelectScene.js - 2층: 접수처 (공룡 선택 화면)
 * 4마리 공룡 카드 중 하나를 선택하고 "모험 시작!" 버튼으로 게임 진입
 * 모바일에서는 2x2 그리드, 넓은 화면에서는 가로 배치
 */

import Phaser from 'phaser';
import { DINOS } from '../config.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

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
    this.add.text(width / 2, height * 0.08, '루빈이의', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '24px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.15, '공룡 모험', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '36px',
      color: '#FF6B6B',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // === "친구를 골라줘!" 안내 텍스트 ===
    this.add.text(width / 2, height * 0.23, '친구를 골라줘!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#555555',
    }).setOrigin(0.5);

    // === 공룡 카드 4장 배치 (2x2 그리드) ===
    this._createCards(width, height);

    // === "모험 시작!" 버튼 (공룡 선택 전에는 회색) ===
    this._createStartButton(width, height);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /** 공룡 카드 4장 생성 */
  _createCards(width, height) {
    // 2x2 그리드 레이아웃
    const cardW = Math.min(width * 0.35, 120);
    const cardH = cardW * 1.3;
    const gapX = width * 0.08;
    const gapY = height * 0.03;
    const startY = height * 0.3;

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
      // 이미지(516x512)는 카드 크기에 맞게 축소, Graphics(96x96)는 기존 비율
      if (useImage) {
        sprite.setScale(Math.min(cardW / 580, 0.18));
      } else {
        sprite.setScale(Math.min(cardW / 110, 1.0));
      }
      sprite.play(`${dino.key}_run`);
      container.add(sprite);

      // 공룡 이름 (한글)
      const nameText = this.add.text(0, cardH / 2 - 32, dino.name, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '16px',
        color: dino.hex,
      }).setOrigin(0.5);
      container.add(nameText);

      // 특수능력 설명 (카드 하단에 작게 표시)
      if (dino.abilityName) {
        const abilityText = this.add.text(0, cardH / 2 - 14, dino.abilityDesc, {
          fontFamily: 'Jua, sans-serif',
          fontSize: '10px',
          color: '#888888',
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

  /** 공룡 선택 시 호출 */
  _selectDino(index) {
    // 효과음 시스템 초기화 (첫 터치에서)
    soundGenerator.init();
    soundGenerator.playSelect();

    this.selectedDino = index;

    // 모든 카드 크기 초기화 후 선택된 카드만 확대
    this.cards.forEach((card, i) => {
      if (i === index) {
        // 선택된 카드: 확대 + 반짝이 트윈
        this.tweens.add({
          targets: card.container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Back.easeOut',
        });
      } else {
        // 비선택 카드: 축소 + 반투명
        this.tweens.add({
          targets: card.container,
          scaleX: 0.85,
          scaleY: 0.85,
          duration: 200,
          ease: 'Sine.easeOut',
        });
        card.container.setAlpha(0.5);
      }
    });
    // 선택된 카드 알파 복원
    this.cards[index].container.setAlpha(1);

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
    }).setOrigin(0.5);

    // 터치 영역
    this.btnHit = this.add.rectangle(width / 2, btnY, 160, 50, 0x000000, 0);
    this.btnHit.setInteractive({ useHandCursor: true });
    this.btnHit.on('pointerdown', () => {
      if (this.selectedDino !== null) {
        // 선택된 공룡 정보를 글로벌 레지스트리에 저장
        // (다른 씬에서 registry.get('selectedDino')로 꺼내 쓸 수 있음)
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
    // 씬을 재시작하여 레이아웃 재계산
    // (간단한 방법이지만 선택 상태가 초기화되는 단점 있음)
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}
