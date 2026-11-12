# 주님 오심을 기다리며 · 장유중앙교회 대림절 묵상 (2026)

대림절(11/29~12/25) 동안 매일 한 칸씩 여는 모바일 웹앱입니다. 서버 없이 동작합니다.

## 파일 구성

| 파일 | 하는 일 |
|---|---|
| `cards.js` | **카드 글 27칸 전부.** 글을 고칠 때는 이 파일만 고칩니다. |
| `index.html` | 화면 뼈대 |
| `style.css` | 색·글씨 크기·배치 |
| `app.js` | 날짜 잠금, 설치 안내, 실천 체크 등 동작 |
| `sw.js` | 오프라인에서도 열리게 하는 파일 |
| `manifest.webmanifest`, `icons/` | 홈 화면 아이콘과 앱 이름 |
| `img/` | 주마다 보여 주는 대림초 그림 4장 (`candle-1.jpg` ~ `candle-4.jpg`) |
| `fonts/` | 제목용 글꼴 (고운바탕, 나눔손글씨 붓 — SIL 오픈 폰트 라이선스) |
| `.nojekyll` | GitHub Pages 가 파일을 그대로 올리게 하는 빈 파일 |

## 배포 (GitHub Pages)

1. GitHub 에서 새 저장소를 만듭니다. 이름 `advent`, 공개(Public).
2. 이 폴더 안의 파일을 전부 저장소에 올립니다. (Add file → Upload files, `icons` 폴더 포함)
3. 저장소 Settings → Pages → Source 를 "Deploy from a branch", Branch 를 `main` / `/(root)` 로 정하고 Save.
4. 1~2분 뒤 주소가 생깁니다: `https://<GitHub아이디>.github.io/advent/`

주소는 GitHub 아이디와 저장소 이름으로 정해집니다. 이 둘을 바꾸지 않으면 주소는 바뀌지 않습니다.

## 글 고치기

`cards.js` 에서 큰따옴표 안의 글만 고쳐 다시 올리면 됩니다. 교인 휴대폰에는 다음에 열 때 반영됩니다(인터넷 연결 시).

## 검수용 날짜 미리보기

주소 뒤에 `?date=2026-12-08` 처럼 날짜를 붙이면 그 날짜로 보입니다. 미리보기 중에는 기록이 저장되지 않습니다.
