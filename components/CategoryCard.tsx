'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface CategoryCardProps {
  icon?: string;
  title?: string;
  count?: number;
  badge?: string;
  cta?: string;
  city?: string;
  jobCount?: number;
  isTrending?: boolean}

const CategoryCard: React.FC<CategoryCardProps> = ({ icon, title, count, badge, cta, city, jobCount, isTrending }) => {
  const router = useRouter();
  const handleClick = () => {
    if (city && title) {
      router.push(`/jobs?location=${encodeURIComponent(city)}&category=${encodeURIComponent(title)}`)} else if (title) {
      router.push(`/jobs?category=${encodeURIComponent(title)}`)} else if (city) {
      router.push(`/jobs?location=${encodeURIComponent(city)}`)}
  };
  return (
    <div
      tabIndex={0}
      className="bg-white shadow-lg rounded-xl p-6 flex flex-col gap-2 border-2 border-transparent transition-transform duration-200 hover:scale-105 hover:border-blue-600 focus:scale-105 focus:border-blue-600 outline-none cursor-pointer"
      style={{ fontFamily: 'Inter', minHeight: 120 }}
      onClick={handleClick}
      aria-label={title ? `${title}${count ? ', ' + count + '+ openings' : ''}` : city ? `${city}, ${jobCount} jobs` : ''}
      role="button"
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
        {title && <span className="text-lg font-semibold text-gray-900">{title}</span>}
        {badge && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {count && <div className="text-sm text-gray-500 mb-1">{count.toLocaleString()}+ Open Roles</div>}
      {city && <div className="flex items-center text-sm text-gray-700 mb-1"><span className="mr-1">ðŸ“</span>{city}</div>}
      {jobCount && <div className="text-xs text-right text-gray-500">{jobCount.toLocaleString()} Jobs{isTrending && <span className="ml-1 text-teal-600">ðŸ”¥</span>}</div>}
      {cta && <button className="mt-2 bg-teal-600 text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-teal-700 transition">{cta}</button>}
    </div>)};

export default CategoryCard; 
