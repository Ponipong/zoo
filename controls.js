// controls.js
// 방(room) 안에서의 키보드(WASD/방향키) + 가상 D-pad 실시간 이동을
// requestAnimationFrame 루프로 처리한다. 허브 지도에서는 이 루프가 완전히
// 멈춰 있어서 키 입력이 지도에 영향을 주지 않는다 (startRoom/stopRoom으로 전환).

const ZooControls = (function () {
  const SPEED = 190; // world px/sec
  const NEAR_RADIUS = 110;

  const state = {
    worldX: 0,
    worldY: 0,
    facingLeft: false,
    isMoving: false,
    isAutoMoving: false,
  };

  const keys = { up: false, down: false, left: false, right: false };
  const KEY_MAP = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
  };

  let roomActive = false;
  let rafId = null;
  let lastTime = null;
  let bounds = null;
  let currentZone = null;
  let lastCamera = { camX: 0, camY: 0 };
  let viewportEl, worldEl, visitor, visitorBody, visitorSprite;
  let boundOnce = false;

  function interruptAutoMove() {
    if (!state.isAutoMoving) return;
    if (window.ZooAnimations) window.ZooAnimations.cancelClickMove();
    state.isAutoMoving = false;
  }

  function bindOnce() {
    if (boundOnce) return;
    boundOnce = true;

    window.addEventListener("keydown", (e) => {
      if (!roomActive) return;
      const dir = KEY_MAP[e.code];
      if (!dir) return;
      if (ZooApp.isAnyModalOpen()) return;
      interruptAutoMove();
      keys[dir] = true;
      e.preventDefault();
    });
    window.addEventListener("keyup", (e) => {
      const dir = KEY_MAP[e.code];
      if (dir) keys[dir] = false;
    });
    window.addEventListener("blur", () => {
      keys.up = keys.down = keys.left = keys.right = false;
    });

    const dpad = document.getElementById("dpad");
    if (dpad) {
      dpad.querySelectorAll("[data-dir]").forEach((btn) => {
        const dir = btn.dataset.dir;
        const press = (e) => {
          e.preventDefault();
          if (!roomActive) return;
          interruptAutoMove();
          keys[dir] = true;
          btn.classList.add("is-pressed");
        };
        const release = () => {
          keys[dir] = false;
          btn.classList.remove("is-pressed");
        };
        btn.addEventListener("pointerdown", press);
        btn.addEventListener("pointerup", release);
        btn.addEventListener("pointerleave", release);
        btn.addEventListener("pointercancel", release);
      });
    }

    document.getElementById("roomViewport").addEventListener("click", (e) => {
      if (!roomActive) return;
      if (e.target.closest(".room__hit, #roomHud")) return;
      if (ZooApp.isAnyModalOpen()) return;
      const rect = viewportEl.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const targetWorldX = screenX + lastCamera.camX;
      const targetWorldY = screenY + lastCamera.camY;
      const clamped = clampToRoom(targetWorldX, targetWorldY);
      if (window.ZooAnimations) {
        window.ZooAnimations.startClickMove(clamped.x, clamped.y, onAutoMoveFrame, onAutoMoveDone);
        state.isAutoMoving = true;
      }
    });

    window.addEventListener("resize", () => {
      if (currentZone) Camera.setWorldSize(bounds.width, bounds.height);
    });
  }

  function clampToRoom(x, y) {
    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
  }

  function onAutoMoveFrame(x, y) {
    state.worldX = x;
    state.worldY = y;
    state.isMoving = true;
  }
  function onAutoMoveDone() {
    state.isAutoMoving = false;
    state.isMoving = false;
  }

  function tick(now) {
    if (!roomActive) return;
    if (lastTime == null) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!state.isAutoMoving) {
      let dx = 0;
      let dy = 0;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      const moving = dx !== 0 || dy !== 0;
      state.isMoving = moving;

      if (moving) {
        const len = Math.hypot(dx, dy) || 1;
        dx /= len;
        dy /= len;
        if (dx !== 0) state.facingLeft = dx < 0;
        const dist = SPEED * dt;
        const clamped = clampToRoom(state.worldX + dx * dist, state.worldY + dy * dist);
        state.worldX = clamped.x;
        state.worldY = clamped.y;
        if (window.ZooSound) window.ZooSound.footstep();
      }
    }

    updateVisuals();
    rafId = requestAnimationFrame(tick);
  }

  function updateVisuals() {
    lastCamera = Camera.follow(state.worldX, state.worldY, 1);
    worldEl.style.transform = "translate(" + Math.round(-lastCamera.camX) + "px, " + Math.round(-lastCamera.camY) + "px)";

    visitor.style.left = state.worldX + "px";
    visitor.style.top = state.worldY + "px";
    visitor.style.zIndex = String(Camera.depthIndex(state.worldY));
    visitorBody.classList.toggle("is-flipped", state.facingLeft);
    ZooApp.setZoneAnimalState(visitorSprite, state.isMoving);

    updateProximity();
  }

  // 배회 중인 동물은 GSAP transform으로 계속 움직이므로, 레이아웃 속성 대신
  // getBoundingClientRect + 카메라 역변환으로 "지금 화면에 실제로 보이는" 위치를
  // 구한다. 여러 마리가 있을 수 있으므로 전부 검사한다.
  function updateProximity() {
    const hits = worldEl.querySelectorAll(".room__hit");
    if (!hits.length) return;
    const viewportRect = viewportEl.getBoundingClientRect();
    hits.forEach((hit) => {
      const r = hit.getBoundingClientRect();
      const worldPosX = r.left + r.width / 2 - viewportRect.left + lastCamera.camX;
      const worldPosY = r.top + r.height / 2 - viewportRect.top + lastCamera.camY;
      const dist = Math.hypot(worldPosX - state.worldX, worldPosY - state.worldY);
      hit.classList.toggle("is-near", dist < NEAR_RADIUS);
    });
  }

  function worldToScreen(x, y) {
    return { x: x - lastCamera.camX, y: y - lastCamera.camY };
  }

  // ── 방 시작 / 종료 ──────────────────────────────────
  function startRoom(zone) {
    bindOnce();
    currentZone = zone;
    bounds = ZooApp.getRoomWalkBounds(zone);

    viewportEl = document.getElementById("roomViewport");
    worldEl = document.getElementById("roomWorld");
    visitor = document.getElementById("roomVisitor");
    visitorBody = document.getElementById("roomVisitorBody");
    visitorSprite = document.getElementById("roomVisitorSprite");
    ZooApp.applyCharacterSprite(visitorSprite);

    Camera.init(viewportEl, worldEl, bounds.width, bounds.height);

    state.worldX = bounds.width / 2;
    state.worldY = (bounds.minY + bounds.maxY) / 2;
    state.isAutoMoving = false;
    state.isMoving = false;
    keys.up = keys.down = keys.left = keys.right = false;

    if (window.ZooAnimations) window.ZooAnimations.startWandering(zone);
    if (window.ZooSound) window.ZooSound.setAmbient(zone.habitatType);

    roomActive = true;
    lastTime = null;
    updateVisuals();
    rafId = requestAnimationFrame(tick);
  }

  function stopRoom() {
    roomActive = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    keys.up = keys.down = keys.left = keys.right = false;
    if (window.ZooAnimations) window.ZooAnimations.cancelClickMove();
    if (window.ZooSound) window.ZooSound.stopAmbient();
  }

  return { startRoom, stopRoom, getState: () => state, worldToScreen };
})();

window.ZooControls = ZooControls;
