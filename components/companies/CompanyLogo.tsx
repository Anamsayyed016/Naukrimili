'use client';

import { useMemo, useState } from 'react';
import {
  getCompanyInitials,
  logoCandidates,
} from '@/lib/companies/company-utils';

type CompanyLogoProps = {
  name: string;
  logo?: string | null;
  website?: string | null;
  className?: string;
  imgClassName?: string;
  initialsClassName?: string;
};

export default function CompanyLogo({
  name,
  logo,
  website,
  className = 'w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0',
  imgClassName = 'w-8 h-8 object-contain',
  initialsClassName = 'text-sm font-semibold text-blue-700',
}: CompanyLogoProps) {
  const candidates = useMemo(
    () => logoCandidates(logo, website),
    [logo, website]
  );
  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const initials = getCompanyInitials(name);

  if (exhausted || candidates.length === 0 || index >= candidates.length) {
    return (
      <div
        className={className}
        title={name}
        aria-label={`${name} logo`}
      >
        <span
          className={`${initialsClassName} select-none`}
          aria-hidden
        >
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={candidates[index]}
        alt={`${name} logo`}
        className={imgClassName}
        loading="lazy"
        onError={() => {
          if (index + 1 >= candidates.length) {
            setExhausted(true);
          } else {
            setIndex((i) => i + 1);
          }
        }}
      />
    </div>
  );
}

export function CompanyLogoLarge({
  name,
  logo,
  website,
}: Pick<CompanyLogoProps, 'name' | 'logo' | 'website'>) {
  return (
    <CompanyLogo
      name={name}
      logo={logo}
      website={website}
      className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0"
      imgClassName="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
      initialsClassName="text-xl sm:text-2xl font-bold text-blue-700"
    />
  );
}

export function CompanyLogoMedium({
  name,
  logo,
  website,
}: Pick<CompanyLogoProps, 'name' | 'logo' | 'website'>) {
  return (
    <CompanyLogo
      name={name}
      logo={logo}
      website={website}
      className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-100"
      imgClassName="w-10 h-10 sm:w-12 sm:h-12 object-contain"
      initialsClassName="text-base font-semibold text-blue-700"
    />
  );
}
