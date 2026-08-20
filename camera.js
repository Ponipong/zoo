// camera.js
// 카메라 팔로우(뷰포트 클리핑) + Y좌표 기반 깊이 정렬.
// world는 하나의 큰 절대좌표 컨테이너이고, 화면(#viewport)은 그중 캐릭터 주변
// 일부만 보여준다. 캐릭터가 이동하면 world를 반대 방향으로 translate 해서
// "카메라가 따라가는" 것처럼 보이게 한다.

const Camera = (function () {
  let viewportEl = null;
  let worldEl = null;
  let worldWidth = 0;
  let worldHeight = 0;

  function init(viewport, world, width, height) {
    viewportEl = viewport;
    worldEl = world;
    worldWidth = width;
    worldHeight = height;
  }

  function setWorldSize(width, height) {
    worldWidth = width;
    worldHeight = height;
  }

  // 캐릭터의 world 좌표를 받아 화면 중앙 부근에 오도록 camX/camY(카메라의 world
  // 좌상단 좌표)를 계산해 돌려준다. DOM에 transform을 실제로 적용하는 건 호출부
  // (controls.js)의 몫 — zoom(확대 배율)까지 합쳐서 한 번에 적용하기 위함이다.
  // world가 뷰포트보다 작은 축(주로 세로)은 가운데 정렬로 고정하고, 큰 축(주로
  // 가로)은 world 경계 안에서만 카메라가 움직이게 clamp 한다.
  function follow(worldX, worldY, zoom) {
    if (!viewportEl || !worldEl) return { camX: 0, camY: 0 };
    const z = zoom || 1;
    // 확대(zoom)할수록 화면에 실제로 담기는 world 영역(단위: world px)은 좁아진다.
    const vw = viewportEl.clientWidth / z;
    const vh = viewportEl.clientHeight / z;

    let camX;
    if (worldWidth <= vw) {
      camX = (worldWidth - vw) / 2;
    } else {
      camX = Math.max(0, Math.min(worldWidth - vw, worldX - vw / 2));
    }

    let camY;
    if (worldHeight <= vh) {
      camY = (worldHeight - vh) / 2;
    } else {
      camY = Math.max(0, Math.min(worldHeight - vh, worldY - vh / 2));
    }

    return { camX, camY };
  }

  // Y좌표가 클수록(화면 아래쪽) 더 앞에 그려지도록 z-index를 매긴다. 정적 소품
  // (render.js)과 동적 캐릭터(controls.js)가 항상 같은 스케일을 쓰도록 여기서
  // 공식을 하나로 통일한다.
  function depthIndex(worldY) {
    return Math.round(worldY * 10);
  }

  return { init, setWorldSize, follow, depthIndex };
})();

window.Camera = Camera;
