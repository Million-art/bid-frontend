"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, ShieldCheck, Menu, X } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { isStaffRole } from "@/services/auth.service";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export const Navbar = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { label: "Auctions", href: "/auctions" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Winners", href: "/#winners" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 py-0 shadow-sm backdrop-blur-md transition-all duration-500">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-50 md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="CarraMarket"
              width={160}
              height={50}
              className="h-9 w-auto object-contain sm:h-12"
              priority
            />
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <NotificationBell />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className="flex max-w-[min(100vw-8rem,220px)] items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-3"
                    >
                      {user.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.picture}
                          className="h-8 w-8 shrink-0 rounded-full"
                          alt=""
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-900">
                          {user.fullName?.charAt(0)?.toUpperCase() ||
                            user.email?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                      <span className="hidden max-w-[120px] truncate sm:inline">
                        {user.fullName || user.email}
                      </span>
                    </button>

                    {accountMenuOpen && (
                      <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white shadow-lg">
                        {isStaffRole(user.role) && (
                          <Link
                            href="/staffpanel"
                            className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm font-bold text-[var(--brand-blue)] hover:bg-blue-50/60"
                            onClick={() => setAccountMenuOpen(false)}
                          >
                            <ShieldCheck className="h-4 w-4" /> Staff Panel
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" /> Account settings
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/login"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-slate-900 bg-transparent px-4 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] sm:px-5"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border-2 border-[var(--brand-blue)] bg-[var(--brand-blue)] px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all hover:brightness-110 active:scale-[0.98] sm:px-5"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-x-0 top-16 z-40 overflow-hidden bg-white shadow-xl transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen
            ? "max-h-[100vh] border-b py-4 opacity-100"
            : "max-h-0 py-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-4 py-3 text-base font-bold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
