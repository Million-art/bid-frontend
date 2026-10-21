export function SectionTag({ children }: { children: string }) {
  const isEthiopic = /[\u1200-\u137F]/.test(children);

  return (
    <div className="relative mb-6 sm:mb-10 flex justify-center px-4 max-w-full">
      <div className="relative inline-flex items-center max-w-full">
        <div className="relative z-10 rounded-xl bg-white px-6 py-2.5 sm:px-10 sm:py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] max-w-full">
          <p
            className={`whitespace-nowrap text-sm sm:text-lg md:text-xl font-extrabold uppercase text-[#2D9FF6] ${
              isEthiopic ? "tracking-normal" : "tracking-widest sm:tracking-[0.25em]"
            }`}
          >
            {children}
          </p>
        </div>
        <span
          className="absolute -right-1.5 sm:-right-2 top-1/2 h-[65%] w-2 sm:w-2.5 -translate-y-1/2 rounded-[3px] bg-[#FFF307]"
          aria-hidden
        />
      </div>
    </div>
  );
}
