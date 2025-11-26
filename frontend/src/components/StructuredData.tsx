import Script from 'next/script'

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Kyokushin Karate India",
    "description": "Official platform for Kyokushin Karate India training, belt promotion, and tournaments",
    "url": "https://kyokushin-karate-india.vercel.app",
    "logo": "https://kyokushin-karate-india.vercel.app/logos/kki-logo.png",
    "sameAs": [
      // Add social media URLs here when available
    ],
    "sport": "Karate",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["English", "Hindi"]
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kyokushin Karate India",
    "url": "https://kyokushin-karate-india.vercel.app",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kyokushin-karate-india.vercel.app/dojos?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
    </>
  )
}
