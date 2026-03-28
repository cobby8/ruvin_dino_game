/**
 * main.js - 건물 관리실 (게임 엔진 초기화)
 * Phaser 게임 인스턴스를 생성하고 모든 씬을 등록하는 진입점
 */
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { SelectScene } from './scenes/SelectScene.js';
import { DifficultyScene } from './scenes/DifficultyScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { StageClearScene } from './scenes/StageClearScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { PauseScene } from './scenes/PauseScene.js';

// Phaser 게임 설정 (레고 조립 설명서 같은 역할)
const config = {
  type: Phaser.AUTO,             // WebGL 우선, 안되면 Canvas로 자동 전환
  parent: 'game-container',      // 게임을 넣을 HTML div의 id

  // 화면 크기 설정 (세로 모드 모바일 기준)
  scale: {
    mode: Phaser.Scale.RESIZE,   // 브라우저 크기 변할 때 자동으로 맞춤
    width: 360,                  // 기본 가로 (모바일 세로모드 기준)
    height: 640,                 // 기본 세로
    autoCenter: Phaser.Scale.CENTER_BOTH, // 화면 정중앙에 배치
  },

  // 물리 엔진 설정 (공이 떨어지고 충돌하는 규칙)
  physics: {
    default: 'arcade',           // 간단한 2D 물리 (점프, 충돌 등)
    arcade: {
      gravity: { y: 0 },        // 전체 중력은 0, 공룡에만 개별 적용
      debug: false,              // true로 바꾸면 충돌 박스가 보임 (디버그용)
    },
  },

  // 배경색 (하늘색)
  backgroundColor: '#87CEEB',

  // 씬 등록 순서: Boot → Select → Difficulty → WorldMap → Game → StageClear → GameOver → Ending
  // 씬 등록 순서: Boot → Select → Difficulty → Tutorial → WorldMap → Shop → Game → StageClear → GameOver → Ending
  scene: [BootScene, SelectScene, DifficultyScene, TutorialScene, WorldMapScene, ShopScene, GameScene, PauseScene, StageClearScene, GameOverScene, EndingScene],

  // 렌더링 설정
  render: {
    pixelArt: false,             // 부드러운 렌더링 (픽셀 아트 스타일 아님)
    antialias: true,             // 안티앨리어싱: 도형 가장자리를 부드럽게
  },
};

// 게임 시작! (이 한 줄로 모든 게 돌아감)
const game = new Phaser.Game(config);
