# 모두스토어 개발 문서

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [디렉토리 구조](#3-디렉토리-구조)
4. [로컬 개발 환경 세팅](#4-로컬-개발-환경-세팅)
5. [아키텍처](#5-아키텍처)
6. [API](#6-api)
7. [컴포넌트](#7-컴포넌트)
8. [타입 정의](#8-타입-정의)
9. [디자인 시스템](#9-디자인-시스템)
10. [배포](#10-배포)
11. [알려진 제약 및 주의사항](#11-알려진-제약-및-주의사항)
12. [다음 단계 로드맵](#12-다음-단계-로드맵)

---

## 1. 프로젝트 개요

**모두스토어**는 App Store(iOS)와 Play Store(Android)의 검색 결과를 한 화면에서 비교할 수 있는 웹 서비스입니다.

- 앱 이름 하나를 입력하면 두 마켓의 결과를 병렬로 조회합니다.
- 한쪽 마켓 조회가 실패해도 나머지 결과는 정상 표시됩니다.
- 카드 클릭 시 해당 마켓의 공식 상세 페이지로 이동합니다.
- 데스크톱: 좌/우 분할 뷰, 모바일: 탭 전환 방식으로 반응형 레이아웃을 제공합니다.

---

## 2. 기술 스택

| 구분 | 라이브러리 / 버전 |
|------|------------------|
| 프레임워크 | Next.js 16.2.9 (App Router, Turbopack) |
| UI 라이브러리 | React 19.2.4 |
| 스타일링 | Tailwind CSS v4 |
| iOS 데이터 | iTunes Search API (공개 REST API) |
| Android 데이터 | google-play-scraper ^10.1.3 |
| 언어 | TypeScript 5 |
| 런타임 | Node.js (서버 라우트) |

---

## 3. 디렉토리 구조

```
modu-store/
├── app/
│   ├── page.tsx                  # 메인 페이지 (검색 UI 진입점)
│   ├── layout.tsx                # 루트 레이아웃 (폰트, 메타데이터)
│   ├── globals.css               # 디자인 토큰 + 전역 스타일
│   └── api/
│       └── search/
│           └── route.ts          # GET /api/search — 통합 검색 엔드포인트
│   └── components/
│       ├── StoreCard.tsx         # 개별 앱 카드
│       ├── ResultsColumn.tsx     # 마켓별 결과 컬럼
│       └── SeamDivider.tsx       # 데스크톱 가운데 구분선
├── lib/
│   └── types.ts                  # 공유 타입 (StoreApp, SearchResponse)
├── public/                       # 정적 파일
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 4. 로컬 개발 환경 세팅

```bash
# 의존성 설치
npm install

# 개발 서버 시작 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 린트
npm run lint
```

별도의 `.env` 파일이나 API 키 설정은 필요 없습니다.

---

## 5. 아키텍처

### 데이터 흐름

```
브라우저
  │
  │  GET /api/search?q={term}
  ▼
Next.js API Route (Node.js 런타임)
  │
  ├──▶ iTunes Search API (https://itunes.apple.com/search)
  │        country=kr, entity=software, limit=12
  │
  └──▶ google-play-scraper
           lang=ko, country=kr, num=12
  │
  │  Promise.allSettled([ios, android])  ← 둘 중 하나 실패해도 응답 반환
  │
  ▼
SearchResponse JSON 반환
  │
  ▼
ResultsColumn × 2 (iOS / Android) 렌더링
```

### 핵심 설계 결정

- **`Promise.allSettled`**: 한 마켓의 API 실패가 전체 검색을 막지 않도록 합니다. 실패한 쪽은 빈 배열 + 에러 메시지로 대체됩니다.
- **API Route에 `runtime = "nodejs"` 명시**: `google-play-scraper`는 Node.js 네이티브 모듈을 사용하므로 Edge 런타임에서 동작하지 않습니다.
- **`"use client"` 경계**: `page.tsx`만 `"use client"`를 선언하지만, `ResultsColumn` · `StoreCard` · `SeamDivider`는 이 파일에서 import되므로 **모두 클라이언트 번들에 포함되어 클라이언트 컴포넌트로 동작**합니다. 하위 컴포넌트에 지시어가 없는 이유는 서버 컴포넌트라서가 아니라, 이미 경계 아래에 있어 따로 선언할 필요가 없기 때문입니다. 서버 컴포넌트는 `layout.tsx`뿐입니다.

---

## 6. API

### `GET /api/search`

앱 이름으로 iOS / Android 마켓을 동시 검색합니다.

#### 요청

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `q` | string | ✅ | 검색할 앱 이름 (최대 100자) |

```
GET /api/search?q=카카오톡
```

#### 응답 (200 OK)

```jsonc
{
  "query": "카카오톡",
  "ios": [
    {
      "id": "362057947",
      "name": "카카오톡 KakaoTalk",
      "developer": "Kakao Corp.",
      "icon": "https://...256x256.jpg",
      "score": 4.2,
      "ratingCount": 123456,
      "price": "무료",
      "url": "https://apps.apple.com/kr/app/..."
    }
    // ...최대 12개
  ],
  "android": [
    {
      "id": "com.kakao.talk",
      "name": "카카오톡 KakaoTalk",
      "developer": "Kakao Corp.",
      "icon": "https://play-lh.googleusercontent.com/...",
      "score": 3.9,
      "ratingCount": null,
      "price": "무료",
      "url": "https://play.google.com/store/apps/details?id=com.kakao.talk"
    }
    // ...최대 12개
  ],
  "errors": {
    "ios": null,       // 실패 시 에러 메시지 문자열
    "android": null
  }
}
```

#### 응답 (400 Bad Request)

```json
{ "error": "검색어(q)를 입력해주세요." }
{ "error": "검색어는 100자 이하로 입력해주세요." }
```

#### 캐싱

- 두 마켓 모두 성공하면 `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`을 보냅니다. Vercel CDN이 같은 검색어를 5분간 캐시합니다 (브라우저에는 `public`만 보이는 것이 정상).
- 한쪽이라도 실패하면 `no-store`로 응답해 일시적 오류가 캐시되지 않게 합니다.

---

## 7. 컴포넌트

### `page.tsx` (클라이언트 컴포넌트)

메인 페이지 진입점. 검색 상태 관리와 레이아웃 분기를 담당합니다.

| 상태 | 타입 | 설명 |
|------|------|------|
| `input` | `string` | 검색창 입력값 |
| `result` | `SearchResponse \| null` | 마지막 검색 결과 |
| `status` | `"idle" \| "loading" \| "done" \| "error"` | 요청 상태 |
| `tab` | `"ios" \| "android"` | 모바일 활성 탭 |

로딩 처리:
- 첫 검색 중: "두 마켓에서 검색하고 있어요…" 안내 표시
- 재검색 중: 이전 결과를 흐리게(`opacity-40`) 유지하고 `aria-busy` 설정. 결과 개수와 모바일 탭은 계속 표시

레이아웃 분기:
- `md` 이상: `ResultsColumn` + `SeamDivider` + `ResultsColumn` 나란히 배치
- `md` 미만: 탭 버튼으로 하나씩 전환

---

### `ResultsColumn.tsx`

한 마켓의 결과 목록을 렌더링합니다.

| prop | 타입 | 설명 |
|------|------|------|
| `platform` | `"ios" \| "android"` | 플랫폼 구분 (색상 테마 결정) |
| `label` | `string` | 컬럼 헤더 텍스트 |
| `icon` | `string` | 헤더 아이콘 이모지 |
| `apps` | `StoreApp[]` | 앱 목록 |
| `error` | `string \| null` | API 에러 메시지 |
| `hasSearched` | `boolean` | 검색 완료 여부 |

상태별 렌더링:
- `error` 있음 → 에러 메시지 박스
- `apps.length === 0` → "결과 없음" 안내
- 정상 → `StoreCard` 목록

---

### `StoreCard.tsx`

개별 앱을 카드 형태로 표시하는 링크 컴포넌트입니다.

| prop | 타입 | 설명 |
|------|------|------|
| `app` | `StoreApp` | 앱 데이터 |
| `platform` | `"ios" \| "android"` | 호버 색상 테마 결정 |
| `index` | `number` | 카드 등장 애니메이션 딜레이 계산 (`index * 40ms`) |

- `<a>` 태그로 구현되어 `target="_blank"` + `rel="noopener noreferrer"` 적용
- 아이콘 이미지는 `loading="lazy"`로 지연 로드, `icon`이 `null`이면 앱 이름 첫 글자 플레이스홀더 표시
- iOS 아이콘 URL: iTunes 기본 `100x100` → `256x256`으로 교체하여 고해상도 표시

---

### `SeamDivider.tsx`

데스크톱 뷰에서 iOS/Android 컬럼 사이를 잇는 시각적 구분선입니다.

- `md` 미만에서는 `hidden`으로 숨겨집니다.
- 점선(`seam-line`) + "모두" 뱃지(`seam-badge`)로 구성됩니다.
- 순수 시각 요소이므로 `aria-hidden`이 적용되어 있습니다.

---

## 8. 타입 정의

`lib/types.ts`

```ts
type StoreApp = {
  id: string;          // iOS: trackId(숫자 → 문자열), Android: 패키지명
  name: string;
  developer: string;
  icon: string | null; // 이미지 URL (없으면 null → 카드에서 앱 이름 첫 글자로 대체)
  score: number | null; // 평점 (없으면 null)
  ratingCount: number | null; // 리뷰 수 (Android scraper는 미제공 → null)
  price: string;       // "무료" 또는 가격 문자열
  url: string;         // 마켓 상세 페이지 URL
};

type SearchResponse = {
  query: string;
  ios: StoreApp[];
  android: StoreApp[];
  errors: {
    ios: string | null;
    android: string | null;
  };
};
```

---

## 9. 디자인 시스템

`globals.css`의 `@theme inline` 블록에 CSS 변수로 모든 디자인 토큰이 정의되어 있습니다. Tailwind v4에서는 이 변수들을 `var(--color-*)` 또는 Tailwind 유틸리티 클래스로 직접 참조합니다.

### 색상 팔레트

| 토큰 | 값 | 용도 |
|------|----|------|
| `--color-ink` | `#1c1e22` | 본문 텍스트 |
| `--color-ink-soft` | `#5b6068` | 보조 텍스트 |
| `--color-paper` | `#f1efea` | 페이지 배경 |
| `--color-paper-raised` | `#ffffff` | 카드 배경 |
| `--color-ios` | `#3a3d42` | iOS 강조색 |
| `--color-ios-tint` | `#e9e9eb` | iOS 아이콘 배경 |
| `--color-ios-line` | `#d3d4d8` | iOS 카드 테두리 |
| `--color-android` | `#1f9d5c` | Android 강조색 |
| `--color-android-tint` | `#e2f5ea` | Android 아이콘 배경 |
| `--color-android-line` | `#bfe6d2` | Android 카드 테두리 |
| `--color-seam` | `#e0983a` | 구분선 · 포커스 링 |
| `--color-seam-soft` | `#f4dcb8` | 텍스트 셀렉션 배경 |
| `--color-coral` | `#d95c43` | 에러 메시지 |

### 폰트

| 토큰 | 용도 |
|------|------|
| `--font-display` / `--font-body` | Noto Sans KR (본문) |
| `--font-mono` | IBM Plex Mono (평점, 건수 등 수치) |

### 애니메이션

- `.card-enter`: 검색 결과 카드 등장 애니메이션 (`card-rise`, 0.35s ease-out)
  - `prefers-reduced-motion` 미설정 시에만 적용 (접근성 대응)
  - `StoreCard`에서 `index * 40ms` 딜레이로 순차 등장
- `:focus-visible`: `--color-seam` 2px 아웃라인 (키보드 접근성)

---

## 10. 배포

### Vercel (권장)

```bash
# CLI 배포
vercel deploy

# 또는 GitHub 레포지토리를 Vercel에 연결하면 push 시 자동 배포
```

- 별도 환경 변수 설정 불필요
- `/api/search` 라우트는 `runtime = "nodejs"`로 Node.js 함수로 배포됨
  - **Edge 런타임으로 변경하지 마세요** — `google-play-scraper`가 동작하지 않습니다.

---

## 11. 알려진 제약 및 주의사항

### google-play-scraper 불안정성
`google-play-scraper`는 Google Play의 공개 페이지를 파싱하는 비공식 라이브러리입니다. Google이 마켓 페이지 레이아웃을 변경하면 Android 검색이 일시적으로 깨질 수 있습니다. 장애가 반복되면 공식 Google Play Developer API 등 대안으로 교체를 검토하세요.

### Android ratingCount 미제공
`google-play-scraper`가 반환하는 검색 결과 객체에는 리뷰 수(`ratingCount`)가 포함되지 않아 항상 `null`입니다. 상세 페이지 API(`gplay.app()`)를 별도 호출하면 얻을 수 있지만, 검색 결과 12건 × 개별 호출은 응답 지연을 유발하므로 현재 MVP에서는 생략했습니다.

### 국가 코드 고정
현재 iOS(`country=kr`)와 Android(`country=kr`, `lang=ko`) 모두 한국 마켓으로 고정되어 있습니다. 다국가 지원 시 검색창 옆에 국가 선택 UI를 추가하고, API Route에 파라미터로 넘겨야 합니다.

### 캐싱 구조
`searchIos`의 `fetch`는 `next: { revalidate: 0 }`으로 서버 측 데이터 캐시를 쓰지 않습니다. 대신 `/api/search` 응답 자체에 `s-maxage=300`을 붙여 Vercel CDN 단에서 캐시합니다 (6장 참고). 같은 검색어를 반복 호출해도 Apple·Google로 요청이 가지 않습니다.

---

## 12. 다음 단계 로드맵

| 우선순위 | 기능 | 설명 |
|---------|------|------|
| 상 | 원링크 생성기 | iOS/Android 앱 존재 여부를 확인 후 기기를 자동 감지해 해당 스토어로 리디렉션하는 단축 URL 생성 |
| 중 | 실시간 인기 검색어 | 서비스 내 검색 빈도를 집계해 홈 화면에 표시 |
| 중 | 평점 변동 트래커 | 특정 앱의 평점/리뷰 수 추이를 시계열로 저장·시각화 |
| 하 | 다국가 지원 | 국가 선택 UI 추가, API Route에 `country` 파라미터 전달 |
| 하 | Android ratingCount 표시 | `gplay.app()` 추가 호출 또는 배치 처리로 리뷰 수 제공 |
