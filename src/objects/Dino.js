/**
 * Dino.js - 공룡 캐릭터 클래스
 * 플레이어가 조종하는 공룡. 달리기, 점프(3종), 넘어짐 동작을 관리.
 *
 * 점프 시스템 (극단 단순화):
 * - 화면 아무 곳 터치 / SPACE / Z / X = 점프 (바닥에서)
 * - 공중에서 한 번 더 터치 = 2단 점프
 * - 높은/낮은 구분 없음! 항상 LOW_VELOCITY 사용
 *
 * 프테라노 특수능력: 비행 (점프 정점에서 터치 유지 시 3초간 공중 정지)
 *
 * 작동 방식:
 * 1. 아무 곳 터치 → 즉시 낮은 점프 (LOW_VELOCITY)
 * 2. 공중에서 아무 곳 터치 → 2단 점프 발동
 * 3. 프테라노: 정점에서 터치 유지 → 3초 비행
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

    // 관대한 히트박스 (6살 배려: 몸 중심부만 판정)
    if (this.useImage) {
      this.body.setSize(516 * 0.4, 512 * 0.5);
      this.body.setOffset(516 * 0.3, 512 * 0.45);
    } else {
      this.body.setSize(GAME.DINO_SIZE * 0.4, GAME.DINO_SIZE * 0.5);
      this.body.setOffset(GAME.DINO_SIZE * 0.3, GAME.DINO_SIZE * 0.45);
    }

    // 달리기 애니메이션 시작
    this.play(`${dinoKey}_run`);

    // 깊이 설정 (장애물 depth=5 보다 앞, UI depth=10 보다 뒤)
    this.setDepth(6);

    // === 점프 시스템 속성 초기화 ===
    this.jumpStartTime = 0;          // 점프 버튼 누른 시각 (ms)
    this.isJumpHeld = false;         // 버튼을 누르고 있는 중인지
    this.isDoubleJumpUsed = false;   // 이번 점프에서 2단 점프를 썼는지
    this._isJumping = false;         // 점프 중인지 (착지 전까지 true 유지)
    this._lastJumpTime = 0;          // 마지막 바닥 점프 시각 (쿨다운용)
    this.canDoubleJump = true;       // 난이도에 따라 2단 점프 허용 여부
    this.doubleJumpLimit = Infinity; // 스테이지 내 2단 점프 최대 횟수
    this.doubleJumpCount = 0;        // 현재까지 사용한 2단 점프 횟수

    // === 프테라노 비행 시스템 속성 ===
    this.isFlying = false;           // 비행 중인지 (프테라노 전용)
    this.flyTimer = null;            // 비행 지속 타이머
    this.flyDuration = 3000;         // 비행 지속 시간 (3초)
    this.isHoldingJump = false;      // GameScene에서 매 프레임 설정 (터치 누르고 있는지)

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
   * 점프 시작 (터치 / SPACE / Z / X 모두 동일)
   * - 바닥에 있으면: 항상 낮은 점프 (높은/낮은 구분 없음!)
   * - 공중에 있으면: 2단 점프 시도
   * - 비행 중이면: 무시 (프테라노가 날고 있을 때 점프 불가)
   * @param {boolean} isHigh - 미사용 (하위 호환용으로 파라미터만 유지)
   */
  startJump() {
    // 슬라이드 중에는 점프 불가
    if (this.isSliding) return;
    // 비행 중에는 점프 불가 (프테라노 전용)
    if (this.isFlying) return;

    if (this.body.blocked.down) {
      // 바닥 → 점프!
      const jumpMulti = this.ability === 'highJump' ? 1.2 : 1.0;
      this.body.setVelocityY(GAME.JUMP.LOW_VELOCITY * jumpMulti);
      this.play(`${this.dinoKey}_jump`);
      soundGenerator.playJump();
      this.isDoubleJumpUsed = false;
    } else {
      // 공중 → 2단 점프 시도 (doubleJump 내부에서 제한 체크)
      this.doubleJump();
    }
  }

  /**
   * 레거시: 버튼 분리로 미사용
   * 이전에는 버튼 떼는 순간(pointerup) 홀드 시간으로 높은/낮은 점프를 구분했으나,
   * 이제는 startJump(isHigh)에서 즉시 판정하므로 이 메서드는 빈 껍데기로 유지.
   * (하위 호환을 위해 메서드 자체는 삭제하지 않음)
   */
  executeJump() {
    // 의도적으로 비움 - 버튼 분리 방식으로 전환되어 홀드 부스트 로직 제거됨
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
    this._isJumping = false;         // 착지! 공중 상태 해제
    this.isJumpHeld = false;
    this.isDoubleJumpUsed = false;

    // 비행 중이었으면 강제 종료 (프테라노)
    if (this.isFlying) this.endFly();

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

    // 슬라이드 히트박스 (관대한 납작 판정 - 6살 배려)
    if (this.useImage) {
      const slideHeight = 512 * 0.25;
      this.body.setSize(516 * 0.45, slideHeight);
      this.body.setOffset(516 * 0.275, 512 - slideHeight);
    } else {
      const slideHeight = GAME.DINO_SIZE * 0.25;
      this.body.setSize(GAME.DINO_SIZE * 0.45, slideHeight);
      this.body.setOffset(GAME.DINO_SIZE * 0.275, GAME.DINO_SIZE - slideHeight);
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

    // 히트박스 원래대로 복원 (관대한 중심부 판정)
    if (this.useImage) {
      this.body.setSize(516 * 0.4, 512 * 0.5);
      this.body.setOffset(516 * 0.3, 512 * 0.45);
    } else {
      this.body.setSize(GAME.DINO_SIZE * 0.4, GAME.DINO_SIZE * 0.5);
      this.body.setOffset(GAME.DINO_SIZE * 0.3, GAME.DINO_SIZE * 0.45);
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
    // 슬라이드/무적/파워업/비행 상태 모두 정리
    if (this.isFlying) this.endFly();
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
   * 매 프레임 호출: 프테라노 비행 체크
   * isHoldingJump은 GameScene에서 매 프레임 설정 (터치 누르고 있는지)
   */
  update() {
    // === 프테라노 비행 능력: 점프 정점에서 터치 유지 시 3초간 공중 정지 ===
    // (기존 glide=하강 중 중력 50%를 완전 교체)
    if (this.ability === 'glide' && !this.body.blocked.down && !this.isFlying) {
      // 정점 근처: velocity.y가 -50 ~ 50 사이 (거의 멈춤 = 점프 꼭대기)
      // 이 순간 터치를 누르고 있으면 비행 모드 발동!
      if (Math.abs(this.body.velocity.y) < 50 && this.isHoldingJump) {
        this.startFly();
      }
    }

    // 비행 중인데 손을 떼면 → 비행 즉시 종료 (착륙 시작)
    if (this.isFlying && !this.isHoldingJump) {
      this.endFly();
    }

    // 착지하면 비행 강제 종료 (안전장치)
    if (this.isFlying && this.body.blocked.down) {
      this.endFly();
    }
  }

  // =========================================================
  // 프테라노 비행 시스템
  // =========================================================

  /**
   * 비행 시작: 중력 0 + 수직속도 0 → 공중에 멈춤!
   * 프테라노의 날개로 3초간 떠있는 능력
   */
  startFly() {
    if (this.ability !== 'glide') return;   // 프테라노만 가능
    if (this.isFlying) return;              // 이미 비행 중이면 무시
    if (this.body.blocked.down) return;     // 바닥에서는 비행 불가

    this.isFlying = true;
    this.body.setVelocityY(0);              // 수직 속도 0 (떠있기)
    this.body.setGravityY(0);               // 중력 0 (안 떨어짐)

    // 3초 후 자동 종료 (무한 비행 방지)
    this.flyTimer = this.scene.time.delayedCall(this.flyDuration, () => {
      this.endFly();
    });
  }

  /**
   * 비행 종료: 중력 복원 → 하강 시작
   */
  endFly() {
    if (!this.isFlying) return;
    this.isFlying = false;
    this.body.setGravityY(GAME.GRAVITY);    // 중력 복원 → 떨어지기 시작

    // 타이머 정리
    if (this.flyTimer) {
      this.flyTimer.destroy();
      this.flyTimer = null;
    }
  }
}
