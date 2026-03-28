/**
 * GameScene.js - 3층: 메인홀 (실제 게임 플레이)
 * 공룡이 달리면서 장애물을 점프로 피하는 핵심 게임 로직
 * 스페이스바 또는 화면 터치로 점프
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';
import { Dino } from '../objects/Dino.js';
import { ObstacleManager } from '../objects/Obstacle.js';
import { Background } from '../objects/Background.js';
import { soundGenerator } from '../utils/SoundGenerator.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;

    // 현재 바닥 y좌표 계산 (화면 높이의 82% 지점)
    this.groundY = height * GAME.GROUND_Y_RATIO;

    // 게임 상태 초기화
    this.score = 0;
    this.currentSpeed = GAME.INITIAL_SPEED;
    this.isGameOver = false;
    this.lastObstacleTime = 0;      // 마지막 장애물 생성 시각
    this.nextObstacleDelay = 2000;  // 첫 장애물까지 2초 대기

    // === 배경 생성 (패럴랙스 4레이어) ===
    this.background = new Background(this, this.groundY);

    // === 바닥 물리 오브젝트 (보이지 않는 벽) ===
    // 공룡이 바닥 아래로 떨어지지 않게 막아주는 투명한 바닥
    this.ground = this.physics.add.staticBody(0, this.groundY, width, 20);

    // === 공룡 생성 ===
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    this.dino = new Dino(this, width * 0.2, this.groundY - 10, dinoKey);

    // 공룡과 바닥의 충돌 설정 (바닥 위에 서있게)
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

    // === 입력 설정 ===
    // 스페이스바 (PC에서 점프)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // 화면 터치/클릭 (모바일 점프) - 게임 영역 전체를 터치 존으로
    this.input.on('pointerdown', () => {
      if (!this.isGameOver) {
        this.dino.jump();
      }
    });

    // === 효과음 초기화 + BGM 시작 ===
    soundGenerator.init();
    soundGenerator.startBGM();

    // 게임 시작 시간 기록
    this.gameStartTime = this.time.now;

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 매 프레임 호출되는 게임 루프 (초당 약 60번)
   * @param {number} time - 게임 시작 후 경과 시간 (ms)
   * @param {number} delta - 이전 프레임과의 시간차 (ms)
   */
  update(time, delta) {
    if (this.isGameOver) return; // 게임오버면 멈춤

    // === 배경 스크롤 ===
    this.background.update(this.currentSpeed, delta);

    // === 스페이스바 점프 체크 ===
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.dino.jump();
    }

    // === 공룡 상태 업데이트 (착지 감지 등) ===
    this.dino.update();

    // === 장애물 생성 타이머 ===
    if (time - this.lastObstacleTime > this.nextObstacleDelay) {
      this._spawnObstacle();
      this.lastObstacleTime = time;

      // 다음 장애물까지의 랜덤 대기시간 계산
      // 점수가 올라갈수록 간격이 줄어듦 (난이도 상승)
      const gapMin = Math.max(GAME.OBSTACLE_GAP_MIN - this.score * GAME.OBSTACLE_GAP_DECREASE, 800);
      const gapMax = Math.max(GAME.OBSTACLE_GAP_MAX - this.score * GAME.OBSTACLE_GAP_DECREASE, 1200);
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
            GAME.MAX_SPEED
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
    // 화면 오른쪽 밖에서 생성 (50px 여유)
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
        score: this.score, // 점수 전달
      });
    });
  }

  /** 칭찬 메시지 표시 (팝업 트윈) */
  _showPraise() {
    soundGenerator.playPraise();

    const { width, height } = this.scale;
    // 랜덤 칭찬 메시지 선택
    const msg = Phaser.Utils.Array.GetRandom(GAME.PRAISE_MESSAGES);

    const praise = this.add.text(width / 2, height * 0.35, msg, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '40px',
      color: '#FFD700',  // 금색
      stroke: '#FF6B00',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    // 아래에서 위로 올라가면서 사라지는 트윈
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

    // 바닥 위치 조정
    if (this.ground) {
      this.ground.setPosition(0, this.groundY);
      this.ground.setSize(width, 20);
      this.ground.body.updateFromGameObject();
    }

    // 배경 크기 조정
    if (this.background) {
      this.background.resize(width, this.groundY);
    }

    // 점수 텍스트 위치 조정
    if (this.scoreText) {
      this.scoreText.setPosition(width / 2, 30);
    }
  }

  shutdown() {
    // 씬 정리 (이벤트 리스너 해제)
    soundGenerator.stopBGM();
    this.scale.off('resize', this._onResize, this);
  }
}
