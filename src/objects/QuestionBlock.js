/**
 * QuestionBlock.js - 물음표 블록
 * 마리오의 "?" 블록처럼, 공룡이 아래에서 머리로 치면 아이템이 팝업됨.
 *
 * 작동 방식:
 * 1. 공중에 떠있는 노란 "?" 블록
 * 2. 공룡이 점프해서 아래에서 머리로 침 (상승 중 + 공룡 top이 블록 bottom 근처)
 * 3. 블록이 위로 톡 튀는 애니메이션 + 랜덤 파워업 아이템 팝업
 * 4. 블록 텍스처가 빈 블록(회색)으로 변경 → 한번만 작동
 *
 * 오브젝트 풀링: Obstacle/Enemy와 동일한 패턴
 */

import Phaser from 'phaser';
import { GAME } from '../config.js';

// ============================================================
// 물음표 블록 텍스처 생성 (BootScene에서 호출)
// ============================================================

/**
 * 블록 텍스처 생성
 * @param {Phaser.Scene} scene - BootScene
 */
export function createQuestionBlockTextures(scene) {
  _createActiveBlockTexture(scene);   // 노란 "?" 블록 (활성)
  _createUsedBlockTexture(scene);     // 회색 빈 블록 (사용 후)
}

/** 활성 물음표 블록: 노란 사각형(40x40) + "?" 텍스트 */
function _createActiveBlockTexture(scene) {
  const size = 40;
  const g = scene.add.graphics();

  // 노란 사각형 배경 (둥근 모서리)
  g.fillStyle(0xFFCC00);
  g.fillRoundedRect(2, 2, size - 4, size - 4, 6);

  // 테두리 (진한 갈색)
  g.lineStyle(3, 0x8B6914);
  g.strokeRoundedRect(2, 2, size - 4, size - 4, 6);

  // 안쪽 하이라이트 (밝은 노랑)
  g.fillStyle(0xFFDD44, 0.5);
  g.fillRoundedRect(5, 5, size - 10, (size - 10) / 2, 4);

  g.generateTexture('qblock_active', size, size);
  g.destroy();

  // "?" 텍스트를 별도로 그리기 (Graphics만으로는 텍스트 어려우므로 간단한 모양으로 대체)
  // 원과 선으로 "?" 모양 표현
  const g2 = scene.add.graphics();

  // 노란 배경 다시 그리기
  g2.fillStyle(0xFFCC00);
  g2.fillRoundedRect(2, 2, size - 4, size - 4, 6);
  g2.lineStyle(3, 0x8B6914);
  g2.strokeRoundedRect(2, 2, size - 4, size - 4, 6);
  g2.fillStyle(0xFFDD44, 0.5);
  g2.fillRoundedRect(5, 5, size - 10, (size - 10) / 2, 4);

  // "?" 모양 (갈색): 위쪽 반원 + 아래 선 + 점
  g2.lineStyle(3.5, 0x8B4513);
  // 반원 (물음표 윗부분)
  g2.beginPath();
  g2.arc(size / 2, 14, 7, Math.PI, 0, false);
  g2.strokePath();
  // 세로 선 (물음표 가운데)
  g2.lineBetween(size / 2 + 7, 14, size / 2, 24);
  // 점 (물음표 아래)
  g2.fillStyle(0x8B4513);
  g2.fillCircle(size / 2, 30, 2.5);

  g2.generateTexture('qblock_question', size, size);
  g2.destroy();
}

/** 사용된 빈 블록: 회색 사각형 */
function _createUsedBlockTexture(scene) {
  const size = 40;
  const g = scene.add.graphics();

  // 회색 사각형
  g.fillStyle(0x888888);
  g.fillRoundedRect(2, 2, size - 4, size - 4, 6);
  // 어두운 테두리
  g.lineStyle(3, 0x555555);
  g.strokeRoundedRect(2, 2, size - 4, size - 4, 6);

  g.generateTexture('qblock_used', size, size);
  g.destroy();
}

// ============================================================
// QuestionBlock 클래스: 개별 물음표 블록
// ============================================================

export class QuestionBlock extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'qblock_question');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 기본 설정
    this.body.setAllowGravity(false); // 공중에 떠있음
    this.body.setImmovable(true);     // 충돌해도 안 밀림
    this.setDepth(4);

    this.isUsed = false; // 이미 사용됐는지
    this.setActive(false);
    this.setVisible(false);
  }

  /**
   * 블록 초기화 (풀링에서 꺼낼 때)
   * @param {number} x - x좌표
   * @param {number} y - y좌표 (화면 높이의 50% 위치)
   * @param {number} speed - 현재 게임 속도
   */
  setup(x, y, speed) {
    // 이미지 텍스처(PNG)가 있으면 프레임 5(물음표블록)를 사용
    const useImage = this.scene.textures.exists('img_items');
    if (useImage) {
      this.setTexture('img_items', 5);
      // 이미지 스케일 1.5배 확대 (기존 3배에서 절반으로 축소)
      this.setScale((40 / 352) * 1.5);
    } else {
      this.setTexture('qblock_question');
      // Graphics 텍스처도 1.5배 확대 (기존 3에서 절반으로 축소)
      this.setScale(1.5);
    }
    this._useImage = useImage;

    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.isUsed = false;

    // 왼쪽으로 이동
    this.body.setVelocityX(-speed);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(18, 18); // 히트박스 (절반으로 축소)
  }

  /**
   * 블록 타격! (공룡이 아래에서 머리로 침)
   * @returns {string} 나온 아이템 종류 ('invincible', 'magnet', 'shield')
   */
  hit() {
    if (this.isUsed) return null;
    this.isUsed = true;

    // 블록 텍스처를 빈 블록으로 변경 (이미지 사용 시 Graphics 빈 블록으로 전환)
    this.setTexture('qblock_used');
    // 사용 후 빈 블록도 1.5배 확대 유지
    this.setScale(1.5);

    // 위로 톡 튀는 애니메이션
    const originalY = this.y;
    this.scene.tweens.add({
      targets: this,
      y: this.y - 15,
      duration: 100,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    // 랜덤 파워업 결정 (무적별 40%, 자석 30%, 방어막 30%)
    const roll = Math.random();
    if (roll < 0.4) return 'invincible';
    if (roll < 0.7) return 'magnet';
    return 'shield';
  }

  /**
   * 비활성화
   */
  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocityX(0);
  }
}

// ============================================================
// QuestionBlockManager: 물음표 블록 풀링 + 스폰 관리
// ============================================================

export class QuestionBlockManager {
  /**
   * @param {Phaser.Scene} scene - GameScene
   */
  constructor(scene) {
    this.scene = scene;

    // 물리 그룹 (풀링)
    this.group = scene.physics.add.group({
      classType: QuestionBlock,
      maxSize: 5,  // 한 번에 최대 5개
      runChildUpdate: false,
    });

    // 풀에 미리 생성
    for (let i = 0; i < 5; i++) {
      const block = new QuestionBlock(scene, -100, -100);
      this.group.add(block);
      block.setActive(false);
      block.setVisible(false);
    }
  }

  /**
   * 물음표 블록 스폰
   * @param {number} x - x좌표
   * @param {number} groundY - 바닥 y좌표
   * @param {number} speed - 현재 게임 속도
   */
  spawnBlock(x, groundY, speed) {
    const block = this.group.getChildren().find(b => !b.active);
    if (!block) return null;

    // 화면 높이의 50% 위치 (바닥 위 적당한 높이)
    const y = groundY * GAME.QUESTION_BLOCK.HEIGHT_RATIO;
    block.setup(x, y, speed);
    return block;
  }

  /**
   * 화면 밖 블록 비활성화
   */
  cleanup() {
    this.group.getChildren().forEach(block => {
      if (block.active && block.x < -50) {
        block.deactivate();
      }
    });
  }
}
