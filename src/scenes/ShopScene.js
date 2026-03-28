/**
 * ShopScene.js - 공룡 상점
 * 게임에서 모은 별(starCount)을 화폐로 사용해서 아이템을 구매하는 상점
 *
 * localStorage 'ruvin_dino_wallet': 총 보유 별 수 (게임에서 모은 별 누적)
 * localStorage 'ruvin_dino_shop_items': 구매한 소모품 목록 (다음 게임에서 적용 후 소모)
 */

import Phaser from 'phaser';
import { soundGenerator } from '../utils/SoundGenerator.js';

// === 상점 판매 아이템 목록 ===
// 모두 소모품(consumable): 한 번 구매 → 다음 게임 1회 적용 후 사라짐
const SHOP_ITEMS = [
  { id: 'extra_heart',  name: '추가 하트',   desc: '다음 게임 하트 +1',       price: 50,  icon: '\u2764\uFE0F', type: 'consumable' },
  { id: 'shield_start', name: '시작 방어막',  desc: '게임 시작 시 방어막',      price: 80,  icon: '\uD83D\uDEE1\uFE0F', type: 'consumable' },
  { id: 'magnet_start', name: '시작 자석',    desc: '게임 시작 시 자석 5초',    price: 100, icon: '\uD83E\uDDF2', type: 'consumable' },
  { id: 'double_star',  name: '별 2배',       desc: '다음 게임 별 획득 2배',    price: 150, icon: '\u2728',       type: 'consumable' },
  { id: 'slow_start',   name: '느린 시작',    desc: '시작 속도 30% 감소',       price: 120, icon: '\uD83D\uDC0C', type: 'consumable' },
];

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create() {
    const { width, height } = this.scale;

    // 화면 전환 효과: 페이드인
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // === 보유 별 불러오기 (localStorage) ===
    this.wallet = this._loadWallet();

    // === 배경 (상점 느낌의 따뜻한 그라디언트) ===
    const bg = this.add.graphics();
    // 위: 따뜻한 베이지, 아래: 연한 갈색
    const bgSteps = 10;
    for (let i = 0; i < bgSteps; i++) {
      const t = i / (bgSteps - 1);
      const r = Math.round(255 - t * 30);
      const g = Math.round(240 - t * 40);
      const b = Math.round(200 - t * 50);
      const color = (r << 16) | (g << 8) | b;
      bg.fillStyle(color);
      bg.fillRect(0, (height / bgSteps) * i, width, (height / bgSteps) + 1);
    }

    // === 상단: 타이틀 + 보유 별 표시 ===
    // 타이틀 배경 리본
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(0xFFAA00, 0.9);
    ribbonG.fillRoundedRect(width * 0.1, 8, width * 0.8, 44, 22);
    ribbonG.fillStyle(0xFFCC33, 0.6);
    ribbonG.fillRoundedRect(width * 0.12, 10, width * 0.76, 40, 20);

    this.add.text(width / 2, 30, '공룡 상점', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '26px',
      color: '#FFFFFF',
      stroke: '#AA6600',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000044', blur: 4, fill: true },
    }).setOrigin(0.5);

    // 보유 별 표시 (타이틀 아래)
    this.walletText = this.add.text(width / 2, 65, `보유 별: \u2B50 ${this.wallet}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#8B6914',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // === 중앙: 아이템 카드 목록 ===
    // 스크롤이 필요할 수 있으므로 컨테이너 사용
    this.itemCards = [];
    const cardStartY = 95;
    const cardH = 80;
    const cardGap = 10;

    SHOP_ITEMS.forEach((item, i) => {
      const cardY = cardStartY + i * (cardH + cardGap);
      this._createItemCard(item, width, cardY, cardH);
    });

    // === 하단: "돌아가기" 버튼 ===
    const btnY = height - 40;
    this._createBackButton(width, btnY);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 아이템 카드 하나 생성
   * 아이콘 + 이름 + 설명 + 가격 + 구매/별부족 버튼
   */
  _createItemCard(item, screenW, cardY, cardH) {
    const cardW = screenW * 0.88;
    const cardX = (screenW - cardW) / 2;
    const canBuy = this.wallet >= item.price;

    // 카드 배경 (구매 가능=밝음, 불가=어둡게)
    const cardBg = this.add.graphics();
    if (canBuy) {
      // 구매 가능: 밝은 흰색 배경 + 금색 테두리
      cardBg.fillStyle(0xFFFFF0, 0.95);
      cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 14);
      cardBg.lineStyle(2, 0xFFCC00, 1);
      cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);
    } else {
      // 별 부족: 어두운 회색 배경
      cardBg.fillStyle(0xDDDDDD, 0.7);
      cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 14);
      cardBg.lineStyle(1.5, 0xBBBBBB, 0.5);
      cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);
    }

    // 아이콘 (왼쪽에 크게)
    this.add.text(cardX + 30, cardY + cardH / 2, item.icon, {
      fontSize: '30px',
    }).setOrigin(0.5);

    // 아이템 이름 (아이콘 오른쪽)
    const nameColor = canBuy ? '#333333' : '#999999';
    this.add.text(cardX + 60, cardY + 18, item.name, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: nameColor,
    }).setOrigin(0, 0.5);

    // 아이템 설명 (이름 아래)
    const descColor = canBuy ? '#777777' : '#BBBBBB';
    this.add.text(cardX + 60, cardY + 38, item.desc, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '12px',
      color: descColor,
    }).setOrigin(0, 0.5);

    // 가격 표시 (설명 아래)
    const priceColor = canBuy ? '#CC8800' : '#BBBBBB';
    this.add.text(cardX + 60, cardY + 56, `\u2B50 ${item.price}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
      color: priceColor,
    }).setOrigin(0, 0.5);

    // 구매 / 별 부족 버튼 (카드 오른쪽)
    const btnW = 70;
    const btnH = 32;
    const btnX = cardX + cardW - btnW / 2 - 15;
    const btnBtnY = cardY + cardH / 2;

    const btnBg = this.add.graphics();
    if (canBuy) {
      // 구매 가능: 초록색 버튼
      btnBg.fillStyle(0x4CAF50, 1);
      btnBg.fillRoundedRect(btnX - btnW / 2, btnBtnY - btnH / 2, btnW, btnH, btnH / 2);
    } else {
      // 별 부족: 회색 버튼
      btnBg.fillStyle(0xAAAAAA, 1);
      btnBg.fillRoundedRect(btnX - btnW / 2, btnBtnY - btnH / 2, btnW, btnH, btnH / 2);
    }

    const btnLabel = canBuy ? '구매' : '별 부족';
    const btnText = this.add.text(btnX, btnBtnY, btnLabel, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '13px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    // 구매 가능한 경우에만 인터랙션 등록
    if (canBuy) {
      const hitArea = this.add.rectangle(btnX, btnBtnY, btnW, btnH, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });

      hitArea.on('pointerdown', () => {
        this._buyItem(item);
      });

      // 호버 효과
      hitArea.on('pointerover', () => { btnBg.setAlpha(0.8); });
      hitArea.on('pointerout', () => { btnBg.setAlpha(1); });
    }

    // 카드 참조 저장 (나중에 리프레시용)
    this.itemCards.push({ item, cardBg, btnBg, btnText });
  }

  /**
   * 아이템 구매 처리
   * 별 차감 → localStorage에 구매 아이템 저장 → 화면 갱신
   */
  _buyItem(item) {
    // 별 부족 방어
    if (this.wallet < item.price) return;

    // 효과음
    soundGenerator.init();
    soundGenerator.playPowerUp();

    // 별 차감
    this.wallet -= item.price;
    this._saveWallet(this.wallet);

    // 구매한 아이템을 localStorage에 저장 (다음 게임에서 적용)
    this._savePurchasedItem(item.id);

    // "구매 완료!" 팝업 표시
    this._showPurchasePopup(item);

    // 화면 전체 갱신 (별 수 변경으로 구매 가능 여부가 바뀔 수 있음)
    this.scene.restart();
  }

  /**
   * "구매 완료!" 팝업 (화면 중앙에 잠깐 나타남)
   */
  _showPurchasePopup(item) {
    const { width, height } = this.scale;

    const popup = this.add.text(width / 2, height / 2, `${item.icon} 구매 완료!`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#00000066', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(300);

    // 위로 떠오르며 사라지는 애니메이션
    this.tweens.add({
      targets: popup,
      y: height / 2 - 50,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1000,
      ease: 'Sine.easeOut',
      onComplete: () => popup.destroy(),
    });
  }

  /**
   * 하단 "돌아가기" 버튼
   */
  _createBackButton(width, btnY) {
    const btnW = 140;
    const btnH = 40;

    // 버튼 그림자
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.15);
    shadow.fillRoundedRect(width / 2 - btnW / 2 + 2, btnY - btnH / 2 + 2, btnW, btnH, btnH / 2);

    // 버튼 배경 (갈색 = 돌아가기 느낌)
    const bg = this.add.graphics();
    bg.fillStyle(0x8B6914, 1);
    bg.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, btnH / 2);
    // 상단 하이라이트
    bg.fillStyle(0xFFFFFF, 0.2);
    bg.fillRoundedRect(width / 2 - btnW / 2 + 4, btnY - btnH / 2 + 2, btnW - 8, btnH * 0.4, btnH / 3);

    this.add.text(width / 2, btnY, '돌아가기', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '18px',
      color: '#FFFFFF',
      stroke: '#00000033',
      strokeThickness: 1,
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerdown', () => {
      soundGenerator.init();
      soundGenerator.playSelect();
      // 페이드아웃 후 월드맵으로 복귀
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('WorldMapScene');
      });
    });
  }

  // =========================================================
  // localStorage 관리
  // =========================================================

  /** 보유 별(wallet) 불러오기 */
  _loadWallet() {
    try {
      const val = localStorage.getItem('ruvin_dino_wallet');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  /** 보유 별(wallet) 저장 */
  _saveWallet(amount) {
    try {
      localStorage.setItem('ruvin_dino_wallet', String(amount));
    } catch {
      // 저장 실패 시 무시
    }
  }

  /**
   * 구매한 아이템을 localStorage에 추가
   * 같은 아이템을 여러 번 구매할 수 있음 (소모품이므로)
   */
  _savePurchasedItem(itemId) {
    try {
      const raw = localStorage.getItem('ruvin_dino_shop_items');
      const items = raw ? JSON.parse(raw) : [];
      items.push(itemId);
      localStorage.setItem('ruvin_dino_shop_items', JSON.stringify(items));
    } catch {
      // 저장 실패 시 무시
    }
  }

  /** 화면 크기 변경 대응 */
  _onResize() {
    this.scene.restart();
  }

  shutdown() {
    this.scale.off('resize', this._onResize, this);
  }
}

// === 외부에서 사용할 유틸리티 함수들 ===

/**
 * 구매한 아이템 목록 불러오기 + 사용 후 삭제 (소모품이므로)
 * GameScene에서 게임 시작 시 호출
 * @returns {string[]} 구매한 아이템 ID 배열
 */
export function loadAndClearPurchasedItems() {
  try {
    const raw = localStorage.getItem('ruvin_dino_shop_items');
    const items = raw ? JSON.parse(raw) : [];
    // 사용 후 삭제 (소모품 소진)
    localStorage.removeItem('ruvin_dino_shop_items');
    return items;
  } catch {
    return [];
  }
}

/**
 * wallet에 별을 추가 (게임 클리어/게임오버 시 호출)
 * @param {number} amount - 추가할 별 수
 */
export function addToWallet(amount) {
  try {
    const current = parseInt(localStorage.getItem('ruvin_dino_wallet') || '0', 10);
    localStorage.setItem('ruvin_dino_wallet', String(current + amount));
  } catch {
    // 저장 실패 시 무시
  }
}
