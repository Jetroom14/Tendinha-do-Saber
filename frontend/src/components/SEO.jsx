import { Helmet } from "react-helmet-async";
import { getBookKey } from "@/lib/bookKey";

const SITE_NAME = "Tendinha do Saber";
const DEFAULT_DESCRIPTION = "A casa dos manuais escolares em Aveiro. Manuais, cadernos de fichas e plastificação com entrega em mão na região de Aveiro.";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = "/branding/social-share.png?v=20260826",
  type = "website",
  jsonLd = null,
  noIndex = false,
}) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · Manuais Escolares em Aveiro`;
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
  const imageUrl = image?.startsWith("http") ? image : (typeof window !== "undefined" ? `${window.location.origin}${image}` : image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="pt_PT" />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tendinha do Saber",
  description: "Livraria especializada em manuais escolares e cadernos de fichas, em Aveiro.",
  url: typeof window !== "undefined" ? window.location.origin : "",
  logo: typeof window !== "undefined"
    ? `${window.location.origin}/branding/logo-email.png`
    : "/branding/logo-email.png",
  telephone: "+351 961 194 491",
  email: "tendinhadosaber@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Aveiro",
    addressRegion: "Aveiro",
    addressCountry: "PT",
  },
  areaServed: ["Aveiro", "Ílhavo", "Vagos", "Águeda", "Oliveira do Bairro", "Ovar", "Estarreja", "Distrito de Aveiro"],
  priceRange: "€",
};

export const buildBookJsonLd = (book) => ({
  "@context": "https://schema.org",
  "@type": "Book",
  name: book.title,
  isbn: book.isbn13,
  author: book.author ? { "@type": "Person", name: book.author } : undefined,
  publisher: book.publisher ? { "@type": "Organization", name: book.publisher } : undefined,
  bookFormat: book.type === "Workbook" ? "https://schema.org/Paperback" : "https://schema.org/Hardcover",
  inLanguage: "pt-PT",
  image: book.image_url,
  description: book.synopsis,
  offers: {
    "@type": "Offer",
    price: book.price,
    priceCurrency: "EUR",
    availability: book.status === "Available" ? "https://schema.org/InStock" : (book.status === "PreOrder" ? "https://schema.org/PreOrder" : "https://schema.org/OutOfStock"),
    url: typeof window !== "undefined" ? `${window.location.origin}/livro/${encodeURIComponent(getBookKey(book))}` : "",
  },
});
