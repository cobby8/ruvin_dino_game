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
    // currentStage가 없으면 1번 스테이지부터 시작
    const currentStageId = this.registry.get('currentStage') || 1;
    this.stageData = getStage(currentStageId);
    this.worldData = getWorld(this.stageData.world);

    // 실제 목표 점수 계산 (스테이지 기본값 x 난이도 배율)
    this.targetScore = getStageTarget(currentStageId, this.difficulty.id);

    // === 게임 상태 초기화 ===
    this.score = 0;
    // 시작 속도 = 난이도 기본속도 + 스테이지 보너스
    this.currentSpeed = this.difficulty.initialSpeed + this.stageData.speedBonus;
    this.isGameOver = false;
    this.isStageClear = false;  // 스테이지 클리어 여부
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

    // === StageHUD (스테이지 정보 표시) ===
    this.stageHUD = new StageHUD(
      this, this.stageData, this.worldData, this.difficulty, this.targetScore
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
    // 터치/마우스
    this.input.on('pointerdown', () => {
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump();
      }
    });
    this.input.on('pointerup', () => {
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.executeJump();
      }
    });

    // 키보드 (스페이스바)
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

    // 1.5초 후 GameOverScene으로 전환 (임시 - 나중에 StageClearScene으로 교체)
    this.time.delayedCall(1500, () => {
      if (!isLastStage) {
        // 다음 스테이지 설정
        this.registry.set('currentStage', nextStageId);
      }

      this.scene.start('GameOverScene', {
        score: this.score,
        stageClear: true,
        stageData: this.stageData,
        worldData: this.worldData,
        isLastStage: isLastStage,
        nextStageId: nextStageId,
      });
    });
  }

  /** 공룡이 장애물에 부딪혔을 때 (게임오버) */
  _onHitObstacle(dino, obstacle) {
    if (this.isGameOver || this.isStageClear) return;
    this.isGameOver = true;

    soundGenerator.stopBGM();
    soundGenerator.playGameOver();

    dino.fall();
    this.physics.pause();
    this.cameras.main.flash(300, 255, 100, 100);

    // 클리어 실패 정보
    this.registry.set('stageClear', false);

    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        stageClear: false,
        stageData: this.stageData,
        worldData: this.worldData,
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
  }
}
