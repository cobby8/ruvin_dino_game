/**
 * BoostPad.js - 부스트 구간 시스템
 * 바닥에 놓인 패드를 밟으면 2초간 속도 2배 + 무적! (소닉 대시 느낌)
 *
 * 동작 방식:
 * - 바닥에 납작한 패드가 깔려있음 (노란+주황 화살표 무늬)
 * - 공룡이 바닥에서 밟으면 활성화
 * - 2초간: 속도 2배 + 무적 + 화면 속도선 이펙트 + 달리기 빠르게
 * - 시간 끝나면 원래 속도로 부드럽게 복귀
 *
 * 오브젝트 풀링 패턴: 다른 매니저와 동일
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';

// ============================================================
// 부스트 패드 텍스처 생성 (BootScene에서 호출)
// ============================================================

/**
 * 부스트 패드 텍스처: 노란+주황 화살표 무늬 바닥 패드
 * 크기: 60x15 (납작한 패드)
 * @param {Phaser.Scene} scene - BootScene
 */
export function createBoostPadTextures(scene) {
  const w = 60, h = 15;
  const g = scene.add.graphics();

  // === 패드 배경 (노란색 그라데이션 느낌) ===
  g.fillStyle(0xFFAA00); // 주황
  g.fillRoundedRect(0, 0, w, h, 4);

  // 위쪽 절반 밝은 노랑 (그라데이션 효과)
  g.fillStyle(0xFFDD00, 0.8);
  g.fillRoundedRect(0, 0, w, h / 2, { tl: 4, tr: 4, bl: 0, br: 0 });

  // === 화살표 무늬 (▶▶▶) ===
  g.fillStyle(0xFF6600, 0.9); // 진한 주황 화살표
  const arrowCount = 4;
  const arrowW = 8, arrowH = 9;
  const startX = 6;
  const spacing = 13;

  for (let i = 0; i < arrowCount; i++) {
    const ax = startX + i * spacing;
    const ay = (h - arrowH) / 2;

    // 삼각형 화살표 (오른쪽 방향)
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ax + arrowW, ay + arrowH / 2);
    g.lineTo(ax, ay + arrowH);
    g.closePath();
    g.fillPath();
  }

  // === 테두리 (하얀색 외곽선으로 눈에 띄게) ===
  g.lineStyle(2, 0xFFFFFF, 0.8);
  g.strokeRoundedRect(1, 1, w - 2, h - 2, 3);

  g.generateTexture('boostpad', w, h);
  g.destroy();
}

// ============================================================
// BoostPad 클래스: 개별 부스트 패드 오브젝트
// ============================================================

export class BoostPad extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boostpad');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 물리 설정: 바닥에 고정
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(3); // 바닥 장식 레이어 (장애물보다 뒤)

    // 히트박스 설정
    this.body.setSize(55, 12);
    this.body.setOffset(2, 2);

    // 초기 상태
    this.isUsed = false;
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 부스트 패드 초기화 (풀에서 꺼낼 때)
   * @param {number} x - x좌표
   * @param {number} y - y좌표 (바닥 = groundY)
   * @param {number} speed - 현재 게임 속도
   */
  setup(x, y, speed) {
    // 바닥에 납작하게 깔기 (origin 0.5 기준, 바닥에 딱 붙임)
    this.setPosition(x, y - 7);
    this.setActive(true);
    this.setVisible(true);
    this.isUsed = false;
    this.setAlpha(1);
    // Graphics 텍스처 3배 확대
    this.setScale(3);

    // 왼쪽으로 이동
    this.body.setVelocityX(-speed);
  }

  /**
   * 부스트 패드 활성화 (공룡이 밟았을 때)
   * 사용됨 표시 + 시각 피드백
   */
  activate() {
    if (this.isUsed) return;
    this.isUsed = true;

    // 밟히는 이펙트: 반짝 + 투명해지며 사라짐 (3배 기준)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      scaleX: 1.2 * 3, // 3배 기준에서 약간 더 커짐
      duration: 300,
      ease: 'Sine.easeOut',
    });
  }

  /** 비활성화 (화면 밖) */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocityX(0);
    this.isUsed = false;
    this.setScale(3);
  }
}

// ============================================================
// BoostPadManager: 부스트 패드 풀링 + 스폰 관리
// ============================================================

export class BoostPadManager {
  /**
   * @param {Phaser.Scene} scene - GameScene
   */
  constructor(scene) {
    this.scene = scene;

    // 물리 그룹 (오브젝트 풀링)
    this.group = scene.physics.add.group({
      classType: BoostPad,
      maxSize: 5,
      runChildUpdate: false,
    });

    // 풀에 미리 생성
    for (let i = 0; i < 5; i++) {
      const pad = new BoostPad(scene, -100, -100);
      this.group.add(pad);
    }
  }

  /**
   * 부스트 패드 스폰
   * @param {number} x - x좌표
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   * @returns {BoostPad|null}
   */
  spawn(x, groundY, speed) {
    const pad = this.group.getChildren().find(p => !p.active);
    if (!pad) return null;
    pad.setup(x, groundY, speed);
    return pad;
  }

  /** 화면 밖 패드 정리 */
  cleanup() {
    this.group.getChildren().forEach(pad => {
      if (pad.active && pad.x < -80) {
        pad.deactivate();
      }
    });
  }
}
