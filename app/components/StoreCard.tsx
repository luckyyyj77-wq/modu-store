import type { StoreApp } from "@/lib/types";

export function StoreCard({
  app,
  platform,
  index,
}: {
  app: StoreApp;
  platform: "ios" | "android";
  index: number;
}) {
  const accent =
    platform === "ios"
      ? "border-[var(--color-ios-line)] hover:border-[var(--color-ios)]"
      : "border-[var(--color-android-line)] hover:border-[var(--color-android)]";

  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`card-enter group flex items-center gap-3 rounded-xl border bg-[var(--color-paper-raised)] p-3 transition-colors ${accent}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={app.icon}
        alt=""
        width={52}
        height={52}
        className="h-13 w-13 shrink-0 rounded-[14px] bg-[var(--color-paper)] object-cover"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight text-[var(--color-ink)]">
          {app.name}
        </p>
        <p className="truncate text-[13px] text-[var(--color-ink-soft)]">
          {app.developer}
        </p>
        <div className="mt-1 flex items-center gap-2 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-ink-soft)]">
          {app.score !== null ? (
            <span className="flex items-center gap-1">
              <span aria-hidden>★</span>
              {app.score.toFixed(1)}
            </span>
          ) : (
            <span>평점 정보 없음</span>
          )}
          <span aria-hidden>·</span>
          <span>{app.price}</span>
        </div>
      </div>

      <span
        aria-hidden
        className="shrink-0 text-[var(--color-ink-soft)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)]"
      >
        ↗
      </span>
    </a>
  );
}
