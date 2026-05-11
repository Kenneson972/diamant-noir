interface PageSEOProps {
  title?: string;
  description?: string;
  image?: string;
}

export function PageSEO({ title, description, image }: PageSEOProps) {
  const siteName = 'Maison PVL';
  const fullTitle = title ? `${title} — ${siteName}` : siteName;
  const desc =
    description ||
    "L'élégance sur mesure — Vêtements premium pour homme et femme";

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
    </>
  );
}
