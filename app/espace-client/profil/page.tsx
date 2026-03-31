"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ProfileForm } from "@/components/espace-client/ProfileForm";
import { FileText, Download } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(session.user);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-label="Chargement" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="border border-navy/10 bg-white shadow-none rounded-none max-w-lg">
        <CardContent className="px-8 py-14 text-center space-y-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-navy/30">Profil</p>
          <p className="font-display text-xl text-navy">Connexion requise</p>
          <p className="text-sm text-navy/50 max-w-md mx-auto">
            Connectez-vous pour accéder à vos informations personnelles.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/login?redirect=/espace-client/profil" className="no-underline">
              <Button
                className="rounded-none uppercase text-[10px] font-bold tracking-[0.25em] px-6"
              >
                Se connecter
              </Button>
            </Link>
            <Link href="/villas" className="no-underline">
              <Button
                variant="outline"
                className="rounded-none border-navy/25 text-navy uppercase text-[10px] font-bold tracking-[0.25em] px-6"
              >
                Voir les villas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metadata = user.user_metadata ?? {};

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <h1 className="font-display text-2xl text-navy">Mon profil</h1>
        <p className="text-sm text-navy/50 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Card className="border border-navy/10 bg-white shadow-none rounded-none">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="font-display text-base text-navy font-normal">
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ProfileForm
            email={user.email ?? ""}
            initialName={metadata.full_name ?? ""}
            initialPhone={metadata.phone ?? ""}
          userId={user.id}
            currentAvatar={metadata.avatar_url}
          demoMode={false}
          />
        </CardContent>
      </Card>

      <Card className="border border-navy/10 bg-white shadow-none rounded-none">
        <CardHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base text-navy font-normal flex items-center gap-2">
              <FileText size={16} className="text-gold" />
              Mes documents
            </CardTitle>
            <span className="inline-flex items-center rounded-full border border-navy/10 bg-offwhite px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-navy/50">
              Bientôt disponible
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <Download size={32} className="text-navy/20" />
            <p className="text-sm text-navy/40">
              Vos contrats et factures apparaîtront ici dès qu&apos;ils seront disponibles.
            </p>
            <a
              href="/contact"
              className="text-[11px] font-bold uppercase tracking-widest text-gold hover:text-navy transition-colors"
            >
              Demander un document →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
