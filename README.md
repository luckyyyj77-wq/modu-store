# 모두스토어 (Modu Store) — MVP

App Store와 Play Store 검색 결과를 한 화면에서 비교하고, 공식 다운로드 페이지로 바로 연결해주는 웹 서비스 MVP입니다.

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속 후 앱 이름을 검색하면 됩니다.
별도의 API 키나 `.env` 설정이 필요 없습니다 (iTunes Search API는 공개 API, Play Store는 `google-play-scraper`로 공개 페이지를 파싱합니다).

## 배포

Vercel에 그대로 배포 가능합니다 (`vercel deploy` 또는 GitHub 연동).
`/api/search` 라우트는 Node.js 런타임에서 동작해야 하므로 Edge 런타임으로 바꾸지 마세요.

## 구조

```
app/
  page.tsx                 메인 검색 화면 (검색창, 데스크톱 분할뷰 / 모바일 탭)
  api/search/route.ts      iTunes Search API + google-play-scraper 통합 호출
  components/
    StoreCard.tsx           앱 카드 (아이콘 · 평점 · 가격 · 바로가기 링크)
    ResultsColumn.tsx        스토어별 결과 컬럼
    SeamDivider.tsx           데스크톱 좌/우를 잇는 시그니처 이음선(seam)
  globals.css               디자인 토큰 (색상 · 폰트) 정의
lib/
  types.ts                  검색 결과 공통 타입
```

## 현재 MVP 범위

- ✅ 앱 이름 검색 → iOS / Android 결과 동시 조회 (병렬 요청, 한쪽 실패해도 다른 쪽은 정상 표시)
- ✅ 데스크톱: 좌우 분할 비교 뷰 / 모바일: 탭 전환
- ✅ 카드 클릭 시 새 창으로 공식 스토어 상세 페이지 이동
- ⬜ (다음 단계) iOS/Android 앱 체크 후 기기 자동 감지 원링크 생성기
- ⬜ (다음 단계) 실시간 인기 검색어, 평점 변동 트래커

## 참고 사항

- `google-play-scraper`는 Google Play의 실제 페이지 구조를 파싱하는 비공식 라이브러리라, 구글이 마켓 페이지 레이아웃을 바꾸면 일시적으로 깨질 수 있습니다. 장애가 잦아지면 공식 API가 있는 다른 소스로 교체를 고려하세요.
- 현재는 국가 코드를 `kr`로 고정했습니다. 추후 다국가 지원 시 검색창 옆에 국가 선택 UI를 추가하면 됩니다.
