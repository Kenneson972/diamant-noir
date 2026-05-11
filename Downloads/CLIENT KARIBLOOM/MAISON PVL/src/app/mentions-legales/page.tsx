import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — Maison PVL',
  description:
    'Mentions légales de Maison PVL.',
};

export default function LegalNoticesPage() {
  return (
    <div className="container-pvl py-section-md md:py-section-lg">
      <div className="max-w-3xl">
        <p className="text-pvl-kicker mb-4">Informations légales</p>
        <h1 className="text-pvl-section-title mb-4">Mentions légales</h1>
        <p className="text-sm text-pvl-slate mb-10">
          Dernière mise à jour : mai 2026
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        <section>
          <h2 className="font-display text-xl mb-3">Éditeur du site</h2>
          <div className="text-sm text-pvl-slate leading-relaxed space-y-1">
            <p><strong className="text-pvl-black">Maison PVL</strong></p>
            <p>Société par Actions Simplifiée (SAS)</p>
            <p>Au capital de 50 000 €</p>
            <p>RCS Paris B 888 888 888</p>
            <p>Numéro de TVA intracommunautaire : FR 88 888888888</p>
            <p>Siège social : 12 Rue de la Paix, 75001 Paris, France</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Directeur de la publication</h2>
          <div className="text-sm text-pvl-slate leading-relaxed">
            <p>Pierre-Victor Langlois, Président</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Hébergement</h2>
          <div className="text-sm text-pvl-slate leading-relaxed space-y-1">
            <p><strong className="text-pvl-black">Vercel Inc.</strong></p>
            <p>440 N Barranca Ave #4133</p>
            <p>Covina, CA 91723, États-Unis</p>
            <p>
              <a
                href="https://vercel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pvl-black transition-colors underline underline-offset-2"
              >
                www.vercel.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Contact</h2>
          <div className="text-sm text-pvl-slate leading-relaxed space-y-1">
            <p>Email : contact@maisonpvl.com</p>
            <p>Téléphone : +33 1 23 45 67 89</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Propriété intellectuelle</h2>
          <p className="text-sm text-pvl-slate leading-relaxed">
            L&apos;ensemble des contenus présents sur le site
            www.maisonpvl.com (textes, images, photographies, vidéos,
            illustrations, logos, marques) est protégé par le droit
            d&apos;auteur et le droit des marques. Toute reproduction,
            représentation, modification ou exploitation, totale ou partielle,
            sans autorisation écrite préalable de Maison PVL est interdite et
            pourra faire l&apos;objet de poursuites judiciaires.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Responsabilité</h2>
          <p className="text-sm text-pvl-slate leading-relaxed">
            Maison PVL s&apos;efforce d&apos;assurer l&apos;exactitude et la
            mise à jour des informations diffusées sur son site. Toutefois, la
            société ne saurait garantir l&apos;exactitude, la complétude ou
            l&apos;actualité des informations. En conséquence, Maison PVL
            décline toute responsabilité en cas d&apos;inexactitude ou
            d&apos;omission relative aux informations disponibles sur le site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl mb-3">Droit applicable</h2>
          <p className="text-sm text-pvl-slate leading-relaxed">
            Les présentes mentions légales sont soumises au droit français. En
            cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </section>
      </div>
    </div>
  );
}
