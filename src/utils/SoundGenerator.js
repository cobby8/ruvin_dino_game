/**
 * SoundGenerator.js - 효과음 공장
 * Web Audio API로 코드만으로 소리를 만드는 유틸리티
 * (외부 오디오 파일 없이 순수 코드로 "삐-", "뿅-" 같은 소리 생성)
 */

export class SoundGenerator {
  constructor() {
    // AudioContext: 소리를 만들고 재생하는 공장 설비
    this.ctx = null;
  }

  /** AudioContext 초기화 (사용자 터치/클릭 후에만 가능 - 브라우저 정책) */
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // 일시정지 상태면 재개 (모바일에서 필요)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * 기본 소리 재생 함수
   * @param {number} startFreq - 시작 주파수 (높을수록 높은 음)
   * @param {number} endFreq - 끝 주파수 (주파수가 변하면 "삐이~" 효과)
   * @param {number} duration - 재생 시간 (초)
   * @param {string} type - 파형 타입 ('sine'=부드러운, 'square'=8비트풍)
   * @param {number} volume - 볼륨 (0~1)
   */
  _playTone(startFreq, endFreq, duration, type = 'sine', volume = 0.3) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // OscillatorNode: 소리를 만드는 진동자 (피아노 건반 하나라고 생각)
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    // 주파수를 서서히 변경 (올라가면 "삐이~↑", 내려가면 "뿌우~↓")
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

    // GainNode: 볼륨 조절기
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    // 끝날 때 서서히 소리 줄이기 (뚝 끊기지 않게)
    gain.gain.linearRampToValueAtTime(0, now + duration);

    // 연결: 진동자 -> 볼륨 -> 스피커
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /** 점프 소리: 짧고 상승하는 "뾰잉~" */
  playJump() {
    this._playTone(300, 600, 0.1, 'sine', 0.2);
  }

  /** 점수 획득 소리: 높은 "띵!" */
  playScore() {
    this._playTone(800, 800, 0.08, 'sine', 0.15);
  }

  /** 게임오버 소리: 내려가는 "뿌우~" */
  playGameOver() {
    this._playTone(500, 200, 0.3, 'square', 0.2);
  }

  /** 칭찬 소리: 올라가는 팡파레 느낌 "빠밤!" */
  playPraise() {
    // 두 음을 연속으로 재생해서 팡파레 느낌
    this._playTone(523, 523, 0.1, 'sine', 0.15);         // 도
    setTimeout(() => {
      this._playTone(659, 784, 0.15, 'sine', 0.15);      // 미 -> 솔
    }, 100);
  }

  /** [P1] 피격 소리: 짧은 하강음 "아야!" (200Hz→100Hz, 0.15초) */
  playHit() {
    this._playTone(300, 100, 0.15, 'square', 0.25);
    // 약간 뒤에 낮은 울림 추가 (아픈 느낌 강조)
    setTimeout(() => {
      this._playTone(100, 80, 0.1, 'sine', 0.15);
    }, 100);
  }

  /** [P2] 적 처치 소리: 짧은 타격음 "퍽!" + 높은 "띵!" */
  playEnemyDefeat() {
    // 타격음 (짧고 둔탁한 소리)
    this._playTone(400, 200, 0.08, 'square', 0.25);
    // 높은 띵 (처치 성공 느낌)
    setTimeout(() => {
      this._playTone(800, 1000, 0.12, 'sine', 0.2);
    }, 80);
  }

  /** [P3] 파워업 획득 소리: 상승 화음 "짜잔~!" (밝고 화려한 느낌) */
  playPowerUp() {
    // 도-미-솔 화음 (동시에 재생)
    this._playTone(523, 523, 0.15, 'sine', 0.12);   // 도
    this._playTone(659, 659, 0.15, 'sine', 0.12);   // 미
    this._playTone(784, 784, 0.15, 'sine', 0.12);   // 솔
    // 약간 뒤에 높은 도 추가 (팡파레 느낌)
    setTimeout(() => {
      this._playTone(1047, 1047, 0.2, 'sine', 0.15);
    }, 150);
  }

  /** [P3] 별/아이템 수집 소리: 짧은 "띵!" (playScore보다 가벼운 톤) */
  playItemCollect() {
    this._playTone(1000, 1200, 0.06, 'sine', 0.12);
  }

  /** [P3] 블록 타격 소리: 통통 + 띵 (마리오 블록 치는 느낌) */
  playBlockHit() {
    // 통통 (짧은 둔탁한 소리)
    this._playTone(200, 400, 0.08, 'square', 0.2);
    // 띵 (높은 음)
    setTimeout(() => {
      this._playTone(800, 1000, 0.1, 'sine', 0.15);
    }, 80);
  }

  /** [P4] 스프링 소리: "뿅!" 빠른 상승 스프링음 (200Hz→800Hz) */
  playSpring() {
    // 빠르게 상승하는 음 (스프링 튀는 느낌)
    this._playTone(200, 800, 0.15, 'sine', 0.25);
    // 약간 뒤에 높은 "띵!" (최고점 느낌)
    setTimeout(() => {
      this._playTone(1000, 1200, 0.1, 'sine', 0.15);
    }, 100);
  }

  /** [P4] 부스트 소리: "쉬이익!" 바람 소리 (화이트노이즈 + 상승음) */
  playBoost() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 상승하는 톤 (가속 느낌)
    this._playTone(300, 600, 0.3, 'sawtooth', 0.15);
    // 높은 울림 (속도감 표현)
    setTimeout(() => {
      this._playTone(800, 1000, 0.2, 'sine', 0.12);
    }, 150);
  }

  /** [P1] 슬라이드 소리: 빠른 하강 스윕 "쉭~" */
  playSlide() {
    this._playTone(500, 200, 0.12, 'sine', 0.15);
  }

  /** 선택 소리: 가볍게 "딩!" */
  playSelect() {
    this._playTone(600, 800, 0.08, 'sine', 0.15);
  }

  /** 스테이지 클리어 팡파레: 상승 음계 도-미-솔-도 (밝은 음색) */
  playStageClear() {
    // 도(523) → 미(659) → 솔(784) → 높은도(1047), 각 0.15초 간격
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playTone(freq, freq, 0.15, 'sine', 0.2);
      }, i * 150);
    });
  }

  /** 엔딩 축하 멜로디: 길고 화려한 상승 음계 + 트릴 */
  playEnding() {
    // 더 긴 멜로디: 도-레-미-파-솔-라-시-도 + 트릴
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playTone(freq, freq, 0.18, 'sine', 0.18);
      }, i * 180);
    });
    // 마지막에 트릴 효과 (높은 음에서 빠른 반복)
    setTimeout(() => {
      this._playTone(1047, 1200, 0.3, 'sine', 0.15);
    }, notes.length * 180);
    setTimeout(() => {
      this._playTone(1200, 1047, 0.3, 'sine', 0.15);
    }, notes.length * 180 + 150);
  }

  /**
   * BGM 시작: 월드별 다른 멜로디 루프
   * 각 월드마다 분위기에 맞는 음계, 템포, 파형이 다름
   * @param {number} worldId - 월드 번호 (1~6, 기본 1)
   */
  startBGM(worldId = 1) {
    if (!this.ctx) return;

    // 월드별 BGM 설정 (음계 + 템포 + 파형)
    // 풀밭=밝은 도레미파, 사막=이국적, 숲=경쾌, 화산=긴장감, 바다=평화, 하늘=신비
    const bgms = {
      1: { notes: [262, 294, 330, 349, 330, 294, 262],         tempo: 400, type: 'sine' },
      2: { notes: [220, 247, 262, 294, 262, 247, 220],         tempo: 350, type: 'triangle' },
      3: { notes: [330, 392, 440, 494, 440, 392, 330],         tempo: 450, type: 'sine' },
      4: { notes: [196, 220, 262, 196, 220, 196, 175],         tempo: 300, type: 'sawtooth' },
      5: { notes: [330, 349, 392, 440, 392, 349, 330],         tempo: 500, type: 'sine' },
      6: { notes: [440, 494, 523, 587, 523, 494, 440],         tempo: 350, type: 'triangle' },
    };

    const bgm = bgms[worldId] || bgms[1];
    const noteLength = bgm.tempo / 1000; // ms → 초 변환

    this._bgmInterval = setInterval(() => {
      bgm.notes.forEach((freq, i) => {
        setTimeout(() => {
          this._playTone(freq, freq, noteLength * 0.8, bgm.type, 0.05);
        }, i * bgm.tempo);
      });
    }, bgm.notes.length * bgm.tempo);
  }

  /** BGM 정지 */
  stopBGM() {
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = null;
    }
  }
}

// 싱글턴: 게임 전체에서 하나의 인스턴스만 사용
export const soundGenerator = new SoundGenerator();
