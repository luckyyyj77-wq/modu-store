export function SeamDivider() {
  return (
    <div className="relative mx-2 hidden shrink-0 self-stretch md:block">
      <div className="seam-line mx-auto h-full" aria-hidden />
      <span
        className="seam-badge absolute left-1/2 top-6 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] font-medium text-[var(--color-seam)]"
        aria-hidden
      >
        모두
      </span>
    </div>
  );
}
