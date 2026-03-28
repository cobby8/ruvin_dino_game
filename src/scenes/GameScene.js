/**
 * GameScene.js - 3층: 메인홀 (실제 게임 플레이)
 * 공룡이 달리면서 장애물을 점프로 피하는 핵심 게임 로직
 *
 * 입력 방식 (페이즈 1에서 변경):
 * - 짧게 누르기 = 낮은 점프 (살짝 깡충)
 * - 길게 누르기 = 높은 점프 (크게 점프!)
 * - 공중에서 누르기 = 2단 점프 (공중 부스트)
 *
 * 난이도 시스템:
 * - DifficultyScene에서 선택한 난이도가 registry에 저장됨
 * - 여기서 꺼내서 속도, 간격, 2단 점프 등에 적용
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Dino } from '../objects/Dino.js';
import { ObstacleManager } from '../objects/Obstacle.js';
import { Background } from '../objects/Background.js';
import { soundGenerator } from '../utils/SoundGenerator.js';
import { DEFAULT_DIFFICULTY } from '../data/difficulties.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    // 현재 바닥 y좌표 계산 (화면 높이의 82% 지점)
    this.groundY = height * GAME.GROUND_Y_RATIO;

    // === 난이도 가져오기 (없으면 기본값 = 씩씩한공룡) ===
    this.difficulty = this.registry.get('selectedDifficulty') || DEFAULT_DIFFICULTY;

    // 게임 상태 초기화 (난이도에 따라 속도/간격이 달라짐)
    this.score = 0;
    this.currentSpeed = this.difficulty.initialSpeed;  // 난이도별 시작 속도
    this.isGameOver = false;
    this.lastObstacleTime = 0;
    this.nextObstacleDelay = 2000;  // 첫 장애물까지 2초 대기

    // === 배경 생성 (패럴랙스 4레이어) ===
    this.background = new Background(this, this.groundY);

    // === 바닥 물리 오브젝트 (보이지 않는 벽) ===
    this.ground = this.physics.add.staticBody(0, this.groundY, width, 20);

    // === 공룡 생성 ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    this.dino = new Dino(this, width * 0.2, this.groundY - 10, dinoKey);

    // 공룡에 난이도 정보 전달 (2단 점프 가능 여부 등)
    this.dino.setDifficulty(this.difficulty);

    // 공룡과 바닥의 충돌 설정
    this.physics.add.collider(this.dino, this.ground);

    // === 장애물 관리자 생성 ===
    this.obstacleManager = new ObstacleManager(this);

    // 공룡과 장애물의 충돌 = 게임오버
    this.physics.add.overlap(
      this.dino,
      this.obstacleManager.group,
      this._onHitObstacle,
      null,
      this
    );

    // === UI: 점수 텍스트 (상단 중앙) ===
    this.scoreText = this.add.text(width / 2, 30, '0', {
      fontFamily: 'Jua, sans-serif',
      fontSize: '32px',
      color: '#FFFFFF',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    // === 입력 설정 (페이즈 1: 누르기/떼기 분리) ===
    this._setupInput();

    // === 효과음 초기화 + BGM 시작 ===
    soundGenerator.init();
    soundGenerator.startBGM();

    // 게임 시작 시간 기록
    this.gameStartTime = this.time.now;

    // 착지 상태 추적 (이전 프레임에서 공중이었는지)
    this.wasInAir = false;

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 입력 설정: 터치 + 키보드 둘 다 지원
   * - 누르는 순간(DOWN) → startJump (즉시 낮은 점프 or 2단 점프)
   * - 떼는 순간(UP) → executeJump (길게 눌렀으면 높은 점프로 부스트)
   */
  _setupInput() {
    // === 터치/마우스 입력 ===
    this.input.on('pointerdown', () => {
      if (!this.isGameOver) {
        this.dino.startJump();
      }
    });

    this.input.on('pointerup', () => {
      if (!this.isGameOver) {
        this.dino.executeJump();
      }
    });

    // === 키보드 입력 (스페이스바) ===
    // keydown: 누르는 순간 (반복 입력 방지를 위해 isDown 플래그 사용)
    this.spaceIsDown = false;

    this.input.keyboard.on('keydown-SPACE', (event) => {
      // 키보드는 누르고 있으면 반복 발생 → 첫 번째만 처리
      if (this.spaceIsDown) return;
      this.spaceIsDown = true;

      if (!this.isGameOver) {
        this.dino.startJump();
      }

      // 페이지 스크롤 방지
      event.preventDefault();
    });

    // keyup: 떼는 순간
    this.input.keyboard.on('keyup-SPACE', (event) => {
      this.spaceIsDown = false;

      if (!this.isGameOver) {
        this.dino.executeJump();
      }
    });
  }

  /**
   * 매 프레임 호출되는 게임 루프 (초당 약 60번)
   * @param {number} time - 게임 시작 후 경과 시간 (ms)
   * @param {number} delta - 이전 프레임과의 시간차 (ms)
   */
  update(time, delta) {
    if (this.isGameOver) return;

    // === 배경 스크롤 ===
    this.background.update(this.currentSpeed, delta);

    // === 착지 감지: 공중이었다가 바닥에 닿으면 onLand() 호출 ===
    if (this.dino.body.blocked.down) {
      if (this.wasInAir) {
        this.dino.onLand(); // 착지 시 점프 상태 리셋
        this.wasInAir = false;
      }
    } else {
      this.wasInAir = true; // 현재 공중
    }

    // === 공룡 상태 업데이트 ===
    this.dino.update();

    // === 장애물 생성 타이머 (난이도별 간격 적용) ===
    if (time - this.lastObstacleTime > this.nextObstacleDelay) {
      this._spawnObstacle();
      this.lastObstacleTime = time;

      // 다음 장애물까지의 랜덤 대기시간 (난이도별 간격 사용)
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

    // === 화면 밖 장애물 정리 (재활용) ===
    this.obstacleManager.cleanup();

    // === 점수 체크: 장애물이 공룡 뒤를 지나면 +1 ===
    this.obstacleManager.group.getChildren().forEach(obstacle => {
      if (obstacle.active && !obstacle.scored && obstacle.x < this.dino.x - 20) {
        obstacle.scored = true;
        this.score++;
        this.scoreText.setText(String(this.score));
        soundGenerator.playScore();

        // 점수 텍스트 바운스 효과
        this.tweens.add({
          targets: this.scoreText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 100,
          yoyo: true,
        });

        // === 난이도 증가: 10점마다 속도 올리기 ===
        if (this.score % 10 === 0) {
          this.currentSpeed = Math.min(
            this.currentSpeed + GAME.SPEED_INCREMENT * 5,
            this.difficulty.maxSpeed  // 난이도별 최대 속도
          );
          this.obstacleManager.updateSpeed(this.currentSpeed);
        }

        // === 칭찬 메시지: PRAISE_INTERVAL점마다 표시 ===
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

  /** 공룡이 장애물에 부딪혔을 때 (게임오버) */
  _onHitObstacle(dino, obstacle) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // BGM 정지 + 게임오버 효과음
    soundGenerator.stopBGM();
    soundGenerator.playGameOver();

    // 공룡 넘어짐 애니메이션
    dino.fall();

    // 물리 일시정지 (모든 움직임 멈춤)
    this.physics.pause();

    // 화면 깜빡임 효과 (빨간색 플래시)
    this.cameras.main.flash(300, 255, 100, 100);

    // 0.8초 후 GameOver 씬으로 전환
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
      });
    });
  }

  /** 칭찬 메시지 표시 (팝업 트윈) */
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

    if (this.scoreText) {
      this.scoreText.setPosition(width / 2, 30);
    }
  }

  shutdown() {
    soundGenerator.stopBGM();
    this.scale.off('resize', this._onResize, this);
    // 키보드 이벤트 정리
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.off('keyup-SPACE');
  }
}
