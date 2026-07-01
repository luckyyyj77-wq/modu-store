import type { StoreApp } from "@/lib/types";
import { StoreCard } from "./StoreCard";

export function ResultsColumn({
  platform,
  label,
  icon,
  apps,
  error,
  hasSearched,
}: {
  platform: "ios" | "android";
  label: string;
  icon: string;
  apps: StoreApp[];
  error: string | null;
  hasSearched: boolean;
}) {
  const tint =
    platform === "ios"
      ? "bg-[var(--color-ios-tint)] text-[var(--color-ios)]"
      : "bg-[var(--color-android-tint)] text-[var(--color-android)]";

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[15px] ${tint}`}
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="text-[15px] font-bold">{label}</h2>
        {hasSearched && !error && (
          <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-ink-soft)]">
            {apps.length}건
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/5 p-3 text-[13px] text-[var(--color-coral)]">
          {error}
        </p>
      )}

      {!error && hasSearched && apps.length === 0 && (
        <p className="rounded-lg border border-dashed border-[var(--color-ink-soft)]/25 p-4 text-[13px] text-[var(--color-ink-soft)]">
          이 마켓에서는 검색 결과가 없어요.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {apps.map((app, i) => (
          <StoreCard key={app.id} app={app} platform={platform} index={i} />
        ))}
      </div>
    </div>
  );
}
