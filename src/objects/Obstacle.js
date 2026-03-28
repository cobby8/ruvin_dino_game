/**
 * Obstacle.js - 장애물 레고블록
 * 선인장, 돌멩이 등 장애물을 코드로 그리고 관리하는 클래스
 * 오브젝트 풀링(재활용) 패턴으로 메모리 효율적
 *
 * 고도화: 선인장 하이라이트/가시/꽃, 돌멩이 그라디언트/금무늬
 */

import { GAME } from '../config.js';

/**
 * 장애물 텍스처를 코드로 생성하여 등록
 * BootScene에서 호출됨
 * @param {Phaser.Scene} scene
 */
export function createObstacleTextures(scene) {
  // === 작은 선인장 (20x30) ===
  const g1 = scene.add.graphics();

  // 선인장 몸통 (진녹 본체)
  g1.fillStyle(0x2D8B46);
  g1.fillRoundedRect(5, 5, 10, 25, 3);

  // 하이라이트 줄 (연녹색 세로줄 - 입체감)
  g1.fillStyle(0x5BC37A, 0.6);
  g1.fillRoundedRect(8, 6, 3, 23, 1);

  // 선인장 팔 (왼쪽으로 작은 가지)
  g1.fillStyle(0x2D8B46);
  g1.fillRoundedRect(0, 12, 7, 4, 2);
  // 팔 하이라이트
  g1.fillStyle(0x5BC37A, 0.5);
  g1.fillRoundedRect(1, 13, 5, 2, 1);

  // 가시들 (작은 삼각형 - 더 많이)
  g1.fillStyle(0x1A6B30);
  g1.fillTriangle(15, 10, 18, 9, 15, 8);
  g1.fillTriangle(15, 16, 18, 15, 15, 14);
  g1.fillTriangle(15, 22, 17, 21, 15, 20);
  g1.fillTriangle(5, 9, 2, 8, 5, 7);
  g1.fillTriangle(5, 20, 2, 19, 5, 18);
  g1.fillTriangle(5, 25, 3, 24, 5, 23);

  // 꼭대기 작은 분홍 꽃
  g1.fillStyle(0xFFB0C0);
  g1.fillCircle(10, 4, 3);
  g1.fillStyle(0xFFE066);
  g1.fillCircle(10, 4, 1.2);

  g1.generateTexture('obstacle_small_cactus', 20, 30);
  g1.destroy();

  // === 큰 선인장 (30x45) ===
  const g2 = scene.add.graphics();

  // 큰 몸통
  g2.fillStyle(0x2D8B46);
  g2.fillRoundedRect(8, 5, 14, 40, 4);

  // 몸통 하이라이트 줄
  g2.fillStyle(0x5BC37A, 0.6);
  g2.fillRoundedRect(12, 6, 4, 38, 2);

  // 왼쪽 팔
  g2.fillStyle(0x2D8B46);
  g2.fillRoundedRect(0, 15, 10, 5, 2);
  g2.fillRoundedRect(0, 10, 5, 12, 2);
  // 왼팔 하이라이트
  g2.fillStyle(0x5BC37A, 0.5);
  g2.fillRoundedRect(1, 12, 3, 8, 1);

  // 오른쪽 팔
  g2.fillStyle(0x2D8B46);
  g2.fillRoundedRect(20, 22, 10, 5, 2);
  g2.fillRoundedRect(25, 18, 5, 12, 2);
  // 오른팔 하이라이트
  g2.fillStyle(0x5BC37A, 0.5);
  g2.fillRoundedRect(26, 20, 3, 8, 1);

  // 가시들 (더 많이!)
  g2.fillStyle(0x1A6B30);
  // 오른쪽 가시
  g2.fillTriangle(22, 8, 25, 7, 22, 6);
  g2.fillTriangle(22, 14, 25, 13, 22, 12);
  g2.fillTriangle(22, 28, 25, 27, 22, 26);
  g2.fillTriangle(22, 36, 24, 35, 22, 34);
  // 왼쪽 가시
  g2.fillTriangle(8, 8, 5, 7, 8, 6);
  g2.fillTriangle(8, 22, 5, 21, 8, 20);
  g2.fillTriangle(8, 32, 6, 31, 8, 30);
  g2.fillTriangle(8, 40, 5, 39, 8, 38);
  // 팔 가시
  g2.fillTriangle(3, 10, 1, 8, 5, 10);
  g2.fillTriangle(28, 18, 30, 16, 26, 18);

  // 꼭대기 분홍 꽃
  g2.fillStyle(0xFFB0C0);
  g2.fillCircle(15, 4, 3.5);
  g2.fillStyle(0xFFE066);
  g2.fillCircle(15, 4, 1.5);

  g2.generateTexture('obstacle_big_cactus', 30, 45);
  g2.destroy();

  // === 돌멩이 (25x20) - 그라디언트 + 하이라이트 + 금무늬 ===
  const g3 = scene.add.graphics();

  // 돌 몸체 하단 (어두운 회색)
  g3.fillStyle(0x6E6E6E);
  g3.fillRoundedRect(2, 6, 21, 12, 5);

  // 돌 몸체 상단 (밝은 회색 - 위가 밝고 아래가 어둡게)
  g3.fillStyle(0x9E9E9E);
  g3.fillRoundedRect(2, 4, 21, 10, 5);

  // 하이라이트 점 (밝은 부분 - 반짝이는 느낌)
  g3.fillStyle(0xBBBBBB);
  g3.fillCircle(8, 7, 3);
  g3.fillStyle(0xD0D0D0);
  g3.fillCircle(7, 6, 1.5);

  // 갈색 금 무늬 1~2줄 (돌의 질감)
  g3.lineStyle(1, 0x8B7355, 0.6);
  g3.lineBetween(6, 10, 18, 12);
  g3.lineStyle(0.8, 0x8B7355, 0.4);
  g3.lineBetween(10, 7, 20, 9);

  g3.generateTexture('obstacle_rock', 25, 20);
  g3.destroy();
}

/**
 * 장애물 관리 클래스 (오브젝트 풀링)
 * 장애물을 매번 새로 만들지 않고 재활용하는 패턴
 * (레고를 분해했다가 다시 조립하는 것과 비슷)
 */
export class ObstacleManager {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   */
  constructor(scene) {
    this.scene = scene;

    // 물리 그룹 생성 (장애물들을 묶어서 관리)
    this.group = scene.physics.add.group({
      allowGravity: false,    // 장애물은 중력 영향 없음 (떨어지지 않음)
    });
  }

  /**
   * 장애물 하나 생성 (또는 재활용)
   * @param {number} x - 생성 위치 x (화면 오른쪽 밖)
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   * @returns {Phaser.Physics.Arcade.Sprite} 생성된 장애물
   */
  spawn(x, groundY, speed) {
    // 장애물 종류 랜덤 선택 (확률: 작은선인장 50%, 큰선인장 30%, 돌멩이 20%)
    const rand = Math.random();
    let textureKey, yOffset;

    if (rand < 0.5) {
      textureKey = 'obstacle_small_cactus';
      yOffset = 15;
    } else if (rand < 0.8) {
      textureKey = 'obstacle_big_cactus';
      yOffset = 22;
    } else {
      textureKey = 'obstacle_rock';
      yOffset = 10;
    }

    // 오브젝트 풀에서 비활성 장애물 꺼내기 (없으면 새로 만듦)
    let obstacle = this.group.getFirstDead(false);

    if (obstacle) {
      // 재활용: 위치와 텍스처 변경 후 활성화
      obstacle.setTexture(textureKey);
      obstacle.setPosition(x, groundY - yOffset);
      obstacle.setActive(true).setVisible(true);
      obstacle.body.enable = true;
    } else {
      // 새로 생성
      obstacle = this.group.create(x, groundY - yOffset, textureKey);
      obstacle.setOrigin(0.5, 1);
    }

    // 물리 설정
    obstacle.body.setVelocityX(-speed);
    obstacle.body.setAllowGravity(false);
    obstacle.body.setImmovable(true);
    obstacle.scored = false;

    // 충돌 박스를 살짝 작게 (히트박스 관대하게 = 6살 배려)
    const bodyW = obstacle.width * 0.6;
    const bodyH = obstacle.height * 0.7;
    obstacle.body.setSize(bodyW, bodyH);
    obstacle.body.setOffset((obstacle.width - bodyW) / 2, (obstacle.height - bodyH) * 0.3);

    return obstacle;
  }

  /**
   * 화면 밖으로 나간 장애물 비활성화 (재활용 대기)
   */
  cleanup() {
    this.group.getChildren().forEach(obstacle => {
      if (obstacle.active && obstacle.x < -50) {
        obstacle.setActive(false).setVisible(false);
        obstacle.body.enable = false;
      }
    });
  }

  /**
   * 모든 장애물의 속도를 현재 게임 속도에 맞춤
   * @param {number} speed
   */
  updateSpeed(speed) {
    this.group.getChildren().forEach(obstacle => {
      if (obstacle.active) {
        obstacle.body.setVelocityX(-speed);
      }
    });
  }

  /** 모든 장애물 비활성화 (게임 재시작용) */
  reset() {
    this.group.getChildren().forEach(obstacle => {
      obstacle.setActive(false).setVisible(false);
      obstacle.body.enable = false;
    });
  }
}
