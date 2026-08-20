// render.js
// 캐릭터 선택 화면 + 개별 동물 방(room) 렌더링 + 정보 모달.
// 허브 지도는 hubMap.js, 실시간 이동/게임 루프는 controls.js, 화면 전환/파티클은
// animations.js가 담당한다. 이 파일은 특정 동물 이름을 하드코딩하지 않고 ZONES를
// 순회해서 그린다.

const ANIMALS_PATH = "assets/animals/";
const CHARACTERS_PATH = "assets/characters/";
const BACKGROUNDS_PATH = "assets/backgrounds/";
const KEEPERS_PATH = "assets/keepers/";

// 방 크기(roomSize)는 고정 픽셀이 아니라 "현재 화면 크기의 배율"로 계산한다.
// small(1.0배)도 화면 크기 그대로라 배경이 항상 화면을 꽉 채우고, medium/large는
// 그보다 넓어서 카메라가 따라가는 여지가 생긴다 — 화면 크기와 무관하게 어떤
// 기기에서도 방 배경이 뷰포트 가장자리까지 꽉 차게 보장한다.
const ROOM_SIZE_MULTIPLIER = { small: 1.0, medium: 1.35, large: 2.1 };
const ROOM_MIN_WIDTH = 640;
const ROOM_MIN_HEIGHT = 420;
const ROOM_PATH_HEIGHT = 132; // 방문객이 걸어다니는 관람 통로(방 하단)의 높이
const ROOM_MARGIN = 26; // 좌우 벽 여백

const ZooApp = (function () {
  let selectedCharacterId = null;
  let currentRoomZoneId = null;

  function animalAsset(filename) {
    return filename ? ANIMALS_PATH + filename : "";
  }
  function characterAsset(filename) {
    return filename ? CHARACTERS_PATH + filename : "";
  }
  function backgroundAsset(filename) {
    return filename ? BACKGROUNDS_PATH + filename : "";
  }
  function keeperAsset(filename) {
    return filename ? KEEPERS_PATH + filename : "";
  }

  function getZoneById(id) {
    return ZONES.find((z) => z.id === id) || null;
  }
  function getCharacterById(id) {
    return CHARACTERS.find((c) => c.id === id) || null;
  }
  function getSelectedCharacter() {
    return getCharacterById(selectedCharacterId);
  }

  function getRoomDimensions(zone) {
    const vp = document.getElementById("roomViewport");
    const vw = (vp && vp.clientWidth) || window.innerWidth;
    const vh = (vp && vp.clientHeight) || window.innerHeight;
    const mult = ROOM_SIZE_MULTIPLIER[zone.roomSize] || ROOM_SIZE_MULTIPLIER.medium;
    return {
      width: Math.max(ROOM_MIN_WIDTH, Math.round(vw * mult)),
      height: Math.max(ROOM_MIN_HEIGHT, Math.round(vh * mult)),
    };
  }

  // ── 캐릭터 선택 화면 ────────────────────────────────
  function renderCharacterGrid() {
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = "";
    CHARACTERS.forEach((c) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "character-card";
      card.dataset.characterId = c.id;
      card.setAttribute("role", "option");
      card.setAttribute("aria-selected", "false");
      card.innerHTML =
        '<img class="character-card__img" src="' + characterAsset(c.sprite) + '" alt="' + c.name + ' 캐릭터" />' +
        '<span class="character-card__name">' + c.name + "</span>";
      card.addEventListener("click", () => selectCharacter(c.id));
      grid.appendChild(card);
    });
  }

  function selectCharacter(id) {
    selectedCharacterId = id;
    document.querySelectorAll(".character-card").forEach((el) => {
      const active = el.dataset.characterId === id;
      el.classList.toggle("is-selected", active);
      el.setAttribute("aria-selected", String(active));
    });
    document.getElementById("enterBtn").disabled = false;
  }

  function confirmCharacter() {
    if (!selectedCharacterId) return;
    const character = getSelectedCharacter();

    document.getElementById("selectScreen").classList.add("is-leaving");
    setTimeout(() => {
      document.getElementById("selectScreen").hidden = true;
      document.getElementById("app").hidden = false;
      if (window.ZooSound) window.ZooSound.unlock();
      HubMap.init();
      document.dispatchEvent(new CustomEvent("zoo:character-selected", { detail: { character } }));
    }, 200);
  }

  function applyCharacterSprite(imgEl) {
    const character = getSelectedCharacter();
    if (!character || !imgEl) return;
    imgEl.src = characterAsset(character.sprite);
    imgEl.dataset.static = characterAsset(character.sprite);
    imgEl.dataset.walk = characterAsset(character.walkGif);
    imgEl.alt = character.name;
  }

  // 서식지별 habitatType은 바닥/장식 톤을 공유, backgroundLayer 있으면 이미지로 대체.
  const HABITAT_PROP_SHAPE = {
    forest: "cluster",
    lake: "reeds",
    ice: "rock",
    farm: "cluster",
    savanna: "cluster",
  };

  // ── 동물 방(room) 렌더링 ────────────────────────────
  function renderRoom(zoneId) {
    const zone = getZoneById(zoneId);
    if (!zone) return;
    currentRoomZoneId = zoneId;

    const dims = getRoomDimensions(zone);
    // #roomWorld는 카메라 transform이 걸리는 바깥 컨테이너라 통째로 비우지 않는다
    // (그 안의 #roomVisitor는 방이 바뀌어도 계속 남아 있어야 하는 요소이기 때문).
    // 구역별 내용물은 안쪽 #roomContent에만 새로 그린다.
    const roomWorld = document.getElementById("roomWorld");
    const roomContent = document.getElementById("roomContent");
    roomContent.innerHTML = "";
    roomWorld.style.width = dims.width + "px";
    roomWorld.style.height = dims.height + "px";
    roomWorld.dataset.habitat = zone.habitatType;

    // 배경(서식지 테마)
    if (zone.backgroundLayer) {
      const bgLayer = document.createElement("div");
      bgLayer.className = "room__bg-layer";
      bgLayer.style.backgroundImage = "url('" + backgroundAsset(zone.backgroundLayer) + "')";
      bgLayer.setAttribute("aria-hidden", "true");
      roomContent.appendChild(bgLayer);
    } else {
      const decor = document.createElement("div");
      decor.className = "room__decor";
      decor.dataset.shape = HABITAT_PROP_SHAPE[zone.habitatType] || "cluster";
      decor.setAttribute("aria-hidden", "true");
      roomContent.appendChild(decor);
    }

    // 관람 통로(방문객이 걸을 수 있는 영역) — 방 하단.
    const path = document.createElement("div");
    path.className = "room__path";
    path.style.height = ROOM_PATH_HEIGHT + "px";
    roomContent.appendChild(path);

    // 울타리 — 서식지와 관람 통로 사이의 경계선(충돌 상한선과 같은 위치).
    const fence = document.createElement("div");
    fence.className = "room__fence";
    fence.style.bottom = ROOM_PATH_HEIGHT + "px";
    roomContent.appendChild(fence);

    // 동물 (population 마리) — animations.js가 각자 독립적으로 울타리 안에서
    // 배회시킨다. 방문객은 절대 이 우리 안으로 들어오지 못한다(관람 통로로만 이동).
    const enclosure = document.createElement("div");
    enclosure.className = "room__enclosure";
    enclosure.style.bottom = ROOM_PATH_HEIGHT + "px";
    enclosure.style.setProperty("--animal-scale", zone.sizeScale || 1);

    const population = Math.max(1, zone.population || 1);
    for (let i = 0; i < population; i++) {
      const hit = document.createElement("button");
      hit.type = "button";
      hit.className = "room__hit" + (zone.floatOnWater ? " room__hit--floats" : "");
      hit.dataset.zoneId = zone.id;
      hit.setAttribute("aria-label", zone.name + " 정보 보기");

      const img = document.createElement("img");
      img.className = "room__animal";
      img.src = animalAsset(zone.animalSprite);
      img.dataset.static = animalAsset(zone.animalSprite);
      img.dataset.walk = animalAsset(zone.animalWalkGif);
      img.alt = zone.name;
      img.draggable = false;
      hit.appendChild(img);
      enclosure.appendChild(hit);
    }

    if (zone.keeperSprite) {
      const keeper = document.createElement("img");
      keeper.className = "room__keeper";
      keeper.src = keeperAsset(zone.keeperSprite);
      keeper.alt = zone.name + " 담당 사육사";
      enclosure.appendChild(keeper);
    }
    if (zone.food && zone.food.sprite) {
      const food = document.createElement("img");
      food.className = "room__food";
      food.src = animalAsset(zone.food.sprite);
      food.alt = zone.food.name || "먹이";
      enclosure.appendChild(food);
    }

    roomContent.appendChild(enclosure);

    document.getElementById("roomTitle").textContent = zone.name;

    return { dims, pathTop: dims.height - ROOM_PATH_HEIGHT };
  }

  function getRoomWalkBounds(zone) {
    const dims = getRoomDimensions(zone);
    return {
      minX: ROOM_MARGIN,
      maxX: dims.width - ROOM_MARGIN,
      minY: dims.height - ROOM_PATH_HEIGHT + 10,
      maxY: dims.height - 14,
      width: dims.width,
      height: dims.height,
    };
  }

  // ── 동물 정지/걷기 상태 전환 (animations.js / controls.js 에서도 재사용) ──
  function setZoneAnimalState(imgEl, walking) {
    if (!imgEl) return;
    const staticSrc = imgEl.dataset.static;
    const walkSrc = imgEl.dataset.walk;
    const next = walking && walkSrc ? walkSrc : staticSrc;
    if (next && imgEl.getAttribute("src") !== next) imgEl.src = next;
  }

  // ── 정보 모달 ───────────────────────────────────────
  function openZoneModal(zoneId) {
    const zone = getZoneById(zoneId);
    if (!zone) return;
    document.getElementById("zoneModalImg").src = animalAsset(zone.animalSprite);
    document.getElementById("zoneModalImg").alt = zone.name;
    document.getElementById("zoneModalTitle").textContent = zone.name;
    document.getElementById("zoneModalDesc").textContent = zone.description;
    const modal = document.getElementById("zoneModal");
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.getElementById("zoneModalClose").focus();
  }

  function closeZoneModal() {
    const modal = document.getElementById("zoneModal");
    modal.classList.remove("is-open");
    setTimeout(() => {
      modal.hidden = true;
    }, 150);
  }

  function isAnyModalOpen() {
    const zm = document.getElementById("zoneModal");
    return zm && !zm.hidden;
  }

  function bindInteractions() {
    document.getElementById("enterBtn").addEventListener("click", confirmCharacter);

    document.getElementById("roomWorld").addEventListener("click", (e) => {
      const hit = e.target.closest(".room__hit");
      if (hit) openZoneModal(hit.dataset.zoneId);
    });

    document.getElementById("zoneModalClose").addEventListener("click", closeZoneModal);
    document.getElementById("zoneModalBackdrop").addEventListener("click", closeZoneModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("zoneModal").hidden) closeZoneModal();
    });

    document.getElementById("backToMapBtn").addEventListener("click", () => {
      if (window.ZooAnimations) window.ZooAnimations.exitRoom(currentRoomZoneId);
    });
  }

  function init() {
    renderCharacterGrid();
    bindInteractions();
  }

  init();

  return {
    ZONES,
    CHARACTERS,
    ROOM_MARGIN,
    ROOM_PATH_HEIGHT,
    animalAsset,
    characterAsset,
    backgroundAsset,
    getZoneById,
    getSelectedCharacter,
    applyCharacterSprite,
    setZoneAnimalState,
    openZoneModal,
    closeZoneModal,
    isAnyModalOpen,
    renderRoom,
    getRoomDimensions,
    getRoomWalkBounds,
    getCurrentRoomZoneId: () => currentRoomZoneId,
  };
})();

window.ZooApp = ZooApp;
