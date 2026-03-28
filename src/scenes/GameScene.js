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
import { GAME, DINOS } from '../config.js';
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
import { loadStats, saveStats, checkNewAchievements } from '../data/achievements.js';
import { loadAndClearPurchasedItems, addToWallet } from './ShopScene.js';
import { JumpButtonHUD } from '../objects/JumpGuideHUD.js';

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
    // 점수 분리: clearScore = 장애물/적 넘긴 횟수 (클리어 조건), starCount = 별 수집 (100개=목숨+1)
    this.clearScore = 0;  // 클리어 조건에만 사용되는 점수
    this.starCount = 0;   // 별 수집 수 (클리어와 무관, 100개=목숨+1)
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
    // 난이도별 장애물 크기 배율 (아기=0.8 작게, 전설=1.2 크게)
    this.obstacleScale = this.difficulty.obstacleScale || 1.0;

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
    // 하트 위치: y=72 (반투명 배경 패널 안에 들어가도록 조정)
    this.heartHUD = new HeartHUD(this, maxHearts, 20, 72);
    this.hitCount = 0; // 이번 스테이지에서 피격 횟수 (통계용)

    // === [P2] 적 캐릭터 매니저 (월드별 적 스폰) ===
    this.enemyManager = new EnemyManager(this, this.worldData.id);

    // === [P2] 이펙트 매니저 (처치 이펙트 + 점수 팝업) ===
    this.effectManager = new EffectManager(this);

    // === [P3] 아이템 매니저 (별, 하트, 파워업 아이템 관리) ===
    this.itemManager = new ItemManager(this);

    // === [P3] 물음표 블록 매니저 ===
    this.questionBlockManager = new QuestionBlockManager(this);

    // === [P3] 파워업 HUD (공룡 머리 위에 표시, dino 참조 전달) ===
    this.powerUpHUD = new PowerUpHUD(this, this.dino);

    // === [P4] 스프링 점프대 매니저 ===
    this.springManager = new SpringManager(this);

    // === [P4] 부스트 패드 매니저 ===
    this.boostPadManager = new BoostPadManager(this);

    // === 콤보 시스템 (연속 밟기/넘기 시 배율 증가) ===
    this.comboCount = 0;           // 현재 콤보 수 (0이면 콤보 아님)
    this.comboTimer = null;        // 콤보 타임아웃 (2초 내 다음 성공 필요)
    this.comboMultiplier = 1;      // 현재 점수 배율 (콤보 수와 동일, 최대 5)

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

    // === 점프 버튼 HUD (우하단 고정, 시각 표시만) ===
    // 터치 입력은 _setupInput()의 pointerdown에서 좌표 체크로 처리
    this.jumpButtons = new JumpButtonHUD(this);

    // === 효과음 + BGM (월드별 다른 멜로디!) ===
    soundGenerator.init();
    soundGenerator.startBGM(this.worldData.id);

    // 화면 전환 효과: 검은색에서 밝아짐 (씬 진입 시)
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // 게임 시작 시간
    this.gameStartTime = this.time.now;

    // 착지 상태 추적
    this.wasInAir = false;

    // === 트리케라 특수능력: 게임 시작 시 방어막 1개 자동 부여 ===
    // 트리케라의 방패 뿔이 있어서 1회 피격을 무시!
    const dinoData = DINOS.find(d => d.key === dinoKey);
    if (dinoData && dinoData.ability === 'shield') {
      this.dino.applyPowerUp('shield');
    }

    // === 상점 구매 아이템 적용 (소모품: 사용 후 사라짐) ===
    this._hasDoubleStar = false; // 별 2배 아이템 사용 여부
    const purchasedItems = loadAndClearPurchasedItems();
    purchasedItems.forEach(itemId => {
      if (itemId === 'extra_heart') {
        // 추가 하트: maxHearts +1 (하트 HUD에 1개 추가)
        this.heartHUD.heal();
      } else if (itemId === 'shield_start') {
        // 시작 방어막: 방어막 파워업 부여
        this.dino.applyPowerUp('shield');
      } else if (itemId === 'magnet_start') {
        // 시작 자석: 자석 파워업 5초
        this.dino.applyPowerUp('magnet');
      } else if (itemId === 'double_star') {
        // 별 2배: 이번 게임 동안 별 수집량 2배
        this._hasDoubleStar = true;
      } else if (itemId === 'slow_start') {
        // 느린 시작: 시작 속도 30% 감소
        this.currentSpeed = Math.round(this.currentSpeed * 0.7);
      }
    });

    // === 업적 시스템: 게임 내 누적 통계 (스테이지 진행 중 임시 카운터) ===
    this._sessionStomps = 0;      // 이번 플레이에서 밟은 적 수
    this._sessionStars = 0;       // 이번 플레이에서 모은 별 수

    // === 눈 깜빡임(blink) 타이머 ===
    // 0.5초마다 5% 확률로 눈을 감았다 뜸 (생동감 있는 표정)
    this._blinkTimer = 0;         // 다음 깜빡임 체크까지 남은 시간
    this._isBlinking = false;     // 현재 깜빡이는 중인지

    // === 배경 특수 파티클 타이머 (월드별 분위기 연출) ===
    // 화산=불씨, 바다=물거품, 하늘=반짝이별
    this._bgParticleTimer = 0;    // 다음 파티클 생성까지 남은 시간
    this._bgParticles = [];       // 활성 배경 파티클 목록

    // === [P3-Pause] 일시정지 버튼 (우상단, || 모양 그래픽) ===
    // StageHUD 반투명 배경 위에 배치, depth 100 이상
    this._createPauseButton();

    // === [P3-Pause] ESC / P 키로 일시정지 ===
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    // 화면 크기 변경 대응
    this.scale.on('resize', this._onResize, this);
  }

  /**
   * 입력 설정: 터치 + 키보드 둘 다 지원
   */
  _setupInput() {
    // === 터치/마우스: 화면 아무 곳 터치 = 점프 (극단 단순화!) ===
    // 높은/낮은 구분 없음! 터치하면 점프, 공중이면 2단 점프
    // 아래로 스와이프 = 슬라이드 (기존 유지)
    this._pointerStartY = 0;
    this._pointerStartTime = 0;
    this._isPointerDown = false;     // 프테라노 비행용: 터치 누르고 있는지 추적

    // === 화면 터치 = 점프 (단순! 버튼 영역 판정 제거) ===
    this.input.on('pointerdown', (pointer) => {
      this._pointerStartY = pointer.y;
      this._pointerStartTime = Date.now();
      this._isPointerDown = true;    // 프테라노 비행용: 누르고 있는지 추적

      if (this.isGameOver || this.isStageClear) return;

      // 화면 아무 곳 터치 = 점프 (6살도 이해 가능!)
      this.dino.startJump(false);
    });

    this.input.on('pointerup', (pointer) => {
      this._isPointerDown = false;   // 프테라노 비행용: 손 뗌

      if (!this.isGameOver && !this.isStageClear) {
        // 아래로 50px 이상 스와이프 = 슬라이드 (기존 유지)
        const deltaY = pointer.y - this._pointerStartY;
        const elapsed = Date.now() - this._pointerStartTime;
        if (deltaY > 50 && elapsed < 500) {
          this.dino.slide();
        }
      }
    });

    // === 키보드: SPACE/Z/X 모두 동일한 점프 (구분 없음!) ===
    this.spaceIsDown = false;
    this._zIsDown = false;
    this._xIsDown = false;

    // Z키: 점프 (낮은/높은 구분 없이 동일)
    this.input.keyboard.on('keydown-Z', (event) => {
      if (this._zIsDown) return;
      this._zIsDown = true;
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump(false);
      }
    });
    this.input.keyboard.on('keyup-Z', () => {
      this._zIsDown = false;
    });

    // X키: 점프 (Z키와 동일)
    this.input.keyboard.on('keydown-X', (event) => {
      if (this._xIsDown) return;
      this._xIsDown = true;
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump(false);
      }
    });
    this.input.keyboard.on('keyup-X', () => {
      this._xIsDown = false;
    });

    // SPACE키: 점프 (Z/X키와 동일)
    this.input.keyboard.on('keydown-SPACE', (event) => {
      if (this.spaceIsDown) return;
      this.spaceIsDown = true;
      if (!this.isGameOver && !this.isStageClear) {
        this.dino.startJump(false);
      }
      event.preventDefault();
    });
    this.input.keyboard.on('keyup-SPACE', (event) => {
      this.spaceIsDown = false;
    });

    // === 키보드 (아래 화살표 = 슬라이드) ===
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

    // [P3-Pause] ESC 또는 P 키로 일시정지 (JustDown = 한 번만 감지)
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this._pauseGame();
      return; // 일시정지 후 나머지 update 실행 불필요
    }

    // 배경 스크롤
    this.background.update(this.currentSpeed, delta);

    // 착지 감지 (body가 유효한지 먼저 확인)
    if (!this.dino || !this.dino.body) return;
    if (this.dino.body.blocked.down) {
      if (this.wasInAir) {
        this.dino.onLand();
        // 착지 충격파 이펙트 (공중에서 내려왔을 때만)
        this.effectManager.showLandingDust(this.dino.x, this.groundY);
        this.wasInAir = false;
      }
      // 달리기 먼지 (바닥에 있을 때만, 슬라이드 중이 아닐 때)
      if (!this.dino.isSliding) {
        this.effectManager.showRunDust(this.dino.x, this.groundY, time);
      }
    } else {
      this.wasInAir = true;
    }

    // 슬라이드 중 바닥 뚫기 방지: y좌표가 groundY 아래로 내려가지 않도록 보정
    if (this.dino.y > this.groundY) {
      this.dino.y = this.groundY;
    }

    // 프테라노 비행용: 터치/키보드를 누르고 있는지 매 프레임 전달
    // (프테라노가 점프 정점에서 이 값이 true면 비행 모드 발동)
    this.dino.isHoldingJump = this._isPointerDown || this.spaceIsDown || this._zIsDown || this._xIsDown;

    // 공룡 업데이트
    this.dino.update();

    // 장애물 생성 타이머
    if (time - this.lastObstacleTime > this.nextObstacleDelay) {
      this._spawnObstacle();
      this.lastObstacleTime = time;

      // 다음 장애물 간격 (난이도별, clearScore 기준으로 간격 조절)
      // 최소 간격 안전장치: 1000ms (800→1000, 전설 난이도에서도 반응 가능하도록)
      const gapMin = Math.max(
        this.difficulty.obstacleGapMin - this.clearScore * GAME.OBSTACLE_GAP_DECREASE,
        1000
      );
      const gapMax = Math.max(
        this.difficulty.obstacleGapMax - this.clearScore * GAME.OBSTACLE_GAP_DECREASE,
        1400
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
        if (item.active && item.body) {
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
    const obstacles = this.obstacleManager.group.getChildren();
    for (let i = 0; i < obstacles.length; i++) {
      const obstacle = obstacles[i];
      // 이미 스테이지 클리어 처리됐으면 더 이상 점수 체크 안 함
      if (this.isStageClear) break;
      if (obstacle.active && !obstacle.scored && obstacle.x < this.dino.x - 20) {
        obstacle.scored = true;

        // 콤보 증가 (장애물 넘기 성공!)
        this._addCombo();

        // 클리어 점수 +1 x 콤보 배율
        this.clearScore += this.comboMultiplier;
        soundGenerator.playScore();

        // HUD 업데이트 (클리어 점수)
        this.stageHUD.updateScore(this.clearScore);

        // === 스테이지 클리어 체크 (clearScore만 사용, 별은 제외) ===
        if (this.clearScore >= this.targetScore) {
          this._onStageClear();
          break; // 클리어 후 즉시 루프 종료 (추가 점수 방지)
        }

        // 속도 증가 (10점마다)
        if (this.clearScore % 10 === 0) {
          this.currentSpeed = Math.min(
            this.currentSpeed + GAME.SPEED_INCREMENT,
            this.difficulty.maxSpeed
          );
          this.obstacleManager.updateSpeed(this.currentSpeed);
        }

        // 칭찬 메시지 (PRAISE_INTERVAL마다)
        if (this.clearScore % GAME.PRAISE_INTERVAL === 0) {
          this._showPraise();
        }
      }
    }

    // === 눈 깜빡임 업데이트 (0.5초마다 5% 확률로 blink) ===
    this._updateBlink(delta);

    // === 배경 특수 파티클 (월드별 분위기 연출) ===
    this._updateBgParticles(time, delta);
  }

  /** 장애물 하나 생성 + [P3] 아이템/블록 스폰 */
  _spawnObstacle() {
    const { width } = this.scale;
    this.obstacleManager.spawn(width + 50, this.groundY, this.currentSpeed, this.obstacleScale);

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
    // 중복 호출 방지 (forEach 안에서 여러 장애물이 동시에 조건 충족 시)
    if (this.isStageClear) return;
    this.isStageClear = true;

    // 업적 시스템: 클리어 시 통계 저장 + 업적 체크
    this._saveStatsAndCheckAchievements(true);

    // 상점용: 클리어 시 모은 별을 wallet에 전액 누적 저장
    if (this.starCount > 0) {
      addToWallet(this.starCount);
    }

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

    // 1.5초 후 페이드아웃 → StageClearScene으로 전환
    this.time.delayedCall(1500, () => {
      if (!isLastStage) {
        this.registry.set('currentStage', nextStageId);
      }

      // 페이드아웃 후 씬 전환
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StageClearScene', {
          clearScore: this.clearScore,
          starCount: this.starCount,
          stageData: this.stageData,
          worldData: this.worldData,
          targetScore: this.targetScore,
          deathCount: this.deathCount || 0,
          isLastStage: isLastStage,
          nextStageId: nextStageId,
        });
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
    // 오브젝트 유효성 체크 (destroy된 오브젝트 접근 방지)
    if (!dino.active || !dino.body || !obstacle.active || !obstacle.body) return;

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
    // 중복 호출 방지 (동시에 장애물+적에 닿을 때)
    if (this.isGameOver) return;
    this.isGameOver = true;

    // 업적 시스템: 게임오버 시에도 통계 저장 (클리어는 아님)
    this._saveStatsAndCheckAchievements(false);

    // 상점용: 게임오버 시 모은 별의 50%를 wallet에 저장 (위로 보상)
    if (this.starCount > 0) {
      const halfStars = Math.ceil(this.starCount * 0.5);
      addToWallet(halfStars);
    }

    soundGenerator.stopBGM();
    soundGenerator.playGameOver();

    this.dino.fall();
    this.physics.pause();
    this.cameras.main.flash(300, 255, 100, 100);

    // 클리어 실패 정보
    this.registry.set('stageClear', false);

    this.time.delayedCall(800, () => {
      // 페이드아웃 후 씬 전환
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOverScene', {
          clearScore: this.clearScore,
          starCount: this.starCount,
          stageData: this.stageData,
          worldData: this.worldData,
          isFreeMode: this.isFreeMode,
          hitCount: this.hitCount,
        });
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
    // 오브젝트 유효성 체크
    if (!dino.active || !dino.body || !enemy.active || !enemy.body) return;
    if (!enemy.alive) return;

    // === 밟기 판정 ===
    // 조건: 공룡이 아래로 떨어지고 있고(velocity.y > 0),
    //       공룡의 발(bottom)이 적의 머리(top) 근처에 있음
    // 밟기 허용 범위를 2배로 확대 (15px → 30px, 더 쉽게 밟기 성공)
    const isStomping = dino.body.velocity.y > 0 &&
                       dino.body.bottom <= enemy.body.top + 30;

    // === 슬라이드 공격 판정 ===
    // 조건: 슬라이드(구르기) 중 + 바닥 적(ground 타입)
    const isSlideAttack = dino.isSliding && enemy.enemyData.type === 'ground';

    if (isStomping || isSlideAttack) {
      // 적 처치 성공!
      enemy.defeat();

      // 콤보 증가 (적 처치 성공!)
      this._addCombo();

      // 처치 이펙트 (연기 + 별 파티클 + "퍽!" 텍스트)
      this.effectManager.showDefeatEffect(enemy.x, enemy.y);

      // 적 처치 → clearScore에 콤보 배율 적용
      // 티라노 특수능력(강한밟기): 가장 강한 공룡이라 밟기 점수 2배!
      const stompBonus = this.dino.ability === 'strongStomp' ? 2 : 1;
      const earnedPoints = enemy.enemyData.points * this.comboMultiplier * stompBonus;
      this.effectManager.showScorePopup(enemy.x, enemy.y, earnedPoints);
      this.clearScore += earnedPoints;
      this.stageHUD.updateScore(this.clearScore);

      // 업적용: 밟기 카운트 누적
      this._sessionStomps++;

      // 처치 효과음
      soundGenerator.playEnemyDefeat();

      // 밟기 시 살짝 튀어오름 (마리오처럼!)
      if (isStomping) {
        dino.body.setVelocityY(-250);
      }

      // 스테이지 클리어 체크 (clearScore 기준)
      if (this.clearScore >= this.targetScore) {
        this._onStageClear();
        return; // 클리어 후 추가 처리 방지
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
    if (!item.active || !item.body) return;
    if (!dino.active || !dino.body) return;
    if (this.isGameOver || this.isStageClear) return;

    const type = item.itemType;

    if (type === 'star') {
      // 별: starCount +1 (클리어 점수와 별도, 100개=목숨+1)
      // 상점 '별 2배' 아이템 적용: 별 수집량이 2배!
      const starBonus = this._hasDoubleStar ? 2 : 1;
      this.starCount += GAME.ITEMS.STAR_POINTS * starBonus;
      this._sessionStars += starBonus;  // 업적용: 별 수집 누적
      soundGenerator.playItemCollect();

      // 아이템 수집 시 공룡이 잠깐 밝아지는 효과 (기쁜 표현)
      if (!this.dino.powerUp) {
        this.dino.setTint(0xFFFFCC);
        this.time.delayedCall(150, () => {
          if (this.dino && this.dino.active && !this.dino.powerUp) {
            this.dino.clearTint();
          }
        });
      }

      // 별 카운터 HUD 업데이트
      this.stageHUD.updateStarCount(this.starCount);

      // 100개마다 목숨 +1
      if (this.starCount >= GAME.STAR.LIFE_BONUS_COUNT) {
        this.starCount -= GAME.STAR.LIFE_BONUS_COUNT; // 100 차감 (나머지 유지)
        this.heartHUD.heal(); // 목숨 +1
        // "1UP!" 팝업 표시
        this.effectManager.showScorePopup(this.dino.x, this.dino.y - 50, '1UP!');
        soundGenerator.playPowerUp();
        // 별 카운터 다시 갱신 (차감 후)
        this.stageHUD.updateStarCount(this.starCount);
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
    if (!block.active || !block.body || block.isUsed) return;
    if (!dino.active || !dino.body) return;

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
    if (!dino.active || !dino.body || !spring.active || !spring.body) return;
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
    if (!dino.active || !dino.body || !pad.active || !pad.body) return;
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

  // =========================================================
  // 콤보 시스템
  // =========================================================

  /**
   * 콤보 증가: 장애물 넘기 또는 적 처치 시 호출
   * 2초 안에 다음 성공하면 콤보 유지, 아니면 리셋
   * 콤보 2이상이면 화면에 팝업 + 배율 적용
   */
  _addCombo() {
    this.comboCount++;

    // 배율 계산 (콤보 수 = 배율, 최대 5배)
    this.comboMultiplier = Math.min(this.comboCount, GAME.COMBO.MAX_MULTIPLIER);

    // 콤보 2 이상이면 팝업 표시
    if (this.comboCount >= 2) {
      const { width, height } = this.scale;
      this.effectManager.showCombo(width / 2, height * 0.3, this.comboCount);
    }

    // 기존 타이머 제거 후 새 타이머 설정 (2초 안에 다음 성공해야 유지)
    if (this.comboTimer) {
      this.comboTimer.destroy();
    }
    this.comboTimer = this.time.delayedCall(GAME.COMBO.TIMEOUT, () => {
      // 타임아웃: 콤보 리셋
      this.comboCount = 0;
      this.comboMultiplier = 1;
      this.comboTimer = null;
    });
  }

  // =========================================================
  // 배경 특수 파티클 (월드별 분위기)
  // =========================================================

  /**
   * 월드별 배경 파티클 업데이트
   * 화산(4): 하늘에서 떨어지는 작은 불씨
   * 바다(5): 바닥에서 올라오는 물거품
   * 하늘(6): 반짝이는 별 파티클
   */
  _updateBgParticles(time, delta) {
    const wid = this.worldData.id;
    // 월드 4, 5, 6만 파티클 생성
    if (wid !== 4 && wid !== 5 && wid !== 6) return;

    // 타이머 감소 (1~3초 간격으로 파티클 생성)
    this._bgParticleTimer -= delta;
    if (this._bgParticleTimer <= 0) {
      this._bgParticleTimer = Phaser.Math.Between(1000, 3000);
      this._spawnBgParticle(wid);
    }

    // 화면 밖으로 나간 파티클 정리
    this._bgParticles = this._bgParticles.filter(p => {
      if (p && p.active) return true;
      return false;
    });
  }

  /**
   * 월드별 배경 파티클 1개 생성
   * 작은 원을 트윈으로 이동 + 사라지게 처리
   */
  _spawnBgParticle(wid) {
    const { width, height } = this.scale;

    if (wid === 4) {
      // 화산: 하늘 상단에서 작은 불씨가 떨어짐 (주황/빨강 원)
      const x = Phaser.Math.Between(0, width);
      const color = Math.random() > 0.5 ? 0xFF6600 : 0xFF3300;
      const particle = this.add.circle(x, -10, Phaser.Math.Between(2, 4), color, 0.7);
      particle.setDepth(4);
      // 아래로 떨어지면서 좌우로 흔들리며 사라짐
      this.tweens.add({
        targets: particle,
        y: this.groundY,
        x: x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Sine.easeIn',
        onComplete: () => particle.destroy(),
      });
      this._bgParticles.push(particle);
    } else if (wid === 5) {
      // 바다: 바닥에서 작은 물거품이 올라옴 (흰/파란 원)
      const x = Phaser.Math.Between(0, width);
      const color = Math.random() > 0.5 ? 0xFFFFFF : 0x88CCFF;
      const size = Phaser.Math.Between(2, 5);
      const particle = this.add.circle(x, this.groundY, size, color, 0.5);
      particle.setDepth(4);
      // 위로 올라가면서 사라짐
      this.tweens.add({
        targets: particle,
        y: this.groundY - Phaser.Math.Between(50, 120),
        x: x + Phaser.Math.Between(-15, 15),
        alpha: 0,
        duration: Phaser.Math.Between(1500, 3000),
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy(),
      });
      this._bgParticles.push(particle);
    } else if (wid === 6) {
      // 하늘: 랜덤 위치에서 반짝이는 별 (노란/흰 원이 커졌다 작아졌다 사라짐)
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(20, height * 0.6);
      const color = Math.random() > 0.5 ? 0xFFD700 : 0xFFFFFF;
      const particle = this.add.circle(x, y, Phaser.Math.Between(1, 3), color, 0.8);
      particle.setDepth(4);
      // 반짝반짝 (확대 후 축소하며 사라짐)
      this.tweens.add({
        targets: particle,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: Phaser.Math.Between(1000, 2000),
        ease: 'Sine.easeInOut',
        onComplete: () => particle.destroy(),
      });
      this._bgParticles.push(particle);
    }
  }

  // =========================================================
  // 업적 시스템: 통계 저장 + 업적 체크
  // =========================================================

  /**
   * 게임 종료 시(클리어/게임오버) 누적 통계를 저장하고 업적을 체크
   * @param {boolean} isCleared - 스테이지를 클리어했는지 여부
   */
  _saveStatsAndCheckAchievements(isCleared) {
    const stats = loadStats();

    // 누적 통계 업데이트
    stats.totalStomps += this._sessionStomps;
    stats.totalStars += this._sessionStars;
    // 최대 콤보 갱신
    if (this.comboCount > stats.maxCombo) {
      stats.maxCombo = this.comboCount;
    }

    // 클리어 시: 클리어 스테이지 수 갱신 (진행도와 동기화)
    if (isCleared) {
      try {
        const progress = JSON.parse(localStorage.getItem('ruvin_dino_progress')) || {};
        stats.clearedStages = (progress.clearedStages || []).length;
      } catch {
        // 진행도 읽기 실패 시 기존값 유지
      }

      // 무피격 클리어 체크 (hitCount === 0이면 달성)
      if (this.hitCount === 0) {
        stats.noHitClear = true;
      }
    }

    // 사용한 공룡 기록 (중복 없이)
    const dinoKey = this.registry.get('selectedDino') || 'brachio';
    if (!Array.isArray(stats.usedDinos)) stats.usedDinos = [];
    if (!stats.usedDinos.includes(dinoKey)) {
      stats.usedDinos.push(dinoKey);
    }

    // 저장
    saveStats(stats);

    // 업적 체크: 새로 달성한 것이 있으면 배너 표시
    const newAchievements = checkNewAchievements(stats);
    if (newAchievements.length > 0) {
      // 첫 번째 업적만 배너로 표시 (여러 개면 3초 간격)
      newAchievements.forEach((ach, i) => {
        this.time.delayedCall(i * 3500, () => {
          this._showAchievementBanner(ach);
        });
      });
    }
  }

  /**
   * 업적 달성 배너: 화면 상단에 3초간 팝업
   * @param {object} achievement - 업적 데이터 (icon, name 등)
   */
  _showAchievementBanner(achievement) {
    const { width } = this.scale;

    // 배너 배경 (화면 상단에 가로로 긴 라운드 사각형)
    const bannerW = Math.min(width * 0.8, 300);
    const bannerH = 50;
    const bannerX = width / 2;
    const bannerY = -bannerH; // 화면 위에서 시작 (아래로 내려옴)

    const container = this.add.container(bannerX, bannerY).setDepth(300);

    // 배경
    const bg = this.add.graphics();
    bg.fillStyle(0xFFD700, 0.95);
    bg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 16);
    bg.lineStyle(2, 0xFF8C00, 1);
    bg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 16);
    container.add(bg);

    // 텍스트: "업적 달성! [아이콘] [이름]"
    const text = this.add.text(0, 0, `업적 달성! ${achievement.icon} ${achievement.name}`, {
      fontFamily: 'Jua, sans-serif',
      fontSize: '16px',
      color: '#5A3000',
      stroke: '#FFFFFF',
      strokeThickness: 1,
    }).setOrigin(0.5);
    container.add(text);

    // 위에서 아래로 슬라이드인
    this.tweens.add({
      targets: container,
      y: bannerH / 2 + 10,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // 3초 유지 후 위로 사라짐
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: container,
            y: -bannerH,
            alpha: 0,
            duration: 300,
            ease: 'Sine.easeIn',
            onComplete: () => container.destroy(),
          });
        });
      },
    });
  }

  // =========================================================
  // 눈 깜빡임 (blink) 시스템
  // =========================================================

  /**
   * 0.5초마다 5% 확률로 눈 깜빡임 → 생동감 있는 표정
   * blink 프레임(프레임5)을 잠깐 재생한 후 run으로 복귀
   */
  _updateBlink(delta) {
    if (!this.dino || !this.dino.body) return;
    // 바닥에서 달리는 중에만 깜빡임 (점프/슬라이드/게임오버 중엔 X)
    if (!this.dino.body.blocked.down || this.dino.isSliding) return;

    this._blinkTimer -= delta;
    if (this._blinkTimer <= 0) {
      this._blinkTimer = 500; // 0.5초마다 체크

      // 5% 확률로 깜빡임 발동
      if (!this._isBlinking && Math.random() < 0.05) {
        this._isBlinking = true;
        const dinoKey = this.dino.dinoKey;

        // blink 프레임 표시: 이미지 텍스처에는 blink 프레임이 없으므로
        // 이미지 사용 시 살짝 투명하게 만들어 깜빡이는 효과 표현
        if (this.dino.useImage) {
          this.dino.setAlpha(0.7); // 잠깐 살짝 투명하게
        } else {
          this.dino.setFrame(5); // Graphics 텍스처의 blink 프레임
        }

        // 150ms 후 달리기로 복귀
        this.time.delayedCall(150, () => {
          if (this.dino && this.dino.active && this.dino.body &&
              this.dino.body.blocked.down && !this.dino.isSliding &&
              !this.isGameOver && !this.isStageClear) {
            // 이미지 blink 시 투명도 복원
            if (this.dino.useImage) {
              this.dino.setAlpha(1);
            }
            this.dino.play(`${dinoKey}_run`);
          }
          this._isBlinking = false;
        });
      }
    }
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

    // [P3-Pause] 일시정지 버튼 위치도 재조정
    if (this._pauseBtnHitArea) {
      this._pauseBtnHitArea.setPosition(width - 40, 40);
    }
    if (this._pauseBtnGraphics) {
      this._pauseBtnGraphics.clear();
      this._drawPauseIcon(this._pauseBtnGraphics, width - 40, 40);
    }
  }

  /**
   * [P3-Pause] 우상단에 일시정지 버튼(|| 모양) 생성
   * - StageHUD 반투명 배경 위에 배치 (depth: 101)
   * - 터치 영역 넉넉하게 44x44
   */
  _createPauseButton() {
    const { width } = this.scale;
    const btnX = width - 40;  // 우상단
    const btnY = 40;

    // || 아이콘을 Graphics로 그림
    this._pauseBtnGraphics = this.add.graphics();
    this._pauseBtnGraphics.setDepth(101);
    this._drawPauseIcon(this._pauseBtnGraphics, btnX, btnY);

    // 터치/클릭 히트 영역 (투명 사각형, 44x44로 넉넉하게)
    this._pauseBtnHitArea = this.add.rectangle(btnX, btnY, 44, 44, 0xffffff, 0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    // 클릭/터치 시 일시정지
    this._pauseBtnHitArea.on('pointerdown', () => {
      this._pauseGame();
    });

    // 호버 효과: 아이콘 밝아짐
    this._pauseBtnHitArea.on('pointerover', () => {
      this._pauseBtnGraphics.clear();
      this._drawPauseIcon(this._pauseBtnGraphics, btnX, btnY, 1.0);
    });
    this._pauseBtnHitArea.on('pointerout', () => {
      this._pauseBtnGraphics.clear();
      this._drawPauseIcon(this._pauseBtnGraphics, btnX, btnY, 0.7);
    });
  }

  /**
   * [P3-Pause] || 아이콘 그리기 헬퍼
   * - 세로선 2개를 둥근 사각형으로 그림
   */
  _drawPauseIcon(graphics, x, y, alpha = 0.7) {
    graphics.fillStyle(0xffffff, alpha);
    // 왼쪽 세로선 (폭 5, 높이 20)
    graphics.fillRoundedRect(x - 9, y - 10, 5, 20, 2);
    // 오른쪽 세로선
    graphics.fillRoundedRect(x + 4, y - 10, 5, 20, 2);
  }

  /**
   * [P3-Pause] 게임 일시정지 처리
   * - 게임오버나 클리어 중에는 동작 안 함
   * - GameScene을 pause하고 PauseScene을 위에 launch
   */
  _pauseGame() {
    // 게임오버/클리어 상태에서는 일시정지 불가
    if (this.isGameOver || this.isStageClear) return;

    // GameScene 일시정지 (update 멈춤 + 물리 정지)
    this.scene.pause();

    // PauseScene을 위에 오버레이로 실행 (launch = 덮어서 실행)
    this.scene.launch('PauseScene', {
      // "다시하기"에 필요한 데이터 (registry에서도 읽지만 안전하게 전달)
      dinoKey: this.registry.get('selectedDino') || 'brachio',
      currentStage: this.registry.get('currentStage'),
      difficulty: this.difficulty,
    });
  }

  shutdown() {
    soundGenerator.stopBGM();
    this.scale.off('resize', this._onResize, this);
    this.input.keyboard.off('keydown-SPACE');
    this.input.keyboard.off('keyup-SPACE');
    this.input.keyboard.off('keydown-Z');
    this.input.keyboard.off('keyup-Z');
    this.input.keyboard.off('keydown-X');
    this.input.keyboard.off('keyup-X');
    this.input.keyboard.off('keydown-DOWN'); // [P1] 슬라이드 키 정리
    // [P3-Pause] ESC/P 키 해제
    if (this.escKey) this.input.keyboard.removeKey(this.escKey);
    if (this.pKey) this.input.keyboard.removeKey(this.pKey);

    // 공룡의 타이머 정리 (씬 종료 후 타이머가 실행되어 에러 발생 방지)
    if (this.dino) {
      if (this.dino.slideTimer) { this.dino.slideTimer.destroy(); this.dino.slideTimer = null; }
      if (this.dino.invincibleTimer) { this.dino.invincibleTimer.destroy(); this.dino.invincibleTimer = null; }
      if (this.dino.blinkTimer) { this.dino.blinkTimer.destroy(); this.dino.blinkTimer = null; }
      if (this.dino.powerUpTimer) { this.dino.powerUpTimer.destroy(); this.dino.powerUpTimer = null; }
    }

    // 콤보 타이머 정리
    if (this.comboTimer) {
      this.comboTimer.destroy();
      this.comboTimer = null;
    }

    // [P1] 하트 HUD 정리
    if (this.heartHUD) {
      this.heartHUD.destroy();
    }
    // [P3] 파워업 HUD 정리
    if (this.powerUpHUD) {
      this.powerUpHUD.destroy();
    }
    // 점프 버튼 HUD 정리
    if (this.jumpButtons) {
      this.jumpButtons.destroy();
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

    // 배경 파티클 정리
    if (this._bgParticles) {
      this._bgParticles.forEach(p => { if (p && p.active) p.destroy(); });
      this._bgParticles = [];
    }
  }
}
