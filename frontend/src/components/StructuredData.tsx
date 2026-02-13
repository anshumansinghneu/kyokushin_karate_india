import Script from 'next/script'

export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Kyokushin Karate Foundation of India",
    "alternateName": "KKFI",
    "description": "The Kyokushin Karate Foundation of India (KKFI) offers authentic full-contact Kyokushin karate training for kids and adults across India. Led by Shihan Vasant Kumar Singh.",
    "url": "https://kyokushinfoundation.com",
    "logo": "https://kyokushinfoundation.com/kkfi-logo.avif",
    "image": "https://kyokushinfoundation.com/og-image.png",
    "sameAs": [
      // Add social media URLs when available
      // "https://www.facebook.com/KKFI",
      // "https://www.instagram.com/kkfi_india",
      // "https://www.youtube.com/@KKFI"
    ],
    "sport": "Karate",
    "foundingDate": "2020",
    "founder": {
      "@type": "Person",
      "name": "Shihan Vasant Kumar Singh",
      "jobTitle": "Chief Instructor & Founder"
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
      "telephone": "+91-99567-11400",
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
    "url": "https://kyokushinfoundation.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kyokushinfoundation.com/dojos?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": "Kyokushin Karate Foundation of India – Headquarters Dojo",
    "description": "Full-contact Kyokushin karate dojo offering classes for kids and adults. Self-defense, fitness, and belt grading programs available.",
    "url": "https://kyokushinfoundation.com/dojos",
    "telephone": "+91-99567-11400",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Shuklaganj Bypass Rd, Poni Road",
      "addressLocality": "Shuklaganj",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "209861",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "26.5123",
      "longitude": "80.3820"
    },
    "priceRange": "₹₹",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "06:00",
        "closes": "20:00"
      }
    ]
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Kyokushin Karate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Kyokushin Karate is the world's first and most respected full-contact karate style, founded by Sosai Masutatsu Oyama in 1964. Unlike point-fighting styles, Kyokushin practitioners fight with full-power strikes to the body and legs, developing real combat ability and unbreakable spirit."
        }
      },
      {
        "@type": "Question",
        "name": "What age can kids start Kyokushin Karate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Children as young as 5-6 years old can begin Kyokushin training. Early classes focus on basic movements, coordination, and discipline. Full-contact sparring is introduced gradually from ages 8-10 with appropriate supervision and protective gear."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Kyokushin Karate membership cost in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "KKFI membership registration costs ₹295 (₹250 + 18% GST) for a one-year membership. This includes access to all KKFI dojos, eligibility for belt gradings and tournaments, and a digital membership card."
        }
      },
      {
        "@type": "Question",
        "name": "How is Kyokushin different from Shotokan Karate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The biggest difference is contact level. Shotokan uses controlled/no-contact point sparring, while Kyokushin is full-contact — fighters strike with full power. Kyokushin also emphasizes extreme physical conditioning, body hardening, and real fighting ability over aesthetic form."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to get a black belt in Kyokushin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Achieving a Shodan (1st Dan black belt) in Kyokushin typically takes 4-6 years of dedicated training. The grading includes perfect kata execution, surviving a 20-man kumite, and demonstrating deep understanding of Kyokushin philosophy."
        }
      }
    ]
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
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema)
        }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
    </>
  )
}
