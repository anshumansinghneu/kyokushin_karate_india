import Script from 'next/script'

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Kyokushin Karate Foundation of India",
    "description": "Official platform for Kyokushin Karate Foundation of India training, belt promotion, and tournaments",
    "url": "https://kyokushin-karate-india.vercel.app",
    "logo": "https://kyokushin-karate-india.vercel.app/logos/kki-logo.png",
    "sameAs": [
      // Add social media URLs here when available
    ],
    "sport": "Karate",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Shuklaganj Bypass Rd, Poni Road",
      "addressLocality": "Shuklaganj",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "209861",
      "addressCountry": "IN"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-99567-11400",
      "contactType": "Customer Service",
      "availableLanguage": ["English", "Hindi"]
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kyokushin Karate Foundation of India",
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
