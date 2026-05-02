"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ProfileForm } from "@/components/espace-client/ProfileForm";
import { FileText, Download } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  linkAsButtonClasses,
  Spinner,
} from "@/components/espace-client/tenant-ui";

export default function ProfilPage() {
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
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" className="text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-lg rounded-none border border-navy/10 bg-white shadow-none">
        <CardContent className="space-y-5 px-8 py-14 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-navy/30">Profil</p>
          <p className="font-display text-xl text-navy">Connexion requise</p>
          <p className="mx-auto max-w-md text-sm text-navy/50">
            Connectez-vous pour accéder à vos informations personnelles.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/login?redirect=/espace-client/profil"
              className={linkAsButtonClasses("primary", "md", "rounded-none uppercase no-underline")}
            >
              Se connecter
            </Link>
            <Link
              href="/villas"
              className={linkAsButtonClasses("outline", "md", "rounded-none border-navy/25 uppercase no-underline")}
            >
              Voir les villas
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

      <Card className="rounded-none border border-navy/10 bg-white shadow-none">
        <CardHeader className="px-6 pb-0 pt-6">
          <CardTitle className="font-display text-base font-normal text-navy">
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

      <Card className="rounded-none border border-navy/10 bg-white shadow-none">
        <CardHeader className="px-6 pb-0 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-base font-normal text-navy">
              <FileText size={16} className="text-gold" />
              Mes documents
            </CardTitle>
            <Chip color="default" className="text-[10px] uppercase tracking-[0.2em]">
              Bientôt disponible
            </Chip>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Download size={32} className="text-navy/20" />
            <p className="text-sm text-navy/40">
              Vos contrats et factures apparaîtront ici dès qu&apos;ils seront disponibles.
            </p>
            <a
              href="/contact"
              className="text-[11px] font-bold uppercase tracking-widest text-gold transition-colors hover:text-navy"
            >
              Demander un document →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
