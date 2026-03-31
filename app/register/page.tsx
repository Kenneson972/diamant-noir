import { redirect } from "next/navigation"

/**
 * URL dédiée inscription propriétaire → réutilise la page /login en mode inscription.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  const next = redirectTo || "/dashboard/proprio";
  redirect(`/login?tab=signup&redirect=${encodeURIComponent(next)}`);
}
