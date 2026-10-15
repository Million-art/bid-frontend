export function SectionTag({ children }: { children: string }) {
  return (
    <div className="relative mb-10 flex justify-center">
      <div className="relative inline-flex items-center">
        <div className="relative z-10 rounded-xl bg-white px-10 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <p className="text-lg font-extrabold uppercase tracking-[0.32em] text-[#2D9FF6] sm:text-xl">
            {children}
          </p>
        </div>
        <span
          className="absolute -right-2 top-1/2 h-[70%] w-2.5 -translate-y-1/2 rounded-[3px] bg-[#FFF307]"
          aria-hidden
        />
      </div>
    </div>
  );
}
