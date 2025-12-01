/**
 * JobPosting Structured Data Component
 * Generates Google-compliant JSON-LD for job postings
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 * @see https://schema.org/JobPosting
 */

import React from 'react';
import { getBaseUrl } from '@/lib/url-utils';

interface JobPostingSchemaProps {
  job: {
    id: string | number;
    title: string;
    description: string;
    company: string | null;
    location: string | null;
    country: string;
    salary?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    jobType?: string | null;
    experienceLevel?: string | null;
    isRemote?: boolean;
    isHybrid?: boolean;
    createdAt: string;
    postedAt?: string | null;
    expiryDate?: string | null;
    applyUrl?: string | null;
    companyRelation?: {
      name: string;
      logo?: string | null;
      website?: string | null;
      location?: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
  };
  baseUrl?: string;
}

export default function JobPostingSchema({ job, baseUrl }: JobPostingSchemaProps) {
  // Use provided baseUrl or get canonical base URL
  const canonicalBaseUrl = baseUrl || getBaseUrl();
  // Map job types to Google's expected values
  const mapJobType = (jobType?: string | null): string => {
    const typeMap: Record<string, string> = {
      'full-time': 'FULL_TIME',
      'full_time': 'FULL_TIME',
      'fulltime': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'part_time': 'PART_TIME',
      'parttime': 'PART_TIME',
      'contract': 'CONTRACTOR',
      'contractor': 'CONTRACTOR',
      'temporary': 'TEMPORARY',
      'temp': 'TEMPORARY',
      'intern': 'INTERN',
      'internship': 'INTERN',
      'volunteer': 'VOLUNTEER',
      'per-diem': 'PER_DIEM',
      'other': 'OTHER',
    };
    
    const normalized = jobType?.toLowerCase().replace(/\s+/g, '-') || '';
    return typeMap[normalized] || 'FULL_TIME';
  };

  // Build the structured data object
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    
    // Required: Job title
    "title": job.title,
    
    // Required: Job description (plain text, no HTML)
    "description": job.description.replace(/<[^>]*>/g, '').substring(0, 5000),
    
    // Required: Unique identifier
    "identifier": {
      "@type": "PropertyValue",
      "name": "naukrimili",
      "value": `job-${job.id}`
    },
    
    // Required: Date posted (ISO 8601 format)
    "datePosted": job.postedAt || job.createdAt,
    
    // Recommended: Valid through date
    ...(job.expiryDate && {
      "validThrough": job.expiryDate
    }),
    
    // Required: Employment type
    "employmentType": mapJobType(job.jobType),
    
    // Required: Hiring organization
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companyRelation?.name || job.company || "Company",
      ...(job.companyRelation?.logo && { "logo": job.companyRelation.logo }),
      ...(job.companyRelation?.website && { "sameAs": job.companyRelation.website })
    },
    
    // Required: Job location with STREET ADDRESS and POSTAL CODE
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        // Google REQUIRES streetAddress or will show warning
        "streetAddress": job.companyRelation?.streetAddress || job.location || "Remote",
        // Google REQUIRES postalCode or will show warning
        "postalCode": job.companyRelation?.postalCode || "000000",
        "addressLocality": job.companyRelation?.city || job.location || "Multiple Locations",
        "addressRegion": job.companyRelation?.state || job.country,
        "addressCountry": job.country
      }
    },
    
    // Recommended: Base salary
    ...(job.salaryMin && job.salaryMax && {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": job.salaryCurrency || "INR",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salaryMin,
          "maxValue": job.salaryMax,
          "unitText": "YEAR"
        }
      }
    }),
    
    // Recommended: Direct apply URL
    ...(job.applyUrl && {
      "directApply": true,
      "applicationContact": {
        "@type": "ContactPoint",
        "url": job.applyUrl
      }
    }),
    
    // Additional recommended fields
    ...(job.experienceLevel && {
      "experienceRequirements": {
        "@type": "OccupationalExperienceRequirements",
        "monthsOfExperience": job.experienceLevel.includes('entry') ? 0 : 
                               job.experienceLevel.includes('mid') ? 24 : 
                               job.experienceLevel.includes('senior') ? 60 : 0
      }
    }),
    
    // Remote job indicator
    ...(job.isRemote && {
      "jobLocationType": "TELECOMMUTE"
    }),
    
    // Required: Applicant location requirements
    // Google REQUIRES this field or will show critical error
    "applicantLocationRequirements": (() => {
      // If fully remote, allow telecommuting
      if (job.isRemote) {
        return ["TELECOMMUTE"];
      }
      // If hybrid, allow both telecommuting and specific country
      if (job.isHybrid) {
        return [
          "TELECOMMUTE",
          {
            "@type": "Country",
            "name": job.country || "IN"
          }
        ];
      }
      // For on-site jobs, require specific country
      return [
        {
          "@type": "Country",
          "name": job.country || "IN"
        }
      ];
    })()
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}

