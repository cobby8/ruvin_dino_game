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

  /** 장애물 하나 생성 */
  _spawnObstacle() {
    const { width } = this.scale;
    this.obstacleManager.spawn(width + 50, this.groundY, this.currentSpeed);
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
  }
}
