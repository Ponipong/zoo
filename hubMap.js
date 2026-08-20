// hubMap.js
// 허브 화면(동물원 지도) — 표지판 배치/클릭, 확대(휠/핀치)·축소·드래그 패닝,
// 방문 현황(체크 배지) 표시. 표지판을 클릭하면 animations.js의 전환 이펙트를
// 거쳐 render.js가 해당 동물 방을 연다.

const HubMap = (function () {
  // zoo_map.html에 내장된 원본 지도 좌표계(480×238 픽셀을 4배 확대).
  const HUB_WIDTH = 1920;
  const HUB_HEIGHT = 952;
  const MIN_SCALE_CAP = 0.2;
  const MAX_SCALE = 2;

  let viewportEl, worldEl;
  let scale = 1;
  let panX = 0;
  let panY = 0;
  let pointers = new Map();
  let dragLast = null;
  let pinchStartDist = null;
  let pinchStartScale = 1;

  function minScale() {
    if (!viewportEl) return MIN_SCALE_CAP;
    // 첨부 지도처럼 첫 진입 시 전체 지도가 한눈에 들어오게 contain 배율을 쓴다.
    return Math.max(
      Math.min(viewportEl.clientWidth / HUB_WIDTH, viewportEl.clientHeight / HUB_HEIGHT),
      MIN_SCALE_CAP
    );
  }

  function clampAndApply() {
    const vw = viewportEl.clientWidth;
    const vh = viewportEl.clientHeight;
    scale = Math.max(minScale(), Math.min(MAX_SCALE, scale));
    const worldW = HUB_WIDTH * scale;
    const worldH = HUB_HEIGHT * scale;
    if (worldW <= vw) {
      panX = (vw - worldW) / 2;
    } else {
      panX = Math.max(vw - worldW, Math.min(0, panX));
    }
    if (worldH <= vh) {
      panY = (vh - worldH) / 2;
    } else {
      panY = Math.max(vh - worldH, Math.min(0, panY));
    }
    worldEl.style.transform = "translate(" + panX + "px, " + panY + "px) scale(" + scale + ")";
  }

  function zoomAt(clientX, clientY, factor) {
    zoomToAbsolute(clientX, clientY, scale * factor);
  }

  // 확대 중심점(clientX,clientY)이 화면상 같은 자리에 남도록 pan을 함께
  // 보정하면서, scale을 상대 배율이 아닌 절대값으로 맞춘다 (핀치 줌은 매 이동마다
  // "시작 시점 대비 현재 배율"을 절대값으로 계산하는 편이 누적 오차가 없다).
  function zoomToAbsolute(clientX, clientY, targetScale) {
    const rect = viewportEl.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - panX) / scale;
    const worldY = (localY - panY) / scale;
    scale = Math.max(minScale(), Math.min(MAX_SCALE, targetScale));
    panX = localX - worldX * scale;
    panY = localY - worldY * scale;
    clampAndApply();
  }

  function focusOn(worldX, worldY) {
    const vw = viewportEl.clientWidth;
    const vh = viewportEl.clientHeight;
    panX = vw / 2 - worldX * scale;
    panY = vh / 2 - worldY * scale;
    clampAndApply();
  }

  function bindPanZoom() {
    viewportEl.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        zoomAt(e.clientX, e.clientY, factor);
      },
      { passive: false }
    );

    viewportEl.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".signpost")) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      viewportEl.setPointerCapture(e.pointerId);
      if (pointers.size === 1) {
        dragLast = { x: e.clientX, y: e.clientY };
      } else if (pointers.size === 2) {
        pinchStartDist = pointerDistance();
        pinchStartScale = scale;
      }
    });

    viewportEl.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const dist = pointerDistance();
        if (pinchStartDist) {
          const targetScale = pinchStartScale * (dist / pinchStartDist);
          const center = pointerCenter();
          zoomToAbsolute(center.x, center.y, targetScale);
        }
      } else if (pointers.size === 1 && dragLast) {
        const dx = e.clientX - dragLast.x;
        const dy = e.clientY - dragLast.y;
        panX += dx;
        panY += dy;
        dragLast = { x: e.clientX, y: e.clientY };
        clampAndApply();
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = null;
      if (pointers.size === 0) dragLast = null;
    }
    viewportEl.addEventListener("pointerup", endPointer);
    viewportEl.addEventListener("pointercancel", endPointer);
    viewportEl.addEventListener("pointerleave", endPointer);

    window.addEventListener("resize", clampAndApply);
  }

  function pointerDistance() {
    const pts = Array.from(pointers.values());
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function pointerCenter() {
    const pts = Array.from(pointers.values());
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }

  // ── 표지판 ──────────────────────────────────────────
  function render() {
    worldEl.innerHTML = "";
    worldEl.style.width = HUB_WIDTH + "px";
    worldEl.style.height = HUB_HEIGHT + "px";

    const ground = document.createElement("img");
    ground.className = "hub-ground";
    ground.src = "assets/backgrounds/zoo-map-ground.png";
    ground.alt = "";
    ground.setAttribute("aria-hidden", "true");
    ground.draggable = false;
    worldEl.appendChild(ground);

    ZONES.forEach((zone) => {
      const post = document.createElement("button");
      post.type = "button";
      post.className = "signpost";
      post.dataset.zoneId = zone.id;
      post.style.left = zone.signpostPosition.x + "px";
      post.style.top = zone.signpostPosition.y + "px";
      post.setAttribute("aria-label", zone.name + " 방으로 이동");
      post.innerHTML =
        '<span class="signpost__board">' +
        '<img src="' + ZooApp.animalAsset(zone.animalSprite) + '" alt="" />' +
        "</span>" +
        '<span class="signpost__post" aria-hidden="true"></span>' +
        '<span class="signpost__label">' + zone.name + "</span>" +
        '<span class="signpost__badge" aria-hidden="true">✔</span>';
      post.addEventListener("click", () => {
        if (window.ZooAnimations) window.ZooAnimations.enterRoom(zone.id, post);
      });
      worldEl.appendChild(post);
    });

    updateVisitedBadges();
  }

  function updateVisitedBadges() {
    ZONES.forEach((zone) => {
      const post = worldEl.querySelector('.signpost[data-zone-id="' + zone.id + '"]');
      if (post) post.classList.toggle("is-visited", !!zone.visited);
    });
  }

  function show(focusZoneId) {
    document.getElementById("hubScreen").hidden = false;
    clampAndApply();
    if (focusZoneId) {
      const zone = ZooApp.getZoneById(focusZoneId);
      if (zone) focusOn(zone.signpostPosition.x, zone.signpostPosition.y);
    }
  }

  function hide() {
    document.getElementById("hubScreen").hidden = true;
  }

  function init() {
    viewportEl = document.getElementById("hubViewport");
    worldEl = document.getElementById("hubWorld");
    render();
    bindPanZoom();
    // 초기엔 지도 전체가 대략 다 보이는 배율로 시작.
    scale = minScale();
    panX = (viewportEl.clientWidth - HUB_WIDTH * scale) / 2;
    panY = (viewportEl.clientHeight - HUB_HEIGHT * scale) / 2;
    clampAndApply();
  }

  return { init, show, hide, updateVisitedBadges, HUB_WIDTH, HUB_HEIGHT };
})();

window.HubMap = HubMap;
