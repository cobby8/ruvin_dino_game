/**
 * GameScene.js - 3층: 메인홀 (실제 게임 플레이)
 * 공룡이 달리면서 장애물을 점프로 피하는 핵심 게임 로직
 *
 * 입력 방식 (페이즈 1):
 * - 짧게 누르기 = 낮은 점프
 * - 길게 누르기 = 높은 점프
 * - 공중에서 누르기 = 2단 점프
 *
 * 스테이지 시스템 (페이즈 2):
 * - 30개 스테이지, 6개 월드 (각 월드 5스테이지)
 * - 월드별 배경 테마 + 장애물 세트가 바뀜
 * - 목표 장애물 수를 넘기면 스테이지 클리어!
 * - 난이도에 따라 목표 수가 달라짐 (아기공룡 x0.5 ~ 전설 x1.5)
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Dino } from '../objects/Dino.js';
import { ObstacleManager } from '../objects/Obstacle.js';
import { Background } from '../objects/Background.js';
import { StageHUD } from '../objects/StageHUD.js';
import { soundGenerator } from '../utils/SoundGenerator.js';
import { DEFAULT_DIFFICULTY } from '../data/difficulties.js';
import { HeartHUD } from '../objects/HeartHUD.js';
import { EnemyManager } from '../objects/Enemy.js';
import { EffectManager } from '../objects/EffectManager.js';
import { ItemManager } from '../objects/Item.js';
import { QuestionBlockManager } from '../objects/QuestionBlock.js';
import { PowerUpHUD } from '../objects/PowerUpHUD.js';
import { SpringManager } from '../objects/Spring.js';
import { BoostPadManager } from '../objects/BoostPad.js';
import { getStage, getStageTarget } from '../data/stages.js';
import { getWorld } from '../data/worlds.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    // 바닥 y좌표 (화면 높이의 82%)
    this.groundY = height * GAME.GROUND_Y_RATIO;

    // === 난이도 가져오기 ===
    this.difficulty = this.registry.get('selectedDifficulty') || DEFAULT_DIFFICULTY;

    // === 스테이지/월드 데이터 가져오기 ===
    // currentStage가 0이면 자유 모드 (무한 러너, 스테이지 없음)
    // currentStage가 없으면 1번 스테이지부터 시작
    const currentStageId = this.registry.get('currentStage');
    this.isFreeMode = (currentStageId === 0); // 자유 모드 여부

    if (this.isFreeMode) {
      // 자유 모드: 스테이지 1 데이터를 사용하되, 목표 없이 무한 플레이
      this.stageData = getStage(1);
      this.worldData = getWorld(1);
      this.targetScore = Infinity; // 목표 무한 = 절대 클리어 안됨
    } else {
      const stageId = currentStageId || 1;
      this.stageData = getStage(stageId);
      this.worldData = getWorld(this.stageData.world);
      // 실제 목표 점수 계산 (스테이지 기본값 x 난이도 배율)
      this.targetScore = getStageTarget(stageId, this.difficulty.id);
    }

    // === 게임 상태 초기화 ===
    this.score = 0;
    // 시작 속도 = 난이도 기본속도 + 스테이지 보너스
    this.currentSpeed = this.difficulty.initialSpeed + this.stageData.speedBonus;
    this.isGameOver = false;
    this.isStageClear = false;  // 스테이지 클리어 여부
    this.deathCount = 0;        // 이번 스테이지에서 죽은 횟수 (별 3개 조건에 사용)
    this.lastObstacleTime = 0;
    this.nextObstacleDelay = 2000;

    // === 배경 생성 (현재 월드 테마 적용) ===
    this.background = new Background(this, this.groundY, this.worldData.id);

    // === 바닥 물리 오브젝트 ===
    this.ground = this.physics.add.staticBody(0, this.groundY, width, 20);

    // === 공룡 생성 ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    this.dino = new Dino(this, width * 0.2, this.groundY - 10, dinoKey);
    this.dino.setDifficulty(this.difficulty);
    this.physics.add.collider(this.dino, this.ground);

    // === 장애물 관리자 (현재 월드 장애물 세트) ===
    this.obstacleManager = new ObstacleManager(this, this.worldData.id);

    // 공룡과 장애물 충돌 = 게임오버
    this.physics.add.overlap(
      this.dino,
      this.obstacleManager.group,
      this._onHitObstacle,
      null,
      this
    );

    // === [P1] 하트 HUD 생성 (화면 왼쪽 상단) ===
    const maxHearts = this.difficulty.maxHearts || 3;
    this.heartHUD = new HeartHUD(this, maxHearts, 30, 30);
    this.hitCount = 0; // 이번 스테이지에서 피격 횟수 (통계용)

    // === [P2] 적 캐릭터 매니저 (월드별 적 스폰) ===
    this.enemyManager = new EnemyManager(this, this.worldData.id);

    // === [P2] 이펙트 매니저 (처치 이펙트 + 점수 팝업) ===
    this.effectManager = new EffectManager(this);

    // === [P3] 아이템 매니저 (별, 하트, 파워업 아이템 관리) ===
    this.itemManager = new ItemManager(this);

    // === [P3] 물음표 블록 매니저 ===
    this.questionBlockManager = new QuestionBlockManager(this);

    // === [P3] 파워업 HUD (화면 우측 상단) ===
    this.powerUpHUD = new PowerUpHUD(this);

    // === [P4] 스프링 점프대 매니저 ===
    this.springManager = new SpringManager(this);

    // === [P4] 부스트 패드 매니저 ===
    this.boostPadManager = new BoostPadManager(this);

    // === [P4] 부스트 상태 관리 ===
    this.isBoosting = false;       // 부스트 모드 활성 여부
    this._speedLines = [];         // 속도선 이펙트 배열
    this._boostTimer = null;       // 부스트 해제 타이머

    // === [P3] 공룡 vs 아이템 충돌 (닿으면 수집) ===
    this.physics.add.overlap(
      this.dino,
      this.itemManager.group,
      this._onCollectItem,
      null,
      this
    );

    // === [P3] 공룡 vs 물음표 블록 충돌 (아래에서 머리로 침) ===
    this.physics.add.overlap(
      this.dino,
      this.questionBlockManager.group,
      this._onHitBlock,
      null,
      this
    );

    // === [P4] 공룡 vs 스프링 충돌 (위에서 밟으면 초고점프!) ===
    this.physics.add.overlap(
      this.dino,
      this.springManager.group,
      this._onHitSpring,
      null,
      this
    );

    // === [P4] 공룡 vs 부스트 패드 충돌 (바닥에서 밟으면 속도 2배!) ===
    this.physics.add.overlap(
      this.dino,
      this.boostPadManager.group,
      this._onHitBoostPad,
      null,
      this
    );

    // === [P2] 적 스폰 제어 변수 ===
    this.lastEnemyTime = 0;              // 마지막 적 스폰 시각
    this.nextEnemyDelay = 3000;           // 다음 적 스폰까지 대기 시간 (ms)
    this.enemySpawnChance = 0.35;         // 적 스폰 확률 (35%)

    // === [P2] 공룡 vs 적 충돌 판정 ===
    this.physics.add.overlap(
      this.dino,
      this.enemyManager.group,
      this._onHitEnemy,
      null,
      this
    );

    // === StageHUD (스테이지 정보 표시) ===
    // 자유 모드에서는 목표를 999로 표시 (무한 느낌)
    const displayTarget = this.isFreeMode ? 999 : this.targetScore;
    this.stageHUD = new StageHUD(
      this, this.stageData, this.worldData, this.difficulty, displayTarget
    );

    // === 입력 설정 ===
    this._setupInput();

    // === 효과음 + BGM ===
    soundGenerator.init();
    soundGenerator.startBGM();

    // 게임 시작 시간
    this.gameStartTime = this.time.now;

    // 착지 상태 추적
    this.wasInAir = false;

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 입력 설정: 터치 + 키보드 둘 다 지원
   */
  _setupInput() {
    // === 터치/마우스: 스와이프 감지 ===
    // 터치 시작 위치를 기록하여 위/아래 스와이프 구분
    this._pointerStartY = 0;
    this._pointerStartTime = 0;

    this.input.on('pointerdown', (pointer) => {
      this._pointerStartY = pointer.y;
      this._pointerStartTime = Date.now();
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump();
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.isGameOver && !this.isStageClear) {
        // [P1] 아래로 50px 이상 스와이프 = 슬라이드
        const deltaY = pointer.y - this._pointerStartY;
        const elapsed = Date.now() - this._pointerStartTime;
        if (deltaY > 50 && elapsed < 500) {
          // 아래로 빠르게 스와이프 → 슬라이드!
          this.dino.slide();
        } else {
          this.dino.executeJump();
        }
      }
    });

    // === 키보드 (스페이스바 = 점프) ===
    this.spaceIsDown = false;

    this.input.keyboard.on('keydown-SPACE', (event) => {
      if (this.spaceIsDown) return;
      this.spaceIsDown = true;
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump();
      }
      event.preventDefault();
    });

    this.input.keyboard.on('keyup-SPACE', (event) => {
      this.spaceIsDown = false;
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.executeJump();
      }
    });

    // === [P1] 키보드 (아래 화살표 = 슬라이드) ===
    this.input.keyboard.on('keydown-DOWN', (event) => {
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.slide();
      }
      event.preventDefault();
    });
  }

  /**
   * 매 프레임 호출되는 게임 루프
   */
  update(time, delta) {
    if (this.isGameOver || this.isStageClear) return;

    // 배경 스크롤
    this.background.update(this.currentSpeed, delta);

    // 착지 감지
    if (this.dino.body.blocked.down) {
      if (this.wasInAir) {
        this.dino.onLand();
        this.wasInAir = false;
      }
    } else {
      this.wasInAir = true;
    }

    // 공룡 업데이트
    this.dino.update();

    // 장애물 생성 타이머
    if (time - this.lastObstacleTime > this.nextObstacleDelay) {
      this._spawnObstacle();
      this.lastObstacleTime = time;

      // 다음 장애물 간격 (난이도별)
      const gapMin = Math.max(
        this.difficulty.obstacleGapMin - this.score * GAME.OBSTACLE_GAP_DECREASE,
        800
      );
      const gapMax = Math.max(
        this.difficulty.obstacleGapMax - this.score * GAME.OBSTACLE_GAP_DECREASE,
        1200
      );
      this.nextObstacleDelay = Phaser.Math.Between(gapMin, gapMax);
    }

    // 화면 밖 장애물 정리
    this.obstacleManager.cleanup();

    // === [P2] 적 매니저 업데이트 (비행 적 사인파 움직임) ===
    this.enemyManager.update(delta);
    this.enemyManager.cleanup();

    // === [P3] 아이템/블록 정리 (화면 밖 비활성화) ===
    this.itemManager.cleanup();
    this.questionBlockManager.cleanup();

    // === [P4] 스프링/부스트 정리 ===
    this.springManager.cleanup();
    this.boostPadManager.cleanup();

    // === [P3] 자석 파워업: 범위 내 아이템을 공룡 쪽으로 끌어당김 ===
    if (this.dino.powerUp === 'magnet') {
      this.itemManager.group.getChildren().forEach(item => {
        if (item.active) {
          const dist = Phaser.Math.Distance.Between(
            this.dino.x, this.dino.y, item.x, item.y
          );
          if (dist < GAME.ITEMS.MAGNET_RANGE) {
            // 공룡 방향으로 끌어당기기
            const angle = Phaser.Math.Angle.Between(
              item.x, item.y, this.dino.x, this.dino.y
            );
            item.x += Math.cos(angle) * GAME.ITEMS.MAGNET_SPEED;
            item.y += Math.sin(angle) * GAME.ITEMS.MAGNET_SPEED;
          }
        }
      });
    }

    // === [P2] 적 스폰 타이머 ===
    if (time - this.lastEnemyTime > this.nextEnemyDelay) {
      this._trySpawnEnemy(time);
    }

    // === 점수 체크: 장애물이 공룡 뒤를 지나면 +1 ===
    this.obstacleManager.group.getChildren().forEach(obstacle => {
      if (obstacle.active && !obstacle.scored && obstacle.x < this.dino.x - 20) {
        obstacle.scored = true;
        this.score++;
        soundGenerator.playScore();

        // HUD 업데이트
        this.stageHUD.updateScore(this.score);

        // === 스테이지 클리어 체크 ===
        if (this.score >= this.targetScore) {
          this._onStageClear();
          return;
        }

        // 속도 증가 (10점마다)
        if (this.score % 10 === 0) {
          this.currentSpeed = Math.min(
            this.currentSpeed + GAME.SPEED_INCREMENT * 5,
            this.difficulty.maxSpeed
          );
          this.obstacleManager.updateSpeed(this.currentSpeed);
        }

        // 칭찬 메시지 (PRAISE_INTERVAL마다)
        if (this.score % GAME.PRAISE_INTERVAL === 0) {
          this._showPraise();
        }
      }
    });
  }

  /** 장애물 하나 생성 + [P3] 아이템/블록 스폰 */
  _spawnObstacle() {
    const { width } = this.scale;
    this.obstacleManager.spawn(width + 50, this.groundY, this.currentSpeed);

    // === [P3] 장애물과 함께 아이템/블록 스폰 ===
    // 장애물 뒤쪽(더 오른쪽)에 아이템을 배치하여 보상으로 느끼게 함
    const itemX = width + 200; // 장애물보다 150px 뒤에

    // 40% 확률로 별 3~5개를 아치형으로 배치
    if (Math.random() < GAME.ITEMS.SPAWN_CHANCE) {
      this.itemManager.spawnStarLine(itemX, this.groundY, this.currentSpeed);
    }

    // 5% 확률로 하트 아이템 (높은 곳에 단독 배치)
    if (Math.random() < GAME.ITEMS.HEART_CHANCE) {
      const heartY = this.groundY - 120 - Math.random() * 60; // 바닥 위 120~180px
      this.itemManager.spawnItem('heart', itemX + 50, heartY, this.currentSpeed);
    }

    // 15% 확률로 물음표 블록 배치
    if (Math.random() < GAME.QUESTION_BLOCK.SPAWN_CHANCE) {
      this.questionBlockManager.spawnBlock(itemX + 100, this.groundY, this.currentSpeed);
    }

    // === [P4] 스테이지별 확률로 스프링 배치 ===
    const springChance = this.stageData.springChance || GAME.SPRING.SPAWN_CHANCE;
    if (Math.random() < springChance) {
      const spring = this.springManager.spawn(itemX + 180, this.groundY, this.currentSpeed);
      // 스프링 위에 별 아이템 아치형 배치 (보상!) - 스프링 생성 성공 시
      if (spring) {
        this.itemManager.spawnStarLine(itemX + 180, this.groundY - 100, this.currentSpeed);
      }
    }

    // === [P4] 스테이지별 확률로 부스트 패드 배치 ===
    const boostChance = this.stageData.boostChance || GAME.BOOST.SPAWN_CHANCE;
    if (Math.random() < boostChance) {
      this.boostPadManager.spawn(itemX + 250, this.groundY, this.currentSpeed);
    }
  }

  /**
   * 스테이지 클리어! (목표 달성)
   * 다음 스테이지로 넘어가거나, 마지막이면 축하
   */
  _onStageClear() {
    this.isStageClear = true;

    // BGM 정지
    soundGenerator.stopBGM();
    soundGenerator.playPraise(); // 칭찬 효과음

    // HUD에 클리어 표시
    this.stageHUD.showClear();

    // 물리 일시정지
    this.physics.pause();

    // 화면 금색 플래시 (클리어 축하)
    this.cameras.main.flash(300, 255, 215, 0);

    // registry에 클리어 정보 저장
    this.registry.set('stageClear', true);
    this.registry.set('clearedStageId', this.stageData.id);

    // 다음 스테이지 ID 계산
    const nextStageId = this.stageData.id + 1;
    const isLastStage = nextStageId > 30;

    // 1.5초 후 StageClearScene으로 전환
    this.time.delayedCall(1500, () => {
      if (!isLastStage) {
        // 다음 스테이지 설정
        this.registry.set('currentStage', nextStageId);
      }

      // StageClearScene으로 이동 (별 계산 + 진행도 저장은 그쪽에서)
      this.scene.start('StageClearScene', {
        score: this.score,
        stageData: this.stageData,
        worldData: this.worldData,
        targetScore: this.targetScore,
        deathCount: this.deathCount || 0,
        isLastStage: isLastStage,
        nextStageId: nextStageId,
      });
    });
  }

  /**
   * [P1] 공룡이 장애물에 부딪혔을 때 (하트 시스템 적용)
   * 기존: 즉시 게임오버
   * 변경: 하트 -1, 하트 0이면 게임오버
   */
  _onHitObstacle(dino, obstacle) {
    if (this.isGameOver || this.isStageClear) return;

    // 무적 상태면 피격 무시 (이미 한 대 맞은 직후)
    if (dino.isInvincible) return;

    // 슬라이드 중이고, 장애물이 높은 종류면 통과 (납작해서 피함)
    // 장애물의 y 위치가 바닥보다 높으면 = 높은 장애물 (새, 날아다니는 것)
    // 현재는 모든 장애물이 바닥 위에 있으므로, 슬라이드로는 피할 수 없음
    // (나중에 날아다니는 장애물이 추가되면 여기서 분기)

    // 공룡에게 피격 알림
    const damaged = dino.hit();
    if (!damaged) return; // 무적이라 무시됨

    // 피격 횟수 증가
    this.hitCount++;

    // 피격 효과음 "아야!"
    soundGenerator.playHit();

    // 화면 빨간색 플래시 (아이가 "맞았다"를 인지하게)
    this.cameras.main.flash(200, 255, 50, 50);

    // 하트 HUD에서 하트 1개 감소
    const isDead = this.heartHUD.takeDamage();

    if (isDead) {
      // 하트 0 = 게임오버!
      this._gameOver();
    }
  }

  /**
   * [P1] 게임오버 처리 (하트가 0이 되었을 때)
   */
  _gameOver() {
    this.isGameOver = true;

    soundGenerator.stopBGM();
    soundGenerator.playGameOver();

    this.dino.fall();
    this.physics.pause();
    this.cameras.main.flash(300, 255, 100, 100);

    // 클리어 실패 정보
    this.registry.set('stageClear', false);

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        stageData: this.stageData,
        worldData: this.worldData,
        isFreeMode: this.isFreeMode,
        hitCount: this.hitCount, // [P1] 피격 횟수도 전달
      });
    });
  }

  // =========================================================
  // [P2] 적 캐릭터 스폰 + 충돌 판정
  // =========================================================

  /**
   * [P2] 적 스폰 시도 (장애물과 교대로 등장)
   * 월드 1은 적이 없으므로 자동 스킵
   * @param {number} time - 현재 시각
   */
  _trySpawnEnemy(time) {
    this.lastEnemyTime = time;

    // 확률 체크 (35~50%, 월드가 올라갈수록 증가)
    const worldBonus = (this.worldData.id - 1) * 0.03; // 월드당 3% 증가
    const chance = this.enemySpawnChance + worldBonus;

    if (Math.random() < chance) {
      const { width } = this.scale;
      this.enemyManager.spawnEnemy(width + 60, this.groundY, this.currentSpeed);
    }

    // 다음 적 스폰 간격 (2~4초 사이 랜덤)
    this.nextEnemyDelay = Phaser.Math.Between(2000, 4000);
  }

  /**
   * [P2] 공룡이 적에 닿았을 때 판정
   * 핵심 로직:
   * - 위에서 떨어지면서 적의 상단에 닿음 = 밟기 성공 (적 처치!)
   * - 슬라이드 중 + ground 적 = 슬라이드 공격 (적 처치!)
   * - 그 외 옆에서 닿음 = 피격 (하트 -1)
   */
  _onHitEnemy(dino, enemy) {
    if (this.isGameOver || this.isStageClear) return;
    if (!enemy.alive) return;

    // === 밟기 판정 ===
    // 조건: 공룡이 아래로 떨어지고 있고(velocity.y > 0),
    //       공룡의 발(bottom)이 적의 머리(top) 근처에 있음
    const isStomping = dino.body.velocity.y > 0 &&
                       dino.body.bottom <= enemy.body.top + 15;

    // === 슬라이드 공격 판정 ===
    // 조건: 슬라이드(구르기) 중 + 바닥 적(ground 타입)
    const isSlideAttack = dino.isSliding && enemy.enemyData.type === 'ground';

    if (isStomping || isSlideAttack) {
      // 적 처치 성공!
      enemy.defeat();

      // 처치 이펙트 (별 파티클 + "퍽!" 텍스트)
      this.effectManager.showDefeatEffect(enemy.x, enemy.y);
      this.effectManager.showScorePopup(enemy.x, enemy.y, enemy.enemyData.points);

      // 점수 추가
      this.score += enemy.enemyData.points;
      this.stageHUD.updateScore(this.score);

      // 처치 효과음
      soundGenerator.playEnemyDefeat();

      // 밟기 시 살짝 튀어오름 (마리오처럼!)
      if (isStomping) {
        dino.body.setVelocityY(-250);
      }

      // 스테이지 클리어 체크
      if (this.score >= this.targetScore) {
        this._onStageClear();
      }
    } else {
      // 옆에서 닿음 = 피격!
      if (dino.isInvincible) return; // 무적이면 무시

      const damaged = dino.hit();
      if (!damaged) return;

      this.hitCount++;
      soundGenerator.playHit();
      this.cameras.main.flash(200, 255, 50, 50);

      const isDead = this.heartHUD.takeDamage();
      if (isDead) {
        this._gameOver();
      }
    }
  }

  // =========================================================
  // [P3] 아이템 수집 + 물음표 블록 타격
  // =========================================================

  /**
   * [P3] 아이템 수집 (공룡이 아이템에 닿았을 때)
   * 아이템 종류에 따라 다른 효과 적용
   */
  _onCollectItem(dino, item) {
    if (!item.active) return;

    const type = item.itemType;

    if (type === 'star') {
      // 별: 점수 +1
      this.score += GAME.ITEMS.STAR_POINTS;
      this.stageHUD.updateScore(this.score);
      soundGenerator.playItemCollect();

      // 스테이지 클리어 체크
      if (this.score >= this.targetScore) {
        item.collect();
        this._onStageClear();
        return;
      }
    } else if (type === 'heart') {
      // 하트: HP +1 회복
      this.heartHUD.heal();
      soundGenerator.playPowerUp();
    } else if (type === 'invincible' || type === 'magnet' || type === 'shield') {
      // 파워업 아이템: 공룡에 파워업 적용
      dino.applyPowerUp(type);
      soundGenerator.playPowerUp();
      this.powerUpHUD.show(type);
    }

    // 수집 이펙트 (확대 후 사라짐)
    item.collect();
  }

  /**
   * [P3] 물음표 블록 타격 (공룡이 아래에서 머리로 침)
   * 조건: 공룡이 상승 중(velocity.y < 0) + 공룡 top이 블록 bottom 근처
   */
  _onHitBlock(dino, block) {
    if (!block.active || block.isUsed) return;

    // 아래에서 머리로 치는 판정:
    // 공룡이 위로 올라가는 중 (상승 중) + 공룡 머리가 블록 바닥 근처
    const isFromBelow = dino.body.velocity.y < 0 &&
                        dino.body.top <= block.body.bottom + 10;

    if (!isFromBelow) return;

    // 블록 타격! → 랜덤 파워업 아이템 팝업
    const powerUpType = block.hit();
    if (!powerUpType) return;

    // 블록 타격 효과음
    soundGenerator.playBlockHit();

    // 블록 위에서 파워업 아이템 팝업 (위로 솟아오르는 느낌)
    const itemX = block.x;
    const itemY = block.y - 40; // 블록 위에서 팝업
    const spawnedItem = this.itemManager.spawnItem(powerUpType, itemX, itemY, this.currentSpeed);

    if (spawnedItem) {
      // 아이템이 위로 톡 튀어오르는 애니메이션
      this.tweens.add({
        targets: spawnedItem,
        y: itemY - 30,
        duration: 300,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    }
  }

  // =========================================================
  // [P4] 스프링 + 부스트 시스템
  // =========================================================

  /**
   * [P4] 스프링을 밟았을 때: 초고점프 발동!
   * 공룡이 하강 중(아래로 떨어지는 중)에만 발동
   */
  _onHitSpring(dino, spring) {
    if (this.isGameOver || this.isStageClear) return;
    if (spring.isUsed) return;

    // 하강 중에만 밟기 판정 (위에서 내려올 때만)
    if (dino.body.velocity.y > 0) {
      // 스프링 활성화 (압축 애니메이션)
      spring.activate();

      // 공룡에게 스프링 속도 적용 → 매우 높이 뜀!
      dino.body.setVelocityY(GAME.SPRING.VELOCITY);

      // 점프 애니메이션 재생
      dino.play(`${dino.dinoKey}_jump`);

      // "뿅!" 스프링 효과음
      soundGenerator.playSpring();

      // 카메라 살짝 흔들림 (스프링 느낌)
      this.cameras.main.shake(100, 0.005);
    }
  }

  /**
   * [P4] 부스트 패드를 밟았을 때: 2초간 속도 2배 + 무적!
   * 바닥에 있을 때만 발동
   */
  _onHitBoostPad(dino, pad) {
    if (this.isGameOver || this.isStageClear) return;
    if (pad.isUsed) return;
    if (!dino.body.blocked.down) return; // 바닥에서만

    // 이미 부스트 중이면 패드만 소모 (중복 부스트 방지)
    pad.activate();

    if (this.isBoosting) return;

    // 부스트 시작!
    this._startBoost();

    // "쉬이익!" 부스트 효과음
    soundGenerator.playBoost();
  }

  /**
   * [P4] 부스트 모드 시작
   * 2초간: 속도 2배 + 무적 + 속도선 이펙트 + 달리기 빠르게
   */
  _startBoost() {
    this.isBoosting = true;
    this.dino.isInvincible = true;

    // 속도 2배!
    this.currentSpeed *= GAME.BOOST.SPEED_MULTIPLIER;

    // 공룡 색상 변경 (주황 빛 = 불타는 느낌)
    this.dino.setTint(0xFF8800);

    // 속도선 이펙트 표시
    this._showSpeedLines();

    // 화면 약간 줌인 (속도감 강조)
    this.cameras.main.flash(200, 255, 200, 0, true);

    // 2초 후 부스트 해제
    this._boostTimer = this.time.delayedCall(GAME.BOOST.DURATION, () => {
      this._endBoost();
    });
  }

  /**
   * [P4] 부스트 모드 종료
   * 속도 원래대로 복귀 + 이펙트 제거
   */
  _endBoost() {
    if (!this.isBoosting) return;
    this.isBoosting = false;

    // 무적 해제 (피격 무적/파워업 무적이 아닌 부스트 무적만 해제)
    // 다른 무적 소스가 없으면 해제
    if (this.dino.powerUp !== 'invincible' && !this.dino.blinkTimer) {
      this.dino.isInvincible = false;
    }

    // 속도 원래대로
    this.currentSpeed /= GAME.BOOST.SPEED_MULTIPLIER;

    // 색상 복귀 (다른 파워업이 있으면 그 색으로, 없으면 원래)
    if (this.dino.powerUp === 'invincible') {
      this.dino.setTint(0xFFD700);
    } else if (this.dino.powerUp === 'magnet') {
      this.dino.setTint(0x9B59B6);
    } else if (this.dino.powerUp === 'shield') {
      this.dino.setTint(0x4EAEFF);
    } else {
      this.dino.clearTint();
    }

    // 속도선 제거
    this._hideSpeedLines();
  }

  /**
   * [P4] 속도선 이펙트 표시 (가로 줄무늬가 빠르게 지나감)
   * 부스트 중임을 시각적으로 알려주는 효과
   */
  _showSpeedLines() {
    const { width, height } = this.scale;

    // 기존 속도선 제거
    this._hideSpeedLines();

    // 6개의 가로 줄무늬를 랜덤 위치에 배치
    for (let i = 0; i < 6; i++) {
      const y = Phaser.Math.Between(30, height - 50);
      const lineWidth = Phaser.Math.Between(40, 100);

      const line = this.add.rectangle(
        width + lineWidth / 2, y,
        lineWidth, 2,
        0xFFDD00, 0.6
      ).setDepth(15);

      // 왼쪽으로 빠르게 이동하는 트윈 (반복)
      this.tweens.add({
        targets: line,
        x: -lineWidth,
        duration: Phaser.Math.Between(200, 400),
        repeat: -1,
        onRepeat: () => {
          // 반복할 때마다 새 위치에서 시작
          line.x = width + lineWidth / 2;
          line.y = Phaser.Math.Between(30, height - 50);
        },
      });

      this._speedLines.push(line);
    }
  }

  /**
   * [P4] 속도선 이펙트 제거
   */
  _hideSpeedLines() {
    this._speedLines.forEach(line => {
      this.tweens.killTweensOf(line);
      line.destroy();
    });
    this._speedLines = [];
  }

  /** 칭찬 메시지 */
  _showPraise() {
    soundGenerator.playPraise();

    const { width, height } = this.scale;
    const msg = Phaser.Utils.Array.GetRandom(GAME.PRAISE_MESSAGES);

    const praise = this.add.text(width / 2, height * 0.35, msg, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '40px',
      color: '#FFD700',
      stroke: '#FF6B00',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: praise,
      y: height * 0.2,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 1200,
      ease: 'Sine.easeOut',
      onComplete: () => praise.destroy(),
    });
  }

  /** 화면 크기 변경 대응 */
  _onResize(gameSize) {
    const { width, height } = gameSize;
    this.groundY = height * GAME.GROUND_Y_RATIO;

    if (this.ground) {
      this.ground.setPosition(0, this.groundY);
      this.ground.setSize(width, 20);
      this.ground.body.updateFromGameObject();
    }

    if (this.background) {
      this.background.resize(width, this.groundY);
    }
  }

  shutdown() {
    soundGenerator.stopBGM();
    this.scale.off('resize', this._onResize, this);
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.off('keyup-SPACE');
    this.input.keyboard.off('keydown-DOWN'); // [P1] 슬라이드 키 정리
    // [P1] 하트 HUD 정리
    if (this.heartHUD) {
      this.heartHUD.destroy();
    }
    // [P3] 파워업 HUD 정리
    if (this.powerUpHUD) {
      this.powerUpHUD.destroy();
    }
    // [P2] 적 매니저는 group이 씬과 함께 정리됨
    // [P3] 아이템/블록 매니저도 group이 씬과 함께 정리됨
    // [P4] 부스트 정리
    if (this.isBoosting) {
      this._endBoost();
    }
    if (this._boostTimer) {
      this._boostTimer.destroy();
    }
    this._hideSpeedLines();
  }
}
