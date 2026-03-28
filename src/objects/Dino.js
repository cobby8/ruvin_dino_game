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
 *
 * [P1 추가] 슬라이드(구르기) + 피격 무적:
 * - 아래 키 → 납작하게 엎드림 (히트박스 높이 40%)
 * - 장애물에 닿으면 → 하트 -1 + 2초 무적 (깜빡깜빡)
 * - 무적 중에는 다시 안 맞음
 */

import Phaser from 'phaser';
import { GAME, DINOS } from '../config.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class Dino extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene - 게임 씬
   * @param {number} x - 시작 x 위치
   * @param {number} y - 시작 y 위치
   * @param {string} dinoKey - 공룡 텍스처 키 ('brachio', 'trex', 등)
   */
  constructor(scene, x, y, dinoKey) {
    // 이미지 텍스처(PNG)가 있으면 사용, 없으면 기존 Graphics 텍스처 사용
    const imgKey = `img_${dinoKey}`;
    const useImage = scene.textures.exists(imgKey);
    const textureKey = useImage ? imgKey : dinoKey;
    super(scene, x, y, textureKey, 0);

    this.dinoKey = dinoKey;
    this.useImage = useImage; // 이미지 사용 여부 (blink 처리에 필요)

    // 씬에 추가 + 물리 시스템에 등록
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 크기 설정: 이미지(516x512) 스케일 1.5배 확대 (기존 3배에서 절반으로 축소)
    if (this.useImage) {
      // 96 / 512 * 1.5 = 0.28125 → 이미지를 144px 높이로 1.5배 확대
      this.setScale((GAME.DINO_SIZE / 512) * 1.5);
    } else {
      // Graphics 텍스처도 1.5배 확대
      this.setScale(GAME.DINO_SCALE * 1.5);
    }

    // 기준점을 아래쪽 중앙으로 (바닥에 발이 닿도록)
    this.setOrigin(0.5, 1);

    // 물리 설정
    this.body.setGravityY(GAME.GRAVITY);
    // setCollideWorldBounds 제거: ground collider가 있으므로 월드 경계 충돌 불필요
    // (월드 하단 경계와 ground가 동시에 blocked.down을 true로 만들어 간섭 발생)
    this.body.setBounce(0);

    // 충돌 박스를 몸체에 맞게 축소 (여유있는 히트박스 = 6살 배려)
    // 이미지 텍스처는 원본 크기(516x512) 기준으로 body를 설정해야 함
    // (setScale이 적용되면 body도 자동으로 스케일됨)
    if (this.useImage) {
      // 이미지 기준: 원본 512px 높이에서 60%/40% 비율로 히트박스 설정
      this.body.setSize(516 * 0.5, 512 * 0.6);
      this.body.setOffset(516 * 0.25, 512 * 0.4);
    } else {
      // Graphics 기준: 96px
      this.body.setSize(GAME.DINO_SIZE * 0.5, GAME.DINO_SIZE * 0.6);
      this.body.setOffset(GAME.DINO_SIZE * 0.25, GAME.DINO_SIZE * 0.4);
    }

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

    // === [P1] 슬라이드 시스템 속성 ===
    this.isSliding = false;          // 슬라이드(구르기) 중인지
    this.slideTimer = null;          // 슬라이드 자동 해제 타이머

    // === [P1] 피격 무적 시스템 속성 ===
    this.isInvincible = false;       // 무적 상태인지 (피격 직후 일정시간)
    this.invincibleTimer = null;     // 무적 해제 타이머
    this.blinkTimer = null;          // 깜빡이 효과 타이머
    this.invincibleDuration = GAME.HEART.INVINCIBLE_DURATION; // 기본 2초, 난이도로 덮어씀

    // === [P3] 파워업 시스템 속성 ===
    this.powerUp = null;             // 현재 파워업 종류 ('invincible', 'magnet', 'shield', null)
    this.powerUpTimer = null;        // 파워업 지속 타이머
    this.hasShield = false;          // 방어막 보유 여부

    // === 공룡별 특수능력 데이터 로드 ===
    // DINOS 배열에서 현재 공룡의 능력 정보를 가져옴
    this.dinoData = DINOS.find(d => d.key === dinoKey) || DINOS[0];
    this.ability = this.dinoData.ability || null;
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

    // [P1] 난이도별 피격 무적시간 적용 (아기=3초, 전설=1초)
    if (difficulty.invincibleDuration) {
      this.invincibleDuration = difficulty.invincibleDuration;
    }
  }

  /**
   * 점프 시작 (버튼 누르는 순간 = pointerdown / keydown)
   * - 바닥에 있으면: 즉시 낮은 점프로 띄움 + 누른 시간 기록
   * - 공중에 있으면: 2단 점프 시도
   */
  startJump() {
    // [P1] 슬라이드 중에는 점프 불가 (엎드린 상태에서 뛸 수 없음)
    if (this.isSliding) return;

    if (this.body.blocked.down) {
      // 바닥에 있으면 → 즉시 낮은 점프 실행 (1단 점프)
      // 브라키오 특수능력: 목이 긴 초식공룡이라 점프가 20% 더 높음!
      const jumpMulti = this.ability === 'highJump' ? 1.2 : 1.0;
      this.body.setVelocityY(GAME.JUMP.LOW_VELOCITY * jumpMulti);
      this.play(`${this.dinoKey}_jump`);
      soundGenerator.playJump();

      // 누른 시작 시간 기록 (나중에 UP 시점에서 차이 계산)
      this.jumpStartTime = Date.now();
      this.isJumpHeld = true;
      this.isDoubleJumpUsed = false; // 새 점프이므로 2단 점프 리셋
    } else if (!this.isDoubleJumpUsed) {
      // 공중 + 아직 2단 점프 안 씀 → 2단 점프 시도
      // (이미 2단 점프를 쓴 경우 아무것도 안 함 = 3단 점프 차단)
      this.doubleJump();
    }
    // 그 외 (공중 + 이미 2단 점프 씀) → 입력 무시하여 3단 점프 방지
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
      // 브라키오 특수능력: 높은 점프도 20% 더 높음
      const jumpMulti = this.ability === 'highJump' ? 1.2 : 1.0;
      this.body.setVelocityY(GAME.JUMP.HIGH_VELOCITY * jumpMulti);

      // 높은 점프 시각적 피드백 (바람 이펙트)
      if (this.scene.effectManager) {
        this.scene.effectManager.showHighJumpEffect(this.x, this.y);
      }
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

    // 2단 점프 시각적 피드백 (별 파티클)
    if (this.scene.effectManager) {
      this.scene.effectManager.showDoubleJumpEffect(this.x, this.y);
    }
  }

  /**
   * 착지 시 호출 (GameScene의 update에서 감지하여 호출)
   * 점프 관련 상태를 모두 리셋
   */
  onLand() {
    this.isJumpHeld = false;
    this.isDoubleJumpUsed = false;

    // 점프 애니메이션 → 달리기 애니메이션으로 전환
    // (슬라이드 중이면 슬라이드 애니메이션 유지)
    if (!this.isSliding && this.anims.currentAnim) {
      const currentKey = this.anims.currentAnim.key;
      if (currentKey === `${this.dinoKey}_jump`) {
        this.play(`${this.dinoKey}_run`);
      }
    }
  }

  // =========================================================
  // [P3] 파워업 시스템
  // =========================================================

  /**
   * 파워업 적용 (아이템 수집 또는 물음표 블록에서 획득)
   * 이전 파워업이 있으면 먼저 제거 후 새로 적용.
   * @param {string} type - 'invincible', 'magnet', 'shield'
   */
  applyPowerUp(type) {
    // 이전 파워업 제거 (중복 적용 방지)
    this.clearPowerUp();

    if (type === 'invincible') {
      // 무적별: 5초간 무적 + 금색 빛
      this.powerUp = 'invincible';
      this.isInvincible = true;
      this.setTint(0xFFD700); // 금색 틴트

      this.powerUpTimer = this.scene.time.delayedCall(GAME.ITEMS.POWERUP_DURATION, () => {
        this.clearPowerUp();
      });
    } else if (type === 'magnet') {
      // 자석: 5초간 아이템 자동 흡수 (GameScene update에서 처리)
      this.powerUp = 'magnet';
      this.setTint(0x9B59B6); // 보라색 틴트

      this.powerUpTimer = this.scene.time.delayedCall(GAME.ITEMS.POWERUP_DURATION, () => {
        this.clearPowerUp();
      });
    } else if (type === 'shield') {
      // 방어막: 다음 1번 피격 무시
      this.powerUp = 'shield';
      this.hasShield = true;
      this.setTint(0x4EAEFF); // 파란색 틴트
      // 방어막은 시간 제한 없음 (1회 피격 시 소멸)
    }
  }

  /**
   * 파워업 해제 (시간 종료 또는 새 파워업 적용 시)
   */
  clearPowerUp() {
    // 무적별이었으면 무적 해제 (피격 무적과 구분: blinkTimer가 없으면 파워업 무적)
    if (this.powerUp === 'invincible' && !this.blinkTimer) {
      this.isInvincible = false;
    }

    this.powerUp = null;
    this.hasShield = false;
    this.clearTint(); // 틴트 제거

    if (this.powerUpTimer) {
      this.powerUpTimer.destroy();
      this.powerUpTimer = null;
    }
  }

  // =========================================================
  // [P1] 슬라이드(구르기) 시스템
  // =========================================================

  /**
   * 슬라이드 시작 (아래 키 / 아래 스와이프)
   * 공룡이 납작하게 엎드려서 높은 장애물을 피하는 동작.
   * 바닥에서만 가능 (공중에서는 무시).
   */
  slide() {
    // 이미 슬라이드 중이면 무시
    if (this.isSliding) return;
    // 바닥에 있을 때만 슬라이드 가능 (공중에서는 X)
    if (!this.body.blocked.down) return;

    this.isSliding = true;

    // 히트박스만 낮게 변경 (scaleY는 건드리지 않음! 바닥뚫기 방지)
    if (this.useImage) {
      // 이미지 기준: 원본 크기로 히트박스 설정 (스케일은 자동 적용됨)
      const slideHeight = 512 * 0.3;
      this.body.setSize(516 * 0.7, slideHeight);
      this.body.setOffset(516 * 0.15, 512 - slideHeight);
    } else {
      const slideHeight = GAME.DINO_SIZE * 0.3;
      this.body.setSize(GAME.DINO_SIZE * 0.7, slideHeight);
      this.body.setOffset(GAME.DINO_SIZE * 0.15, GAME.DINO_SIZE - slideHeight);
    }

    // 슬라이드 애니메이션 재생 (납작한 포즈 - scaleY 변경 없이 애니메이션으로 표현)
    this.play(`${this.dinoKey}_slide`);

    // 슬라이드 효과음
    soundGenerator.playSlide();

    // 일정 시간 후 자동 복귀 (0.8초)
    this.slideTimer = this.scene.time.delayedCall(GAME.SLIDE.DURATION, () => {
      this.endSlide();
    });
  }

  /**
   * 슬라이드 종료: 히트박스와 스프라이트를 원래대로 복원
   */
  endSlide() {
    if (!this.isSliding) return;
    this.isSliding = false;

    // 히트박스 원래대로 복원
    if (this.useImage) {
      this.body.setSize(516 * 0.5, 512 * 0.6);
      this.body.setOffset(516 * 0.25, 512 * 0.4);
    } else {
      this.body.setSize(GAME.DINO_SIZE * 0.5, GAME.DINO_SIZE * 0.6);
      this.body.setOffset(GAME.DINO_SIZE * 0.25, GAME.DINO_SIZE * 0.4);
    }

    // 타이머 정리
    if (this.slideTimer) {
      this.slideTimer.destroy();
      this.slideTimer = null;
    }

    // 달리기 애니메이션으로 복귀
    this.play(`${this.dinoKey}_run`);
  }

  // =========================================================
  // [P1] 피격 + 무적 시스템
  // =========================================================

  /**
   * 피격! 장애물/적에 닿았을 때 호출.
   * 무적이면 무시, 아니면 무적 모드 돌입 + 깜빡깜빡.
   * @returns {boolean} true=실제로 피격됨, false=무적이라 무시됨
   */
  hit() {
    // 무적 상태면 피격 무시 (이미 한 대 맞은 직후 또는 무적별 파워업)
    if (this.isInvincible) return false;

    // [P3] 방어막이 있으면 방어막 소멸 + 피격 무시
    if (this.hasShield) {
      this.hasShield = false;
      this.clearPowerUp();
      // 방어막 깨지는 느낌: 파란색 플래시
      this.scene.cameras.main.flash(150, 78, 174, 255);
      return false; // 피격 무시됨
    }

    // 슬라이드 강제 해제 (맞으면 일어남)
    if (this.isSliding) {
      this.endSlide();
    }

    // 무적 모드 시작
    this.isInvincible = true;

    // 깜빡깜빡 효과 (투명 <-> 불투명 100ms마다 전환)
    this.blinkTimer = this.scene.time.addEvent({
      delay: GAME.HEART.BLINK_INTERVAL,
      callback: () => {
        // 현재 투명이면 불투명으로, 불투명이면 투명으로
        this.setAlpha(this.alpha === 1 ? 0.3 : 1);
      },
      loop: true,
    });

    // 무적 해제 타이머 (난이도별 다른 시간)
    this.invincibleTimer = this.scene.time.delayedCall(this.invincibleDuration, () => {
      this.isInvincible = false;
      this.setAlpha(1); // 투명도 원래대로
      if (this.blinkTimer) {
        this.blinkTimer.destroy();
        this.blinkTimer = null;
      }
    });

    return true; // 피격됨
  }

  /**
   * 넘어짐 (게임오버 시 호출)
   */
  fall() {
    // 슬라이드/무적/파워업 상태 모두 정리
    if (this.isSliding) this.endSlide();
    if (this.blinkTimer) { this.blinkTimer.destroy(); this.blinkTimer = null; }
    if (this.invincibleTimer) { this.invincibleTimer.destroy(); this.invincibleTimer = null; }
    this.isInvincible = false;
    this.setAlpha(1);

    // [P3] 파워업 정리
    this.clearPowerUp();

    this.play(`${this.dinoKey}_fall`);
  }

  /**
   * 매 프레임 호출: 착지 감지
   * GameScene에서 직접 onLand()를 호출하므로, 여기서는 별도 처리 안 함
   * (하위 호환을 위해 메서드는 유지)
   */
  update() {
    // 착지 감지는 GameScene에서 body.blocked.down 체크 후 onLand() 호출로 처리

    // 프테라노 특수능력(활강): 공중에서 하강 중일 때 중력을 50%로 줄여
    // 날개가 있어서 천천히 내려옴 (파라슈트처럼!)
    if (this.ability === 'glide' && !this.body.blocked.down) {
      if (this.body.velocity.y > 0) {
        // 하강 중이면 중력을 절반으로 줄임 (기본 800 → 400)
        this.body.setGravityY(GAME.GRAVITY * 0.5);
      } else {
        // 상승 중에는 기본 중력 유지 (점프 높이에는 영향 없음)
        this.body.setGravityY(GAME.GRAVITY);
      }
    } else if (this.ability === 'glide' && this.body.blocked.down) {
      // 착지하면 기본 중력으로 복원
      this.body.setGravityY(GAME.GRAVITY);
    }
  }
}
