/**
 * Dino.js - 공룡 캐릭터 클래스
 * 플레이어가 조종하는 공룡. 달리기, 점프, 넘어짐 동작을 관리.
 * Phaser의 물리 스프라이트를 상속받아 중력/충돌이 자동 적용됨
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class Dino extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} x - 시작 x 위치
   * @param {number} y - 시작 y 위치
   * @param {string} dinoKey - 공룡 텍스처 키 ('brachio', 'trex', 등)
   */
  constructor(scene, x, y, dinoKey) {
    super(scene, x, y, dinoKey, 0);

    this.dinoKey = dinoKey;

    // 씬에 추가 + 물리 시스템에 등록
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 크기 설정 (config의 DINO_SCALE로 확대)
    this.setScale(GAME.DINO_SCALE);

    // 기준점을 아래쪽 중앙으로 (바닥에 발이 닿도록)
    this.setOrigin(0.5, 1);

    // 물리 설정
    this.body.setGravityY(GAME.GRAVITY);       // 중력 적용 (아래로 당김)
    this.body.setCollideWorldBounds(true);      // 화면 밖으로 나가지 않게
    this.body.setBounce(0);                     // 바운스 없음

    // 충돌 박스를 몸체에 맞게 축소 (여유있는 히트박스 = 6살 배려)
    this.body.setSize(GAME.DINO_SIZE * 0.5, GAME.DINO_SIZE * 0.7);
    this.body.setOffset(GAME.DINO_SIZE * 0.25, GAME.DINO_SIZE * 0.3);

    // 달리기 애니메이션 시작
    this.play(`${dinoKey}_run`);

    // 깊이 설정 (배경보다 앞에 표시)
    this.setDepth(10);
  }

  /**
   * 점프! 바닥에 있을 때만 점프 가능 (공중 이중점프 방지)
   */
  jump() {
    // body.blocked.down: 아래쪽에 뭔가(바닥)에 닿아있으면 true
    if (this.body.blocked.down) {
      this.body.setVelocityY(GAME.JUMP_VELOCITY); // 위로 튀어오르기
      this.play(`${this.dinoKey}_jump`);           // 놀란 표정으로 전환
      soundGenerator.playJump();                    // 점프 효과음
    }
  }

  /**
   * 넘어짐 (게임오버 시 호출)
   */
  fall() {
    this.play(`${this.dinoKey}_fall`);
  }

  /**
   * 매 프레임 호출: 착지 감지
   * 점프 후 바닥에 닿으면 다시 달리기 애니메이션으로 전환
   */
  update() {
    // 바닥에 닿아있고 + 현재 점프 애니메이션이면 -> 달리기로 전환
    if (this.body.blocked.down && this.anims.currentAnim) {
      const currentKey = this.anims.currentAnim.key;
      if (currentKey === `${this.dinoKey}_jump`) {
        this.play(`${this.dinoKey}_run`);
      }
    }
  }
}
