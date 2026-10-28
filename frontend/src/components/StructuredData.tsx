
// Inline <script> tags, not next/script: JSON-LD must be in the server HTML that
// crawlers read first, and next/script only injects after the page loads.
export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Kyokushin Karate Foundation of India",
    "alternateName": "KKFI",
    "description": "The Kyokushin Karate Foundation of India (KKFI) offers authentic full-contact Kyokushin karate training for kids and adults across India. Led by Shihan Vasant Kumar Singh.",
    "url": "https://www.kyokushinfoundation.com",
    "logo": "https://www.kyokushinfoundation.com/kkfi-logo.png",
    "image": "https://www.kyokushinfoundation.com/opengraph-image",
    "sameAs": [
      // Add social media URLs when available
      // "https://www.facebook.com/KKFI",
      // "https://www.instagram.com/kkfi_india",
      // "https://www.youtube.com/@KKFI"
    ],
    "sport": "Kyokushin Karate",
    "foundingDate": "2013",
    "founder": {
      "@type": "Person",
      "name": "Shihan Vasant Kumar Singh",
      "jobTitle": "Country Director, World Kyokushin Kaikan India"
    },
    "memberOf": {
      "@type": "SportsOrganization",
      "name": "World Kyokushin Kaikan"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Shuklaganj Bypass Rd, Poni Road",
      "addressLocality": "Shuklaganj",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "209861",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-99567-45114",
      "contactType": "Customer Service",
      "availableLanguage": ["English", "Hindi"]
    },
    "knowsAbout": [
      "Kyokushin Karate",
      "Full Contact Karate",
      "Martial Arts Training",
      "Self Defense Classes",
      "Karate for Kids",
      "Belt Grading Syllabus",
      "Karate Tournaments India"
    ]
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kyokushin Karate Foundation of India",
    "alternateName": "KKFI",
    "url": "https://www.kyokushinfoundation.com"
  }

  // Each dojo's location data lives on its own page (app/dojos/[id]/layout.tsx) and the
  // city pages; FAQ markup is not site-wide, since it must match questions shown on the page.

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c')
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c')
        }}
      />
    </>
  )
}
