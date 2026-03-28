/**
 * Dino.js - 공룡 캐릭터 클래스
 * 플레이어가 조종하는 공룡. 달리기, 점프(3종), 넘어짐 동작을 관리.
 *
 * 점프 시스템 (3종류):
 * - 낮은 점프: 짧게 누르면 살짝 깡충 (작은 장애물용)
 * - 높은 점프: 길게 누르면 크게 점프 (큰 장애물용)
 * - 2단 점프: 공중에서 한 번 더 누르면 추가 상승 (긴급 회피용)
 *
 * 작동 방식: "즉시 점프 + 홀드 부스트"
 * 1. 버튼 누르는 순간(DOWN) → 바닥이면 낮은 점프로 즉시 띄움 + 시간 기록
 * 2. 버튼 떼는 순간(UP) → 100ms 이상 눌렀고 아직 올라가는 중이면 높은 점프로 부스트
 * 3. 공중에서 다시 누르면(DOWN) → 2단 점프 발동
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

    // 크기 설정
    this.setScale(GAME.DINO_SCALE);

    // 기준점을 아래쪽 중앙으로 (바닥에 발이 닿도록)
    this.setOrigin(0.5, 1);

    // 물리 설정
    this.body.setGravityY(GAME.GRAVITY);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);

    // 충돌 박스를 몸체에 맞게 축소 (여유있는 히트박스 = 6살 배려)
    this.body.setSize(GAME.DINO_SIZE * 0.5, GAME.DINO_SIZE * 0.6);
    this.body.setOffset(GAME.DINO_SIZE * 0.25, GAME.DINO_SIZE * 0.35);

    // 달리기 애니메이션 시작
    this.play(`${dinoKey}_run`);

    // 깊이 설정 (장애물 depth=5 보다 앞, UI depth=10 보다 뒤)
    this.setDepth(6);

    // === 점프 시스템 속성 초기화 ===
    this.jumpStartTime = 0;          // 점프 버튼 누른 시각 (ms)
    this.isJumpHeld = false;         // 버튼을 누르고 있는 중인지
    this.isDoubleJumpUsed = false;   // 이번 점프에서 2단 점프를 썼는지
    this.canDoubleJump = true;       // 난이도에 따라 2단 점프 허용 여부
    this.doubleJumpLimit = Infinity; // 스테이지 내 2단 점프 최대 횟수
    this.doubleJumpCount = 0;        // 현재까지 사용한 2단 점프 횟수
  }

  /**
   * 난이도 설정 메서드
   * GameScene에서 난이도 선택 정보를 받아와 2단 점프 가능 여부를 세팅
   * @param {object} difficulty - difficulties.js의 난이도 객체
   */
  setDifficulty(difficulty) {
    if (!difficulty) return;
    this.canDoubleJump = difficulty.canDoubleJump;
    this.doubleJumpLimit = difficulty.doubleJumpLimit;
    this.doubleJumpCount = 0; // 스테이지 시작 시 리셋
  }

  /**
   * 점프 시작 (버튼 누르는 순간 = pointerdown / keydown)
   * - 바닥에 있으면: 즉시 낮은 점프로 띄움 + 누른 시간 기록
   * - 공중에 있으면: 2단 점프 시도
   */
  startJump() {
    if (this.body.blocked.down) {
      // 바닥에 있으면 → 즉시 낮은 점프 실행
      this.body.setVelocityY(GAME.JUMP.LOW_VELOCITY);
      this.play(`${this.dinoKey}_jump`);
      soundGenerator.playJump();

      // 누른 시작 시간 기록 (나중에 UP 시점에서 차이 계산)
      this.jumpStartTime = Date.now();
      this.isJumpHeld = true;
      this.isDoubleJumpUsed = false; // 새 점프이므로 2단 점프 리셋
    } else {
      // 공중에 있으면 → 2단 점프 시도
      this.doubleJump();
    }
  }

  /**
   * 점프 실행/부스트 (버튼 떼는 순간 = pointerup / keyup)
   * - 100ms 이상 눌렀고 + 아직 위로 올라가는 중이면 → 높은 점프로 부스트
   * - 짧게 눌렀으면 → 이미 낮은 점프 상태이므로 아무것도 안 함
   */
  executeJump() {
    if (!this.isJumpHeld) return; // 누른 적이 없으면 무시
    this.isJumpHeld = false;

    const holdDuration = Date.now() - this.jumpStartTime; // 누른 시간 계산

    // 100ms 이상 눌렀고, 아직 위로 올라가는 중이면 (velocity가 음수 = 상승 중)
    if (holdDuration >= GAME.JUMP.HOLD_THRESHOLD && this.body.velocity.y < 0) {
      // 높은 점프로 부스트! (속도를 더 강하게 바꿈)
      this.body.setVelocityY(GAME.JUMP.HIGH_VELOCITY);
    }
    // 100ms 미만이면 → 이미 LOW_VELOCITY로 점프 중이므로 자연스럽게 낮은 점프가 됨
  }

  /**
   * 2단 점프 (공중에서 추가 점프)
   * - 난이도에 따라 사용 가능 여부가 다름
   * - 한 번의 점프 당 1회만 가능
   */
  doubleJump() {
    // 2단 점프가 불가능한 경우: 난이도 제한 또는 이미 사용함
    if (!this.canDoubleJump) return;
    if (this.isDoubleJumpUsed) return;
    if (this.doubleJumpCount >= this.doubleJumpLimit) return;

    // 2단 점프 실행!
    this.body.setVelocityY(GAME.JUMP.DOUBLE_VELOCITY);
    soundGenerator.playJump();
    this.isDoubleJumpUsed = true;
    this.doubleJumpCount++;
  }

  /**
   * 착지 시 호출 (GameScene의 update에서 감지하여 호출)
   * 점프 관련 상태를 모두 리셋
   */
  onLand() {
    this.isJumpHeld = false;
    this.isDoubleJumpUsed = false;

    // 점프 애니메이션 → 달리기 애니메이션으로 전환
    if (this.anims.currentAnim) {
      const currentKey = this.anims.currentAnim.key;
      if (currentKey === `${this.dinoKey}_jump`) {
        this.play(`${this.dinoKey}_run`);
      }
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
   * GameScene에서 직접 onLand()를 호출하므로, 여기서는 별도 처리 안 함
   * (하위 호환을 위해 메서드는 유지)
   */
  update() {
    // 착지 감지는 GameScene에서 body.blocked.down 체크 후 onLand() 호출로 처리
  }
}
