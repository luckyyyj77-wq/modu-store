import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";
import type { StoreApp, SearchResponse } from "@/lib/types";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 100;

// Search results only from Google's/Apple's public catalog endpoints —
// no scraping of anything requiring auth, no bypassing of paywalls.

type ItunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  formattedPrice?: string | null;
  trackViewUrl: string;
};

async function searchIos(term: string): Promise<StoreApp[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("country", "kr");
  url.searchParams.set("entity", "software");
  url.searchParams.set("limit", "12");

  const res = await fetch(url.toString(), {
    // iTunes search API is a public, unauthenticated catalog endpoint
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`iTunes API 응답 오류 (${res.status})`);
  }

  const data = (await res.json()) as { results: ItunesResult[] };

  return data.results.map((item) => ({
    id: String(item.trackId),
    name: item.trackName,
    developer: item.artistName,
    icon: item.artworkUrl100?.replace("100x100", "256x256") || null,
    score: item.averageUserRating ?? null,
    ratingCount: item.userRatingCount ?? null,
    price: item.formattedPrice || "무료",
    url: item.trackViewUrl,
  }));
}

async function searchAndroid(term: string): Promise<StoreApp[]> {
  const results = await gplay.search({
    term,
    num: 12,
    lang: "ko",
    country: "kr",
  });

  return results.map((item) => ({
    id: item.appId,
    name: item.title,
    developer: item.developer,
    icon: item.icon || null,
    score: item.score ?? null,
    ratingCount: null,
    price: item.free ? "무료" : item.priceText || "유료",
    url: item.url,
  }));
}

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q")?.trim();

  if (!term) {
    return NextResponse.json(
      { error: "검색어(q)를 입력해주세요." },
      { status: 400 }
    );
  }

  if (term.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 }
    );
  }

  const [iosResult, androidResult] = await Promise.allSettled([
    searchIos(term),
    searchAndroid(term),
  ]);

  const payload: SearchResponse = {
    query: term,
    ios: iosResult.status === "fulfilled" ? iosResult.value : [],
    android: androidResult.status === "fulfilled" ? androidResult.value : [],
    errors: {
      ios:
        iosResult.status === "rejected"
          ? "App Store 검색에 실패했어요. 잠시 후 다시 시도해주세요."
          : null,
      android:
        androidResult.status === "rejected"
          ? "Play Store 검색에 실패했어요. 잠시 후 다시 시도해주세요."
          : null,
    },
  };

  // Cache successful results at the CDN so repeated queries don't hit
  // Apple/Google every time. Skip caching when either store failed, so a
  // transient error isn't served to other users.
  const hasError = payload.errors.ios !== null || payload.errors.android !== null;

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": hasError
        ? "no-store"
        : "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
