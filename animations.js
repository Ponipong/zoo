// animations.js
// GSAP은 보조 역할만 한다 — 실시간 이동은 controls.js가 전담하고, 이 파일은
// (1) 표지판→방 전환(줌/페이드), 방→지도 복귀, (2) 관람 통로 클릭/탭 자동 이동
// 트윈, (3) 방 안 동물의 배회(ambient) 애니메이션, (4) 파티클 피드백만 담당한다.

(function () {
  if (!window.gsap) return;

  let clickMoveTween = null;
  let wanderTweens = [];

  // ── 허브 지도 ↔ 동물 방 전환 ─────────────────────────
  function enterRoom(zoneId, triggerEl) {
    const zone = ZooApp.getZoneById(zoneId);
    if (!zone) return;
    const hubScreen = document.getElementById("hubScreen");
    const roomScreen = document.getElementById("roomScreen");

    gsap.to(hubScreen, {
      scale: 1.5,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        HubMap.hide();
        gsap.set(hubScreen, { scale: 1, opacity: 1 });

        ZooApp.renderRoom(zoneId);
        roomScreen.hidden = false;
        gsap.fromTo(
          roomScreen,
          { opacity: 0, scale: 0.92 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
              ZooControls.startRoom(zone);
              zone.visited = true;
            },
          }
        );
      },
    });
  }

  function exitRoom(zoneId) {
    ZooControls.stopRoom();
    stopWandering();
    const roomScreen = document.getElementById("roomScreen");

    gsap.to(roomScreen, {
      opacity: 0,
      scale: 0.94,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        roomScreen.hidden = true;
        gsap.set(roomScreen, { opacity: 1, scale: 1 });
        HubMap.updateVisitedBadges();
        HubMap.show(zoneId);
      },
    });
  }

  // ── 관람 통로 클릭/탭 자동 이동 ──────────────────────
  function startClickMove(targetX, targetY, onFrame, onDone) {
    if (clickMoveTween) clickMoveTween.kill();
    const state = ZooControls.getState();
    const proxy = { x: state.worldX, y: state.worldY };
    const dist = Math.hypot(targetX - proxy.x, targetY - proxy.y);
    if (dist < 4) {
      onDone();
      return;
    }
    const duration = Math.min(1.8, Math.max(0.2, dist / 220));
    clickMoveTween = gsap.to(proxy, {
      x: targetX,
      y: targetY,
      duration,
      ease: "none",
      onUpdate: () => onFrame(proxy.x, proxy.y),
      onComplete: () => {
        clickMoveTween = null;
        onDone();
      },
    });
  }

  function cancelClickMove() {
    if (clickMoveTween) {
      clickMoveTween.kill();
      clickMoveTween = null;
    }
  }

  // ── 방 안 동물 배회 (population 마리, 각자 독립적으로) ─
  function startWandering(zone) {
    stopWandering();
    const enclosure = document.querySelector("#roomWorld .room__enclosure");
    if (!enclosure) return;
    const hits = Array.from(enclosure.querySelectorAll(".room__hit"));
    if (!hits.length) return;

    hits.forEach((hit, idx) => {
      const img = hit.querySelector(".room__animal");
      let facingLeft = false;

      if (zone.floatOnWater) {
        wanderTweens.push(
          gsap.to(hit, { y: -4, duration: 1.4 + Math.random() * 0.8, ease: "sine.inOut", yoyo: true, repeat: -1 })
        );
      }

      function setFacing(shouldFaceLeft) {
        if (shouldFaceLeft === facingLeft) return;
        facingLeft = shouldFaceLeft;
        wanderTweens.push(gsap.to(hit, { scaleX: facingLeft ? -1 : 1, duration: 0.15, overwrite: "auto" }));
      }

      function cycle() {
        const boundsWidth = enclosure.clientWidth;
        const hitWidth = hit.offsetWidth || 40;
        const maxX = Math.max(0, boundsWidth - hitWidth);
        const currentX = gsap.getProperty(hit, "x") || 0;
        const targetX = Math.random() * maxX;
        const delta = targetX - currentX;
        const restFor = 0.9 + Math.random() * 2.6;

        if (Math.abs(delta) < 8 || maxX <= 0) {
          ZooApp.setZoneAnimalState(img, false);
          wanderTweens.push(gsap.delayedCall(restFor, cycle));
          return;
        }

        setFacing(delta < 0);
        ZooApp.setZoneAnimalState(img, true);
        const duration = Math.min(4, Math.max(0.7, Math.abs(delta) / 70));
        wanderTweens.push(
          gsap.to(hit, {
            x: targetX,
            duration,
            ease: "sine.inOut",
            onComplete: () => {
              ZooApp.setZoneAnimalState(img, false);
              wanderTweens.push(gsap.delayedCall(restFor, cycle));
            },
          })
        );
      }

      // 시작 위치와 시점을 흩어서 여러 마리가 한 몸처럼 동시에 움직이지 않게 한다.
      gsap.set(hit, { x: () => Math.random() * Math.max(0, enclosure.clientWidth - hit.offsetWidth) });
      wanderTweens.push(gsap.delayedCall(idx * 0.35 + Math.random() * 1.2, cycle));
    });
  }

  function stopWandering() {
    wanderTweens.forEach((t) => t && t.kill());
    wanderTweens = [];
  }

  // ── 파티클 피드백 (별/하트) ──────────────────────────
  function burstParticles(x, y, kind) {
    const host = document.getElementById("roomViewport");
    if (!host) return;
    const emoji = kind === "heart" ? "💗" : "✨";
    const count = 6;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "particle";
      el.textContent = emoji;
      el.style.left = x + "px";
      el.style.top = y + "px";
      host.appendChild(el);
      gsap.set(el, { xPercent: -50, yPercent: -50 });
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 34 + Math.random() * 28;
      gsap.to(el, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 16,
        opacity: 0,
        scale: 0.4,
        duration: 0.6 + Math.random() * 0.3,
        ease: "power2.out",
        onComplete: () => el.remove(),
      });
    }
  }

  window.ZooAnimations = {
    enterRoom,
    exitRoom,
    startClickMove,
    cancelClickMove,
    startWandering,
    stopWandering,
    burstParticles,
  };
})();
