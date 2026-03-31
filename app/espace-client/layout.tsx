"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Calendar, MessageCircle, User, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { EspaceClientProviders } from "@/components/espace-client/EspaceClientProviders";
import { TenantAvatar } from "@/components/espace-client/TenantAvatar";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/espace-client", label: "Mes réservations", icon: Calendar, exact: true },
  { href: "/espace-client/messagerie", label: "Messagerie SAV", icon: MessageCircle },
  { href: "/espace-client/profil", label: "Mon profil", icon: User },
];

function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={[
        "h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Chargement"
    />
  );
}

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<{ name?: string; email?: string; avatar?: string } | null>(null);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      setUserInfo(null);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setChecking(false);
        setUserInfo(null);
      } else {
        setChecking(false);
        setUserInfo({
          name: session.user.user_metadata?.full_name,
          email: session.user.email,
          avatar: session.user.user_metadata?.avatar_url,
        });
      }
    });
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.push("/");
  };

  return (
    <EspaceClientProviders>
      {checking ? (
        <div className="flex min-h-screen items-center justify-center bg-offwhite">
          <Spinner />
        </div>
      ) : (
      <div className="flex min-h-screen bg-offwhite">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-navy/10 shrink-0">
          <div className="flex flex-col flex-1 px-6 py-8">
            <div className="mb-10">
              <BrandLogo variant="onLight" size="sm" />
            </div>

            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-navy/30 mb-4">
              Espace Locataire
            </p>

            <nav className="flex flex-col gap-1 flex-1">
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors border-l-2 ${
                      active
                        ? "border-gold text-navy bg-navy/5"
                        : "border-transparent text-navy/45 hover:text-navy hover:border-navy/20"
                    }`}
                  >
                    <Icon size={15} strokeWidth={1} />
                    {label}
                    {active ? (
                      <span className="ml-auto rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-navy">
                        actif
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="my-4 h-px w-full bg-navy/10" />

            {userInfo && (
              <div className="flex items-center gap-3 min-w-0 mb-4">
                <TenantAvatar
                  name={userInfo.name}
                  url={userInfo.avatar}
                  size="md"
                  className="border border-navy/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  {userInfo.name && (
                    <p className="text-[11px] font-bold text-navy truncate">{userInfo.name}</p>
                  )}
                  {userInfo.email && (
                    <p className="text-[10px] text-navy/35 truncate max-w-[120px]">{userInfo.email}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="justify-start gap-2 text-navy/40 hover:text-navy px-0 h-auto py-1.5 w-full"
            >
              <LogOut size={15} strokeWidth={1} />
              Déconnexion
            </Button>
          </div>
        </aside>

        {/* Mobile header */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="safe-top md:hidden sticky top-0 z-40 flex items-center justify-between px-3 sm:px-4 h-14 border-b border-navy/10 bg-white/95">
            <div className="flex min-w-0 items-center gap-3">
              <BrandLogo variant="onLight" size="sm" />
              <Link
                href="/espace-client"
                className="font-display text-xs text-navy/50 tracking-wide truncate border-l border-navy/10 pl-3"
              >
                Espace Client
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {NAV.map(({ href, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`tap-target h-11 w-11 transition-colors ${
                      active ? "text-navy" : "text-navy/40 hover:text-navy"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1} />
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="tap-target text-navy/40 hover:text-navy h-11 w-11 min-w-0"
                aria-label="Déconnexion"
              >
                <LogOut size={18} strokeWidth={1} />
              </Button>
              {userInfo && (
                <TenantAvatar
                  name={userInfo.name}
                  url={userInfo.avatar}
                  size="sm"
                  className="border border-navy/10 shrink-0 ml-1 max-[420px]:hidden"
                />
              )}
            </div>
          </header>

          <main className="page-px flex-1 max-w-5xl w-full mx-auto py-4 md:py-10">
            {!userInfo && (
              <div className="mb-8 border border-gold/20 bg-gold/[0.04] p-5 md:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-navy/35 mb-1">
                  Accès invité
                </p>
                <p className="font-display text-lg text-navy mb-1">Connectez-vous pour accéder à vos réservations</p>
                <p className="text-sm text-navy/50 max-w-2xl">
                  Cet espace affiche vos séjours, votre livret d’accueil et la messagerie conciergerie. Sans compte, vous
                  pouvez tout de même parcourir nos villas.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/login?redirect=/espace-client" className="no-underline">
                    <Button
                      size="sm"
                      className="rounded-none uppercase text-[10px] font-bold tracking-[0.25em] px-5"
                    >
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/villas" className="no-underline">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none border-navy/25 text-navy uppercase text-[10px] font-bold tracking-[0.25em] px-5"
                    >
                      Découvrir les villas
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
      )}
    </EspaceClientProviders>
  );
}
