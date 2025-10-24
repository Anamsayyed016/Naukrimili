export interface JobPosting {
  id: string
  title: string
  company: {
    id: string
    name: string
    logo?: string
  }
  location: {
    city: string
    state?: string
    country: string
    remote?: boolean
  }
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote'
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
  salary: {
    min?: number
    max?: number
    currency: string
    period: 'hourly' | 'monthly' | 'yearly'
    isVisible: boolean
  }
  description: string
  requirements: string[]
  responsibilities: string[]
  qualifications: {
    education?: string[]
    experience?: string
    skills: string[]
    languages?: string[]
  }
  benefits: string[]
  status: 'draft' | 'published' | 'closed' | 'expired'
  visibility: 'public' | 'private' | 'featured'
  applicationDeadline?: string
  postedDate: string
  lastModified: string
  applicationUrl?: string
  applicationEmail?: string
  applicationProcess?: string
  departments?: string[]
  tags?: string[]
  metadata?: {
    views: number
    applications: number
    shares: number
    sourceUrl?: string
  }
}