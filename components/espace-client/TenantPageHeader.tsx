import { TenantAvatar } from "@/components/espace-client/TenantAvatar";

type TenantPageHeaderProps = {
  firstName?: string;
  avatarUrl?: string;
  subtitle?: string;
};

export function TenantPageHeader({ firstName, avatarUrl, subtitle }: TenantPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.42em] text-navy/40">
          {subtitle ?? "Conciergerie Kayvila"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-normal leading-none text-navy">
          Bonjour{firstName ? `, ${firstName}` : ""}
        </h1>
        <span className="mt-3 block h-px w-8 bg-gold/60" aria-hidden />
      </div>
      <TenantAvatar
        name={firstName}
        url={avatarUrl}
        size="lg"
        className="mt-1 shrink-0 border border-navy/10"
      />
    </div>
  );
}
