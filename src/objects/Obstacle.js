/**
 * Obstacle.js - 장애물 레고블록
 * 선인장, 돌멩이 등 장애물을 코드로 그리고 관리하는 클래스
 * 오브젝트 풀링(재활용) 패턴으로 메모리 효율적
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

  // 선인장 몸통 (진한 녹색 기둥)
  g1.fillStyle(0x2D8B46);
  g1.fillRoundedRect(5, 5, 10, 25, 3);

  // 선인장 팔 (왼쪽으로 작은 가지)
  g1.fillRoundedRect(0, 12, 7, 4, 2);

  // 가시 (작은 점들로 표현)
  g1.fillStyle(0x1A6B30);
  g1.fillCircle(8, 8, 1);
  g1.fillCircle(12, 15, 1);
  g1.fillCircle(7, 22, 1);

  // 텍스처로 저장 (generateTexture: Graphics -> 이미지 텍스처 변환)
  g1.generateTexture('obstacle_small_cactus', 20, 30);
  g1.destroy();

  // === 큰 선인장 (30x45) ===
  const g2 = scene.add.graphics();

  // 큰 몸통
  g2.fillStyle(0x2D8B46);
  g2.fillRoundedRect(8, 5, 14, 40, 4);

  // 왼쪽 팔
  g2.fillRoundedRect(0, 15, 10, 5, 2);
  g2.fillRoundedRect(0, 10, 5, 10, 2);

  // 오른쪽 팔
  g2.fillRoundedRect(20, 22, 10, 5, 2);
  g2.fillRoundedRect(25, 18, 5, 10, 2);

  // 가시들
  g2.fillStyle(0x1A6B30);
  g2.fillCircle(12, 8, 1.5);
  g2.fillCircle(18, 20, 1.5);
  g2.fillCircle(12, 32, 1.5);

  g2.generateTexture('obstacle_big_cactus', 30, 45);
  g2.destroy();

  // === 돌멩이 (25x20) ===
  const g3 = scene.add.graphics();

  // 돌 몸체 (회색 둥근 사각형)
  g3.fillStyle(0x8E8E8E);
  g3.fillRoundedRect(2, 4, 21, 14, 5);

  // 돌 하이라이트 (밝은 부분 - 입체감)
  g3.fillStyle(0xAAAAAA);
  g3.fillEllipse(10, 8, 8, 4);

  // 돌 어두운 부분
  g3.fillStyle(0x6E6E6E);
  g3.fillEllipse(16, 14, 6, 3);

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
      yOffset = 15;   // 바닥에서 살짝 위로
    } else if (rand < 0.8) {
      textureKey = 'obstacle_big_cactus';
      yOffset = 22;   // 큰 선인장은 더 위로
    } else {
      textureKey = 'obstacle_rock';
      yOffset = 10;   // 돌멩이는 바닥에 붙어있게
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
      obstacle.setOrigin(0.5, 1);  // 기준점을 아래쪽 중앙으로
    }

    // 물리 설정
    obstacle.body.setVelocityX(-speed); // 왼쪽으로 이동
    obstacle.body.setAllowGravity(false);
    obstacle.body.setImmovable(true);
    obstacle.scored = false;  // 점수 처리 여부 플래그

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
