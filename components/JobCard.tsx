import React from 'react';
import Link from 'next/link';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  level: string;
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string};
  createdAt: string}

interface JobCardProps {
  job: Job}

export default function JobCard({ job }: JobCardProps) {
  const formatSalary = (salary: Job['salary']) => {
    if (!salary) return null;
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`};

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()};

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-600">{job.company}</p>
        </div>
        
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {job.type}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
            {job.level}
          </span>
          {job.remote && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
              Remote
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>📍 {job.location}</span>
          {job.salary && (
            <span>💰 {formatSalary(job.salary)}</span>
          )}
        </div>
        <span>{formatDate(job.createdAt)}</span>
      </div>
    </div>)}