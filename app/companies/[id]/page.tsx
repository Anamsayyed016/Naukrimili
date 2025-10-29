'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Globe, 
  ExternalLink,
  Briefcase,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  size: string | null;
  founded: number | null;
  isVerified: boolean;
  _count: {
    jobs: number;
  };
}

interface Job {
  id: string;
  title: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  postedAt: string | null;
  skills: string[];
  sector: string | null;
  views: number;
  applicationsCount: number;
}

export default function CompanyProfilePage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch company details
      const companyResponse = await fetch(`/api/companies/${companyId}/public`);
      if (!companyResponse.ok) throw new Error('Company not found');
      const companyData = await companyResponse.json();
      setCompany(companyData.data);
      
      // Fetch company jobs
      const jobsResponse = await fetch(`/api/companies/${companyId}/jobs`);
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
            <Link href="/companies">
              <Button variant="outline">← Back to Companies</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatSalary = (min: number | null, max: number | null, currency: string | null) => {
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `${currency || '₹'}${min.toLocaleString()} - ${currency || '₹'}${max.toLocaleString()}`;
    if (min) return `${currency || '₹'}${min.toLocaleString()}+`;
    if (max) return `Up to ${currency || '₹'}${max.toLocaleString()}`;
    return 'Salary not specified';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/companies">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Button>
        </Link>
      </div>

      {/* Company Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-32 h-32 rounded-lg object-contain border border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                <Building2 className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              {company.isVerified && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </Badge>
              )}
            </div>

            {company.description && (
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {company.description}
              </p>
            )}

            {/* Company Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {company.industry && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{company.industry}</div>
                  <div className="text-sm text-gray-500">Industry</div>
                </div>
              )}
              
              {company.location && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{company.location}</div>
                  <div className="text-sm text-gray-500">Location</div>
                </div>
              )}
              
              {company.size && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{company.size}</div>
                  <div className="text-sm text-gray-500">Company Size</div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{company._count.jobs}</div>
                <div className="text-sm text-gray-500">Open Jobs</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {company.website && (
                <Button variant="outline" asChild>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              
              <Button asChild>
                <Link href={`/jobs?company=${company.name}`}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  View All Jobs
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Company Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.founded && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Founded</div>
                  <div className="text-gray-600">{company.founded}</div>
                </div>
              </div>
            )}
            
            {company.industry && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Industry</div>
                  <div className="text-gray-600">{company.industry}</div>
                </div>
              </div>
            )}
            
            {company.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Headquarters</div>
                  <div className="text-gray-600">{company.location}</div>
                </div>
              </div>
            )}
            
            {company.size && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium">Company Size</div>
                  <div className="text-gray-600">{company.size} employees</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{company._count.jobs}</div>
              <div className="text-sm text-gray-600">Active Job Postings</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {company.isVerified ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Verified Company</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Open Positions at {company.name}
          </h2>
          <span className="text-gray-600">
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available
          </span>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No open positions</h3>
              <p className="text-gray-600">
                This company doesn't have any open positions at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <div className="flex gap-2">
                          {job.isUrgent && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          {job.isFeatured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                        )}
                        
                        {job.jobType && (
                          <Badge variant="outline">{job.jobType}</Badge>
                        )}
                        
                        {job.experienceLevel && (
                          <Badge variant="outline">{job.experienceLevel}</Badge>
                        )}
                        
                        {(job.isRemote || job.isHybrid) && (
                          <Badge variant="outline">
                            {job.isRemote ? 'Remote' : 'Hybrid'}
                          </Badge>
                        )}
                      </div>
                      
                      {(() => {
                        // Safely parse and normalize skills to an array
                        let skillsArray: string[] = [];
                        if (job.skills) {
                          if (Array.isArray(job.skills)) {
                            skillsArray = job.skills;
                          } else if (typeof job.skills === 'string') {
                            try {
                              const parsed = JSON.parse(job.skills);
                              skillsArray = Array.isArray(parsed) ? parsed : [];
                            } catch {
                              // If parsing fails, treat as single skill string
                              skillsArray = [job.skills];
                            }
                          }
                        }
                        
                        return skillsArray.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {skillsArray.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {skillsArray.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{skillsArray.length - 5} more
                              </span>
                            )}
                          </div>
                        ) : null;
                      })()}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <span>💰 {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                          <span>👁️ {job.views} views</span>
                          <span>📝 {job.applicationsCount} applications</span>
                        </div>
                        
                        {job.postedAt && (
                          <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button asChild>
                        <Link href={`/jobs/${job.id}/apply`}>
                          View Job
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
