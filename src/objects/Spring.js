/**
 * Spring.js - 스프링 점프대 시스템
 * 바닥에 놓인 스프링을 밟으면 초고점프! (마리오 스프링 느낌)
 *
 * 동작 방식:
 * - 공룡이 위에서 떨어지면서(하강 중) 스프링에 닿으면 활성화
 * - 스프링 압축 애니메이션 (scaleY 줄었다 복귀)
 * - 공룡에게 SPRING.VELOCITY (-900) 적용 → 매우 높이 뜀!
 * - 스프링 위에 별 아이템이 아치형으로 배치 (보상!)
 *
 * 오브젝트 풀링 패턴: Obstacle/Enemy/Item과 동일
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';

// ============================================================
// 스프링 텍스처 생성 (BootScene에서 호출)
// ============================================================

/**
 * 스프링 텍스처 생성: 빨간 코일 + 파란 받침대
 * 크기: 40x35
 * @param {Phaser.Scene} scene - BootScene
 */
export function createSpringTextures(scene) {
  const w = 40, h = 35;
  const g = scene.add.graphics();

  // === 파란 받침대 (아래쪽 직사각형) ===
  g.fillStyle(0x3366CC);
  g.fillRect(4, h - 10, w - 8, 10);
  // 받침대 테두리 (진한 파랑)
  g.lineStyle(2, 0x224488);
  g.strokeRect(4, h - 10, w - 8, 10);

  // === 빨간 코일 (지그재그 선으로 스프링 표현) ===
  g.lineStyle(4, 0xFF3333);
  const coilTop = 4;       // 코일 시작 y
  const coilBottom = h - 10; // 코일 끝 y (받침대 위)
  const segments = 5;      // 지그재그 횟수
  const segH = (coilBottom - coilTop) / segments;

  g.beginPath();
  g.moveTo(w * 0.3, coilTop); // 시작점 (왼쪽 위)
  for (let i = 0; i < segments; i++) {
    const y = coilTop + segH * (i + 1);
    // 짝수면 오른쪽, 홀수면 왼쪽으로 지그재그
    const x = i % 2 === 0 ? w * 0.7 : w * 0.3;
    g.lineTo(x, y);
  }
  g.strokePath();

  // === 코일 상단 캡 (스프링 윗부분 = 밟는 곳) ===
  g.fillStyle(0xFF6666);
  g.fillRoundedRect(6, coilTop - 2, w - 12, 6, 3);
  g.lineStyle(1, 0xCC2222);
  g.strokeRoundedRect(6, coilTop - 2, w - 12, 6, 3);

  g.generateTexture('spring', w, h);
  g.destroy();
}

// ============================================================
// Spring 클래스: 개별 스프링 오브젝트
// ============================================================

export class Spring extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'spring');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 물리 설정: 바닥에 고정, 중력 없음
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(5); // 장애물과 같은 레이어

    // 히트박스를 윗부분에 맞춤 (밟기 판정용, 절반으로 축소)
    this.body.setSize(15, 7.5);
    this.body.setOffset(2.5, 0);

    // 초기 상태: 비활성
    this.isUsed = false;
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 스프링 초기화 (풀에서 꺼낼 때)
   * @param {number} x - x좌표
   * @param {number} y - y좌표 (바닥 = groundY)
   * @param {number} speed - 현재 게임 속도
   */
  setup(x, y, speed) {
    // 바닥 위에 놓기 (origin이 0.5, 0.5이므로 반높이만큼 올림)
    this.setPosition(x, y - 17);
    this.setActive(true);
    this.setVisible(true);
    this.isUsed = false;
    // Graphics 텍스처 1.5배 확대 (기존 3에서 절반으로 축소)
    this.setScale(1.5, 1.5);
    this.setAlpha(1);

    // 왼쪽으로 이동 (장애물과 같은 속도)
    this.body.setVelocityX(-speed);
  }

  /**
   * 스프링 활성화 (공룡이 밟았을 때)
   * 압축 → 복원 애니메이션 재생
   */
  activate() {
    if (this.isUsed) return;
    this.isUsed = true;

    // 스프링 압축 → 복원 트윈 (scaleY를 줄였다가 복귀, 1.5배 기준)
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.4 * 1.5, // 눌린 상태 (40%로 압축, 1.5배 기준 = 0.6)
      duration: 80,
      yoyo: true,      // 다시 원래로 복귀
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // 1초 후 재사용 가능 (다음 공룡이 또 밟을 수 있게)
        this.scene.time.delayedCall(1000, () => {
          this.isUsed = false;
        });
      },
    });
  }

  /** 비활성화 (화면 밖) */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocityX(0);
    this.isUsed = false;
  }
}

// ============================================================
// SpringManager: 스프링 풀링 + 스폰 관리
// ============================================================

export class SpringManager {
  /**
   * @param {Phaser.Scene} scene - GameScene
   */
  constructor(scene) {
    this.scene = scene;

    // 물리 그룹 (오브젝트 풀링)
    this.group = scene.physics.add.group({
      classType: Spring,
      maxSize: 5, // 스프링은 최대 5개면 충분
      runChildUpdate: false,
    });

    // 풀에 미리 생성 (비활성)
    for (let i = 0; i < 5; i++) {
      const spring = new Spring(scene, -100, -100);
      this.group.add(spring);
    }
  }

  /**
   * 스프링 스폰
   * @param {number} x - x좌표
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   * @returns {Spring|null} 생성된 스프링 또는 null
   */
  spawn(x, groundY, speed) {
    const spring = this.group.getChildren().find(s => !s.active);
    if (!spring) return null;
    spring.setup(x, groundY, speed);
    return spring;
  }

  /** 화면 밖 스프링 정리 */
  cleanup() {
    this.group.getChildren().forEach(spring => {
      if (spring.active && spring.x < -60) {
        spring.deactivate();
      }
    });
  }
}
