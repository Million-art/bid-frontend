"use client";

import { CircleDollarSign, Target, Trophy } from "lucide-react";
import { SectionTag } from "@/components/home/SectionTag";
import { useLanguage } from "@/contexts/LanguageContext";

export function HowLubWorks() {
  const { dict } = useLanguage();

  const steps = [
    {
      icon: CircleDollarSign,
      title: dict.howItWorks.step1Title,
      body: dict.howItWorks.step1Desc,
    },
    {
      icon: Target,
      title: dict.howItWorks.step2Title,
      body: dict.howItWorks.step2Desc,
    },
    {
      icon: Trophy,
      title: dict.howItWorks.step3Title,
      body: dict.howItWorks.step3Desc,
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTag>{dict.howItWorks.tag}</SectionTag>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {dict.howItWorks.title}
          </h2>
          <p className="mt-3 text-base text-slate-600">
            {dict.howItWorks.subtitle}
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {dict.common.step} {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

