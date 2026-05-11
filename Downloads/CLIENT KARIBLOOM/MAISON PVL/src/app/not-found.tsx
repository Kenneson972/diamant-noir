import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-pvl py-20 text-center">
      <p className="text-pvl-kicker mb-6">404</p>
      <h1 className="font-display text-4xl md:text-5xl mb-4">
        Page non trouvée
      </h1>
      <p className="text-pvl-slate max-w-md mx-auto mb-10">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="inline-block bg-pvl-black text-pvl-white px-8 py-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.2em] hover:bg-pvl-charcoal transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
