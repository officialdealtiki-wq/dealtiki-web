import { Deal } from "../types";

export interface SEOOptions {
  title: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: "website" | "article" | "product";
}

export function updatePageSEO(options: SEOOptions | string, descriptionFallback?: string) {
  const opts: SEOOptions =
    typeof options === "string"
      ? { title: options, description: descriptionFallback }
      : options;

  const fullTitle = opts.title.includes("DealTiki") ? opts.title : `${opts.title} | DealTiki`;
  document.title = fullTitle;

  const desc =
    opts.description ||
    "Discover verified deals, coupons and lowest prices from Amazon, Flipkart, Croma and top Indian merchants.";

  // Standard Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", desc);

  // OpenGraph Tags
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute("content", fullTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement("meta");
    ogDesc.setAttribute("property", "og:description");
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute("content", desc);

  let ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) {
    ogType = document.createElement("meta");
    ogType.setAttribute("property", "og:type");
    document.head.appendChild(ogType);
  }
  ogType.setAttribute("content", opts.type || "website");

  if (opts.imageUrl) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement("meta");
      ogImg.setAttribute("property", "og:image");
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute("content", opts.imageUrl);
  }

  // Twitter Tags
  let twCard = document.querySelector('meta[name="twitter:card"]');
  if (!twCard) {
    twCard = document.createElement("meta");
    twCard.setAttribute("name", "twitter:card");
    document.head.appendChild(twCard);
  }
  twCard.setAttribute("content", opts.imageUrl ? "summary_large_image" : "summary");

  let twTitle = document.querySelector('meta[name="twitter:title"]');
  if (!twTitle) {
    twTitle = document.createElement("meta");
    twTitle.setAttribute("name", "twitter:title");
    document.head.appendChild(twTitle);
  }
  twTitle.setAttribute("content", fullTitle);

  let twDesc = document.querySelector('meta[name="twitter:description"]');
  if (!twDesc) {
    twDesc = document.createElement("meta");
    twDesc.setAttribute("name", "twitter:description");
    document.head.appendChild(twDesc);
  }
  twDesc.setAttribute("content", desc);

  // Canonical Link Tag
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  const canonicalHref = opts.canonicalUrl || window.location.href.split("?")[0];
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute("href", canonicalHref);
}

/**
 * Injects Schema.org Product structured data strictly using authentic values.
 * Never fabricates prices, ratings, reviews, or fake expiration dates.
 */
export function injectProductSchema(deal: Deal) {
  const existingScript = document.getElementById("dealtiki-jsonld-schema");
  if (existingScript) {
    existingScript.remove();
  }

  // Only create structured product data when sufficient authentic values exist
  if (!deal || !deal.title) return;

  const schemaData: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: deal.title,
    description: deal.description || deal.title,
  };

  if (deal.image) {
    schemaData.image = [deal.image];
  }

  if (deal.merchant) {
    schemaData.brand = {
      "@type": "Brand",
      name: deal.merchant,
    };
  }

  // Authentic Offer data only
  if (deal.price && deal.price > 0) {
    const offer: any = {
      "@type": "Offer",
      priceCurrency: "INR",
      price: deal.price,
      itemCondition: "https://schema.org/NewCondition",
      availability:
        deal.status === "expired"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    };

    if (deal.affiliateLink) {
      offer.url = deal.affiliateLink;
    }

    if (deal.merchant) {
      offer.seller = {
        "@type": "Organization",
        name: deal.merchant,
      };
    }

    // Only include priceValidUntil if an authentic expiration date exists from backend
    if (deal.expiresAt) {
      try {
        const iso = new Date(deal.expiresAt).toISOString().split("T")[0];
        offer.priceValidUntil = iso;
      } catch {
        // omit if invalid
      }
    }

    schemaData.offers = offer;
  }

  // Authentic ratings only
  if (deal.rating && deal.rating > 0 && deal.reviewCount && deal.reviewCount > 0) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: deal.rating,
      reviewCount: deal.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  const script = document.createElement("script");
  script.id = "dealtiki-jsonld-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}
