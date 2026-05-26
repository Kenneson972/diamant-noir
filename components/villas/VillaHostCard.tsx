import { ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

type VillaHost = {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  role: string | null;
};

function HostAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <div className="w-16 h-16 shrink-0 overflow-hidden border border-navy/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-16 h-16 shrink-0 bg-gold/20 flex items-center justify-center border border-navy/10">
      <span className="text-navy font-bold text-lg">{initials}</span>
    </div>
  );
}

export function VillaHostCard({
  host,
  villaName,
}: {
  host: VillaHost | null;
  villaName: string;
}) {
  if (!host) return null;

  const name = host.full_name || "Votre hôte";
  const bio = host.role
    ? `${name}, ${host.role.toLowerCase()}, vous accueille dans ${villaName || "sa villa"}. Il sera ravi de partager ses meilleures adresses et de rendre votre séjour inoubliable.`
    : `${name} est le propriétaire de ${villaName || "cette villa d'exception"}. Passionné par sa région, il sera ravi de vous faire découvrir les trésors cachés de la Martinique.`;

  return (
    <section id="hote" className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-6">Votre hôte</h2>
      <div className="flex flex-col sm:flex-row gap-6 items-start border border-navy/10 bg-white p-6">
        <HostAvatar name={name} url={host.avatar_url} />

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-xl text-navy">{name}</h3>
            <span className="inline-flex items-center gap-1.5 border border-gold/30 bg-gold/[0.06] px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-navy">
              <ShieldCheck size={11} className="text-gold" />
              Hôte vérifié
            </span>
          </div>

          <p className="text-sm text-navy/60 leading-relaxed mb-4">{bio}</p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-navy/20 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-navy hover:border-navy transition-colors"
          >
            <Mail size={12} />
            Contacter l&apos;hôte
          </Link>
        </div>
      </div>
    </section>
  );
}
