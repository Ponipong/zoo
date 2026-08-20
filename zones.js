// zones.js
// 동물(=방 하나) 데이터. 새 동물을 추가하려면 이 배열에 객체 하나만 추가하면
// 허브 지도의 표지판과 전용 방이 모두 자동으로 생성됩니다.
// - animalSprite / animalWalkGif : "assets/animals/" 폴더 기준 파일명만 적으면 됩니다.
// - habitatType : 아래 HABITATS 에 정의된 서식지 카테고리 id. 같은 habitatType을 쓰는
//   방들은 배경 톤·바닥 텍스처를 자동으로 공유합니다 (에셋 제작 부담을 줄이기 위함).
// - sizeScale : 방문객 캐릭터 키를 1.0 기준으로 한 상대 크기 배율.
// - population : 이 방(우리) 안에 함께 사는 개체 수. 여러 마리든 각자 독립적으로
//   우리 안을 배회(랜덤 이동)합니다.
// - signpostPosition : 허브 지도 위 표지판 좌표(맵 자체 좌표계, px).
// - roomSize : "small" | "medium" | "large" — 방 크기. large는 화면보다 커서
//   카메라가 캐릭터를 따라간다. small/medium은 화면에 다 들어가 카메라 이동이 없다.
// - keeperSprite : "assets/keepers/" 폴더 기준 파일명. 우리 안 울타리 쪽에 사육사를
//   세워둔다 (걷지 않는 정지 이미지 — zookeeper.gif/zookeeper-female.gif는 서서,
//   zookeeper-crouch.gif는 몸을 낮춘 포즈라 작은 동물 쪽에 어울린다). null이면 표시 안 함.
// - food / backgroundLayer : 지금은 대부분 비워두고, 나중에 값만 채우면 render.js가
//   자동으로 화면에 반영합니다 (구조는 이미 준비됨). backgroundLayer가 채워지면
//   habitatType 기본 CSS 그라디언트 대신 실제 픽셀아트 배경 이미지를 씁니다.
//   floatOnWater: true 를 함께 주면 동물이 물 위에 떠서 헤엄치듯 배치됩니다.
// - visited : 허브 지도에서 이 방을 이미 다녀왔는지 (세션 동안만 유지, 저장소 없음).

const HABITATS = [
  { id: "forest", name: "숲", icon: "🌳" },
  { id: "lake", name: "호수·습지", icon: "💧" },
  { id: "ice", name: "빙하·수조", icon: "❄️" },
  { id: "farm", name: "농장", icon: "🐓" },
  { id: "savanna", name: "초원", icon: "🦒" },
];

const ZONES = [
  // ── 숲 ─────────────────────────────────────────────
  {
    id: "tiger",
    name: "호랑이",
    habitatType: "forest",
    sizeScale: 1.3,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 120, y: 130 },
    roomSize: "medium",
    animalSprite: "tiger.svg",
    animalWalkGif: "tiger-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "tiger.png",
    visited: false,
    description: "줄무늬 옷을 입은 강력한 사냥꾼. 물을 두려워하지 않는 몇 안 되는 고양잇과 동물이에요.",
  },
  {
    id: "redfox",
    name: "붉은여우",
    habitatType: "forest",
    sizeScale: 0.6,
    population: 3,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 105, y: 340 },
    roomSize: "small",
    animalSprite: "redfox.svg",
    animalWalkGif: "redfox-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "redfox.png",
    visited: false,
    description: "영리하고 재빠른 사냥꾼으로, 풍성한 꼬리가 매력 포인트예요.",
  },
  {
    id: "rabbit",
    name: "토끼",
    habitatType: "forest",
    sizeScale: 0.3,
    population: 4,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 250, y: 420 },
    roomSize: "small",
    animalSprite: "rabbit.svg",
    animalWalkGif: "rabbit-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "rabbit.png",
    visited: false,
    description: "긴 귀와 통통 튀는 걸음이 매력적인 깡충깡충 뛰는 친구예요.",
  },

  // ── 호수·습지 ───────────────────────────────────────
  {
    id: "flamingo",
    name: "플라밍고",
    habitatType: "lake",
    sizeScale: 1.0,
    population: 4,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 950, y: 130 },
    roomSize: "medium",
    animalSprite: "flamingo.svg",
    animalWalkGif: "flamingo-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "flamingo.png",
    visited: false,
    description: "긴 다리로 물속을 첨벙이며 먹이를 찾는 분홍빛 새예요. 노을이 질 무렵 가장 아름다운 실루엣을 보여줘요.",
  },
  {
    id: "duck",
    name: "오리",
    habitatType: "lake",
    sizeScale: 0.35,
    population: 3,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 620, y: 120 },
    roomSize: "small",
    animalSprite: "duck.svg",
    animalWalkGif: "duck-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "duck.png",
    floatOnWater: true,
    visited: false,
    description: "물갈퀴 발로 헤엄치고, 뒤뚱거리며 걷는 모습이 사랑스러운 친구예요.",
  },
  {
    id: "dolphin",
    name: "돌고래",
    habitatType: "lake",
    sizeScale: 1.4,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 870, y: 300 },
    roomSize: "large",
    animalSprite: "dolphin.svg",
    animalWalkGif: "dolphin-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "dolphin.png",
    floatOnWater: true,
    visited: false,
    description: "높은 지능을 가진 바다의 친구로, 초음파로 서로 대화를 나눠요.",
  },
  {
    id: "turtle",
    name: "거북이",
    habitatType: "lake",
    sizeScale: 0.25,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 780, y: 260 },
    roomSize: "small",
    animalSprite: "turtle.svg",
    animalWalkGif: "turtle-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "turtle.png",
    floatOnWater: true,
    visited: false,
    description: "느리지만 꾸준한 걸음으로 수백 년을 사는 장수 동물이에요.",
  },

  // ── 빙하·수조 ───────────────────────────────────────
  {
    id: "polarbear",
    name: "북극곰",
    habitatType: "ice",
    sizeScale: 2.2,
    population: 1,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1680, y: 140 },
    roomSize: "large",
    animalSprite: "polarbear.svg",
    animalWalkGif: "polarbear-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "polarbear.png",
    visited: false,
    description: "두꺼운 지방층과 하얀 털로 혹독한 추위를 견디는 북극의 사냥꾼이에요.",
  },
  {
    id: "penguin",
    name: "펭귄",
    habitatType: "ice",
    sizeScale: 0.7,
    population: 4,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1550, y: 260 },
    roomSize: "medium",
    animalSprite: "penguin.svg",
    animalWalkGif: "penguin-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "penguin.png",
    visited: false,
    description: "뒤뚱뒤뚱 걷지만 물속에서는 누구보다 빠르고 날렵한 수영 선수예요.",
  },

  // ── 농장 ───────────────────────────────────────────
  {
    id: "chicken",
    name: "닭",
    habitatType: "farm",
    sizeScale: 0.35,
    population: 4,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 260, y: 620 },
    roomSize: "small",
    animalSprite: "chicken.svg",
    animalWalkGif: "chicken-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "chicken.png",
    visited: false,
    description: "이른 아침을 알리는 목소리를 가진, 우리에게 아주 익숙한 새예요.",
  },
  {
    id: "cow",
    name: "소",
    habitatType: "farm",
    sizeScale: 1.3,
    population: 3,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 430, y: 560 },
    roomSize: "medium",
    animalSprite: "cow.svg",
    animalWalkGif: "cow-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "cow.png",
    visited: false,
    description: "우유와 유제품을 선물해주는 온순하고 친근한 동물이에요.",
  },
  {
    id: "sheep",
    name: "양",
    habitatType: "farm",
    sizeScale: 0.9,
    population: 4,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 250, y: 800 },
    roomSize: "small",
    animalSprite: "sheep.svg",
    animalWalkGif: "sheep-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "sheep.png",
    visited: false,
    description: "복슬복슬한 털로 따뜻한 양털 옷의 재료를 제공해줘요.",
  },
  {
    id: "llama",
    name: "라마",
    habitatType: "farm",
    sizeScale: 1.2,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 650, y: 780 },
    roomSize: "medium",
    animalSprite: "llama.png",
    animalWalkGif: "llama-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "llama.png",
    visited: false,
    description: "폭신한 털을 가진 안데스산맥 출신의 온화한 친구예요.",
  },
  {
    id: "pig",
    name: "돼지",
    habitatType: "farm",
    sizeScale: 0.8,
    population: 3,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 560, y: 700 },
    roomSize: "small",
    animalSprite: "pig.svg",
    animalWalkGif: "pig-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "pig.png",
    visited: false,
    description: "생각보다 훨씬 똑똑하고 깨끗한 것을 좋아하는 동물이에요.",
  },
  {
    id: "dog",
    name: "강아지",
    habitatType: "farm",
    sizeScale: 0.6,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 650, y: 600 },
    roomSize: "small",
    animalSprite: "dog.svg",
    animalWalkGif: "dog-walk.gif",
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "dog.png",
    visited: false,
    description: "사람과 가장 오랜 시간을 함께해온 다정한 동반자예요.",
  },
  {
    id: "cat",
    name: "고양이",
    habitatType: "farm",
    sizeScale: 0.3,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 120, y: 690 },
    roomSize: "small",
    animalSprite: "cat.png",
    animalWalkGif: null, // 아직 걷기 애니메이션 파일이 없어 정지 이미지로만 표시됩니다.
    keeperSprite: "zookeeper-crouch.gif",
    food: null,
    backgroundLayer: "cat.png",
    visited: false,
    description: "사뿐사뿐 걷는 걸음걸이가 매력적인 도도한 친구예요.",
  },

  // ── 초원 ───────────────────────────────────────────
  {
    id: "lion",
    name: "사자",
    habitatType: "savanna",
    sizeScale: 1.3,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1650, y: 750 },
    roomSize: "medium",
    animalSprite: "lion.svg",
    animalWalkGif: "lion-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "lion.png",
    visited: false,
    description: "초원의 왕이라 불리는 백수의 제왕. 멋진 갈기를 가진 수사자를 볼 수 있어요.",
  },
  {
    id: "elephant",
    name: "코끼리",
    habitatType: "savanna",
    sizeScale: 2.0,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1550, y: 600 },
    roomSize: "large",
    animalSprite: "elephant.svg",
    animalWalkGif: "elephant-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "elephant.png",
    visited: false,
    description: "긴 코로 물을 마시고 먹이를 옮기는 지상 최대의 육상 동물이에요.",
  },
  {
    id: "giraffe",
    name: "기린",
    habitatType: "savanna",
    sizeScale: 2.1,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1450, y: 780 },
    roomSize: "large",
    animalSprite: "giraffe.svg",
    animalWalkGif: "giraffe-walk.gif",
    keeperSprite: "zookeeper-female.gif",
    food: null,
    backgroundLayer: "giraffe.png",
    visited: false,
    description: "긴 목 덕분에 높은 나무 꼭대기의 잎도 여유롭게 먹을 수 있어요.",
  },
  {
    id: "hippo",
    name: "하마",
    habitatType: "savanna",
    sizeScale: 1.6,
    population: 2,  // 우리 안에 함께 배회하는 개체 수
    signpostPosition: { x: 1250, y: 720 },
    roomSize: "medium",
    animalSprite: "hippo.svg",
    animalWalkGif: "hippo-walk.gif",
    keeperSprite: "zookeeper.gif",
    food: null,
    backgroundLayer: "hippo.png",
    visited: false,
    description: "물속에서 대부분의 시간을 보내며 몸을 시원하게 유지해요.",
  },
];
