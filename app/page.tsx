"use client";

import { useState, type FormEvent } from "react";
import type { SearchResponse } from "@/lib/types";
import { ResultsColumn } from "./components/ResultsColumn";
import { SeamDivider } from "./components/SeamDivider";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tab, setTab] = useState<"ios" | "android">("ios");

  async function runSearch(term: string) {
    if (!term.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("search failed");
      const data: SearchResponse = await res.json();
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(input);
  }

  const isLoading = status === "loading";
  // Once any search has succeeded, keep showing counts/tabs for the last
  // result while a new search is in flight (results are dimmed instead).
  const hasSearched = result !== null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-16 pt-10 md:pt-16">
      <header className="mb-8 text-center md:mb-12">
        <p className="mb-2 font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[0.2em] text-[var(--color-seam)]">
          App Store × Play Store
        </p>
        <h1 className="text-[32px] font-black leading-tight md:text-[40px]">
          모두스토어
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-ink-soft)] md:text-[15px]">
          앱 이름 하나만 검색하면, 두 마켓의 정보를 한 화면에서 비교해요.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="mb-8 flex gap-2 md:mb-10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={100}
          placeholder="검색할 앱 이름을 입력하세요"
          className="flex-1 rounded-xl border border-[var(--color-ink-soft)]/25 bg-[var(--color-paper-raised)] px-4 py-3 text-[15px] outline-none placeholder:text-[var(--color-ink-soft)]/70 focus:border-[var(--color-seam)]"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[var(--color-ink)] px-5 py-3 text-[14px] font-medium text-[var(--color-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "검색 중" : "검색"}
        </button>
      </form>

      {/* mobile tab toggle */}
      {hasSearched && status !== "error" && (
        <div className="mb-5 flex gap-1 rounded-full border border-[var(--color-ink-soft)]/20 p-1 md:hidden">
          {(
            [
              { key: "ios", label: "🍏 App Store" },
              { key: "android", label: "🤖 Play Store" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-full py-2 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "text-[var(--color-ink-soft)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/5 p-4 text-[14px] text-[var(--color-coral)]">
          검색 중 문제가 생겼어요. 네트워크 연결을 확인하고 다시 시도해주세요.
        </p>
      )}

      {status === "idle" && (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-ink-soft)]/25 p-8 text-center">
          <p className="text-[14px] text-[var(--color-ink-soft)]">
            예: 카카오톡, 인스타그램, 배달의민족처럼 찾고 싶은 앱 이름을
            입력해보세요.
          </p>
        </div>
      )}

      {isLoading && !result && (
        <p
          role="status"
          className="mt-6 text-center text-[14px] text-[var(--color-ink-soft)]"
        >
          두 마켓에서 검색하고 있어요…
        </p>
      )}

      {result && status !== "error" && (
        <div
          aria-busy={isLoading}
          className={`transition-opacity ${isLoading ? "pointer-events-none opacity-40" : ""}`}
        >
          {isLoading && (
            <p role="status" className="sr-only">
              새 검색 결과를 불러오는 중이에요.
            </p>
          )}
          {/* desktop: side by side with seam */}
          <div className="hidden md:flex">
            <ResultsColumn
              platform="ios"
              label="App Store"
              icon="🍏"
              apps={result.ios}
              error={result.errors.ios}
              hasSearched={hasSearched}
            />
            <SeamDivider />
            <ResultsColumn
              platform="android"
              label="Play Store"
              icon="🤖"
              apps={result.android}
              error={result.errors.android}
              hasSearched={hasSearched}
            />
          </div>

          {/* mobile: single column by active tab */}
          <div className="md:hidden">
            {tab === "ios" ? (
              <ResultsColumn
                platform="ios"
                label="App Store"
                icon="🍏"
                apps={result.ios}
                error={result.errors.ios}
                hasSearched={hasSearched}
              />
            ) : (
              <ResultsColumn
                platform="android"
                label="Play Store"
                icon="🤖"
                apps={result.android}
                error={result.errors.android}
                hasSearched={hasSearched}
              />
            )}
          </div>
        </div>
      )}

      <footer className="mt-auto pt-16 text-center font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-ink-soft)]/70">
        <p>검색 결과는 각 마켓의 공식 다운로드 페이지로 연결됩니다.</p>
        <p className="mt-2">
          made by{" "}
          <a
            href="https://y2jnation.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-ink)]"
          >
            y2jnation.com
          </a>
        </p>
      </footer>
    </main>
  );
}
