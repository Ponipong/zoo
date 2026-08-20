// sound.js
// 선택적 사운드 — 오디오 파일 없이 Web Audio API로 발소리 + 방마다 다른
// 서식지 톤의 배경 앰비언스를 합성한다. 브라우저 자동재생 정책 때문에 반드시
// 사용자 제스처(캐릭터 선택 화면의 "입장하기" 클릭) 이후에만 AudioContext를
// 생성한다.

const ZooSound = (function () {
  let ctx = null;
  let muted = false;
  let lastStep = 0;
  let ambientNodes = null;

  // 서식지별 앰비언스 베이스 주파수(아주 낮고 조용한 드론) — 숲은 낮고 따뜻하게,
  // 빙하는 맑고 차갑게, 호수는 그 중간쯤으로.
  const HABITAT_TONE = {
    forest: 110,
    lake: 140,
    ice: 220,
    farm: 130,
    savanna: 100,
  };

  function unlock() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    ctx = new AudioCtx();
  }

  function footstep() {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    if (now - lastStep < 0.12) return;
    lastStep = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 150 + Math.random() * 40;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 방에 들어갈 때마다 그 서식지 톤의 아주 조용한 드론을 켜고, 방을 나가면 끈다.
  function setAmbient(habitatType) {
    stopAmbient();
    if (!ctx || muted) return;
    const freq = HABITAT_TONE[habitatType] || 120;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    ambientNodes = { osc, gain };
  }

  function stopAmbient() {
    if (!ambientNodes || !ctx) return;
    const { osc, gain } = ambientNodes;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.stop(now + 0.32);
    ambientNodes = null;
  }

  function setMuted(next) {
    muted = next;
    if (muted) stopAmbient();
    return muted;
  }

  function toggleMuted() {
    return setMuted(!muted);
  }

  return { unlock, footstep, setAmbient, stopAmbient, toggleMuted, isMuted: () => muted };
})();

window.ZooSound = ZooSound;
