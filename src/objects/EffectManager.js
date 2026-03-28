/**
 * EffectManager.js - 이펙트 관리자
 * 적 처치 시 별 파티클 + "퍽!" 텍스트 팝업 + 점수 팝업을 관리
 * 콤보 팝업 + 달리기 먼지 + 착지 충격파도 담당
 * Phaser 트윈으로 구현 (파티클 시스템 대신 단순 그래픽 객체 활용)
 */

import { GAME } from '../config.js';

export class EffectManager {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   */
  constructor(scene) {
    this.scene = scene;
    // 달리기 먼지 생성 간격 추적용 (200ms마다 생성)
    this._lastDustTime = 0;
  }

  /**
   * 적 처치 이펙트 (강화 버전): 연기 팡! + 별 파티클(5~8개) + "퍽!" 텍스트
   * 적이 사라지는 위치에서 연기(회색 원)가 퍼지고, 별이 사방으로 퍼지고, "퍽!" 글자가 튀어오름
   * @param {number} x - 이펙트 중심 x
   * @param {number} y - 이펙트 중심 y
   */
  showDefeatEffect(x, y) {
    const scene = this.scene;

    // === 연기 파티클 (회색 원 4~6개, 퍼지며 사라짐) ===
    const smokeCount = Phaser.Math.Between(4, 6);
    for (let i = 0; i < smokeCount; i++) {
      const smoke = scene.add.graphics();
      const smokeSize = Phaser.Math.Between(6, 12);
      // 회색 연기 (투명도 다양하게)
      smoke.fillStyle(0xBBBBBB, 0.7);
      smoke.fillCircle(0, 0, smokeSize);
      smoke.setPosition(x, y);
      smoke.setDepth(19); // 별 파티클보다 살짝 아래

      // 랜덤 방향으로 퍼짐
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(15, 40);

      scene.tweens.add({
        targets: smoke,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        scaleX: 2,  // 커지면서 사라짐 (연기가 퍼지는 느낌)
        scaleY: 2,
        duration: 350,
        ease: 'Sine.easeOut',
        onComplete: () => smoke.destroy(),
      });
    }

    // === 별 파티클 (5~8개가 사방으로 퍼짐) ===
    const starCount = Phaser.Math.Between(5, 8);
    for (let i = 0; i < starCount; i++) {
      const star = scene.add.graphics();
      const colors = [0xFFD700, 0xFFFF00, 0xFFA500, 0xFFFFFF];
      const color = colors[i % colors.length];
      const size = Phaser.Math.Between(3, 6);

      // 별 십자 모양 그리기
      star.fillStyle(color);
      star.fillRect(-size / 2, -1, size, 2);
      star.fillRect(-1, -size / 2, 2, size);
      star.fillStyle(color, 0.7);
      star.fillCircle(0, 0, size * 0.4);

      star.setPosition(x, y);
      star.setDepth(20);

      // 랜덤 방향으로 날아감 (기존보다 더 넓게)
      const angle = (Math.PI * 2 / starCount) * i + Math.random() * 0.5;
      const distance = Phaser.Math.Between(35, 70);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance - 25;

      scene.tweens.add({
        targets: star,
        x: targetX,
        y: targetY,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 450,
        ease: 'Sine.easeOut',
        onComplete: () => star.destroy(),
      });
    }

    // === "퍽!" 텍스트 팝업 ===
    const pukText = scene.add.text(x, y - 10, '퍽!', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '28px',
      color: '#FF4444',
      stroke: '#FFFFFF',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(21);

    scene.tweens.add({
      targets: pukText,
      y: y - 50,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => pukText.destroy(),
    });
  }

  /**
   * 점수 팝업: "+3" 같은 텍스트가 위로 떠오르며 사라짐
   * @param {number} x - 팝업 위치 x
   * @param {number} y - 팝업 위치 y
   * @param {number|string} points - 획득 점수 또는 텍스트
   */
  showScorePopup(x, y, points) {
    const scene = this.scene;

    const scoreText = scene.add.text(x + 20, y - 20, `+${points}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#8B6914',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(21);

    scene.tweens.add({
      targets: scoreText,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => scoreText.destroy(),
    });
  }

  /**
   * 콤보 팝업: "3콤보!" 같은 금색 큰 텍스트가 확대 후 사라짐
   * comboCount가 높을수록 텍스트가 더 크고 화려하게
   * @param {number} x - 표시 위치 x (보통 화면 중앙)
   * @param {number} y - 표시 위치 y
   * @param {number} comboCount - 현재 콤보 수 (2 이상)
   */
  showCombo(x, y, comboCount) {
    const scene = this.scene;
    // 콤보 메시지 가져오기 (최대 인덱스 4 = "5콤보! MAX!")
    const msgIndex = Math.min(comboCount - 1, 4);
    const text = GAME.COMBO.MESSAGES[msgIndex];
    if (!text) return; // 1콤보는 메시지 없음

    // 콤보 수에 따라 폰트 크기 증가 (2콤보=32px, 5콤보=48px)
    const baseFontSize = 28 + (Math.min(comboCount, 5) - 1) * 5;

    // 금색 큰 텍스트 생성
    const comboText = scene.add.text(x, y, text, {
      fontFamily: 'Jua, sans-serif',
      fontSize: `${baseFontSize}px`,
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200).setScale(0.5).setAlpha(1);

    // 확대(0.5→1.3) 후 서서히 사라짐
    scene.tweens.add({
      targets: comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: comboText,
          y: y - 40,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 500,
          ease: 'Sine.easeOut',
          onComplete: () => comboText.destroy(),
        });
      },
    });

    // 콤보가 높을수록 카메라 흔들림이 강해짐 (아주 약하게)
    const shakeIntensity = 0.002 + (Math.min(comboCount, 5) - 2) * 0.001;
    scene.cameras.main.shake(80, shakeIntensity);
  }

  /**
   * 달리기 먼지 파티클: 공룡 발 아래에서 흙색 원 2~3개가 뒤쪽+위로 날아감
   * GameScene의 update()에서 일정 간격(200ms)으로 호출
   * 바닥에 있을 때만 생성 (공중에서는 호출하지 않아야 함)
   * @param {number} x - 공룡 발 x좌표
   * @param {number} y - 공룡 발 y좌표 (바닥)
   * @param {number} time - 현재 시간 (중복 생성 방지용)
   */
  showRunDust(x, y, time) {
    // 200ms 간격 체크 (너무 자주 생성하면 느려짐)
    if (time - this._lastDustTime < 200) return;
    this._lastDustTime = time;

    const scene = this.scene;
    const dustCount = Phaser.Math.Between(2, 3);

    for (let i = 0; i < dustCount; i++) {
      const dust = scene.add.graphics();
      const dustSize = Phaser.Math.Between(3, 5);
      // 흙색 계열 (갈색~베이지)
      const colors = [0xC4A882, 0xD4B896, 0xBB9966];
      dust.fillStyle(colors[i % colors.length], 0.6);
      dust.fillCircle(0, 0, dustSize);
      dust.setPosition(x - 10, y); // 발 뒤쪽에서 시작
      dust.setDepth(5); // 공룡보다 아래

      // 왼쪽+위로 이동하며 투명해짐 (뒤로 날아가는 먼지)
      scene.tweens.add({
        targets: dust,
        x: x - 20 - Math.random() * 15,
        y: y - 5 - Math.random() * 10,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 300,
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }

  /**
   * 높은 점프 이펙트: 위쪽으로 짧은 흰색 선 3개 (바람 느낌)
   * 길게 눌러서 높은 점프가 발동될 때 호출
   * @param {number} x - 공룡 중심 x
   * @param {number} y - 공룡 중심 y
   */
  showHighJumpEffect(x, y) {
    const scene = this.scene;
    // 흰색 선 3개가 위로 올라가며 사라짐 (바람이 부는 느낌)
    for (let i = 0; i < 3; i++) {
      const line = scene.add.rectangle(x - 10 + i * 10, y, 3, 15, 0xFFFFFF);
      line.setDepth(7);
      scene.tweens.add({
        targets: line,
        y: y - 30,
        alpha: 0,
        duration: 300,
        ease: 'Sine.easeOut',
        onComplete: () => line.destroy(),
      });
    }
  }

  /**
   * 2단 점프 이펙트: 발 아래에 노란 별 3개가 사방으로 퍼지며 사라짐
   * 공중에서 2단 점프 발동 시 호출
   * @param {number} x - 공룡 발 x
   * @param {number} y - 공룡 발 y
   */
  showDoubleJumpEffect(x, y) {
    const scene = this.scene;
    // 노란 별 3개가 랜덤 방향으로 퍼지며 사라짐 (반짝!)
    for (let i = 0; i < 3; i++) {
      const star = scene.add.star(x, y, 5, 4, 8, 0xFFD700);
      star.setDepth(7);
      const angle = Math.random() * Math.PI * 2;
      scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Sine.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  /**
   * 착지 충격파: 공중에서 바닥에 착지하는 순간 양쪽으로 먼지가 퍼짐
   * 작은 원 5~8개가 양쪽으로 퍼지며 투명해짐
   * @param {number} x - 착지 위치 x
   * @param {number} y - 착지 위치 y (바닥)
   */
  showLandingDust(x, y) {
    const scene = this.scene;
    const particleCount = Phaser.Math.Between(5, 8);

    for (let i = 0; i < particleCount; i++) {
      const dust = scene.add.graphics();
      const dustSize = Phaser.Math.Between(3, 6);
      const colors = [0xC4A882, 0xD4B896, 0xBB9966, 0xAA8855];
      dust.fillStyle(colors[i % colors.length], 0.7);
      dust.fillCircle(0, 0, dustSize);
      dust.setPosition(x, y);
      dust.setDepth(5);

      // 양쪽으로 퍼지도록 (왼쪽 절반, 오른쪽 절반)
      const direction = (i < particleCount / 2) ? -1 : 1;
      const distX = Phaser.Math.Between(15, 40) * direction;
      const distY = Phaser.Math.Between(3, 12);

      scene.tweens.add({
        targets: dust,
        x: x + distX,
        y: y - distY, // 살짝 위로
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 350,
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }
}
