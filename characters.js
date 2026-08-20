// characters.js
// 방문객 캐릭터 데이터. 새 캐릭터를 추가하려면 이 배열에 객체 하나만 추가하면 됩니다.
// - sprite   : 정지 이미지 (캐릭터 선택 화면 + 대기 상태에서 사용). "assets/characters/" 폴더 기준 파일명.
// - walkGif  : 걷기 애니메이션. 없으면 sprite가 대신 사용됩니다.

const CHARACTERS = [
  {
    id: "boy",
    name: "소년 방문객",
    sprite: "boy.svg",
    walkGif: "boy-walk.gif",
  },
  {
    id: "girl",
    name: "소녀 방문객",
    sprite: "girl.gif",
    walkGif: "girl-walk.gif",
  },
  {
    id: "kid1",
    name: "어린이 방문객",
    sprite: "kid1.svg",
    walkGif: "kid1-walk.gif",
  },
  {
    id: "kid2",
    name: "꼬마 방문객",
    sprite: "kid2.svg",
    walkGif: "kid2-walk.gif",
  },
  {
    id: "couple",
    name: "커플 방문객",
    sprite: "couple.svg",
    walkGif: "couple-walk.gif",
  },
  {
    id: "little-man",
    name: "여행자",
    sprite: "little-man.png",
    walkGif: "little-man-walk.gif",
  },
];
