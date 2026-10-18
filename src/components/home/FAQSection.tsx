"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SectionTag } from "@/components/home/SectionTag";
import { useLanguage } from "@/contexts/LanguageContext";

export function FAQSection() {
  const { dict } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = dict.faq.items;

  return (
    <section id="faq" className="scroll-mt-24 relative overflow-hidden py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[#f4f6f8]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, #dbe3ea 1px, transparent 1px), linear-gradient(to bottom, #dbe3ea 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionTag>{dict.faq.tag}</SectionTag>
        <ul className="space-y-3">
          {faqs.map((item, index) => {
            const open = openIndex === index;
            return (
              <li key={item.q}>
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                    aria-expanded={open}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span className="flex-1 text-[15px] font-semibold leading-snug text-slate-800 sm:text-base">
                      {item.q}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                      {open ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-600 sm:px-6">
                      {item.a}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

