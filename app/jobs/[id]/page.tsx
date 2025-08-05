"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Building2, 
  Users, 
  Globe, 
  Star, 
  CheckCircle, 
  ExternalLink,
  Bookmark,
  Share2,
  Calendar,
  Award,
  Heart,
  MessageSquare,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Facebook
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary: string
  experience: string
  postedDate: string
  description: string
  requirements: string[]
  benefits: string[]
  responsibilities: string[]
  qualifications: string[]
  logo?: string
  rating?: number
  isRemote?: boolean
  isUrgent?: boolean
  companySize?: string
  industry?: string
  founded?: string
  website?: string
  about?: string
  culture?: string
  workLifeBalance?: number
  salaryRating?: number
  cultureRating?: number
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  // Mock job data
  const mockJob: Job = {
    id: params?.id as string,
    title: "Senior React Developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $150k",
    experience: "5+ years",
    postedDate: "2 days ago",
    description: "We're looking for a senior React developer to join our team and help build the next generation of web applications. You'll work with cutting-edge technologies and collaborate with a talented team of engineers, designers, and product managers.",
    requirements: ["React", "TypeScript", "Node.js", "AWS", "GraphQL", "Redux", "Jest", "Git"],
    benefits: ["Health insurance", "401k matching", "Remote work options", "Flexible hours", "Professional development", "Stock options", "Unlimited PTO", "Gym membership"],
    responsibilities: [
      "Lead the development of complex React applications",
      "Collaborate with cross-functional teams to define and implement new features",
      "Write clean, maintainable, and well-tested code",
      "Mentor junior developers and conduct code reviews",
      "Participate in architectural decisions and technical planning",
      "Optimize applications for maximum performance and scalability"
    ],
    qualifications: [
      "5+ years of experience with React and modern JavaScript",
      "Strong understanding of TypeScript and its best practices",
      "Experience with state management libraries (Redux, Zustand, etc.)",
      "Knowledge of testing frameworks and methodologies",
      "Experience with CI/CD pipelines and deployment processes",
      "Excellent problem-solving and communication skills"
    ],
    logo: "/placeholder-logo.png",
    rating: 4.5,
    isRemote: true,
    isUrgent: true,
    companySize: "100-500 employees",
    industry: "Technology",
    founded: "2018",
    website: "https://techcorp.com",
    about: "TechCorp is a leading technology company focused on building innovative solutions that transform how people work and live. We're passionate about creating products that make a difference.",
    culture: "We foster a culture of innovation, collaboration, and continuous learning. Our team values diversity, creativity, and pushing the boundaries of what's possible.",
    workLifeBalance: 4.2,
    salaryRating: 4.3,
    cultureRating: 4.6
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJob(mockJob)
      setLoading(false)
    }, 1000)

    // Check authentication status
    const token = localStorage.getItem('mock_token')
    setIsAuthenticated(!!token)
  }, [params?.id])

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }
    setShowApplyModal(true)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // In real app, this would call the API
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
            <Link href="/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href="/jobs">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={job.logo} alt={job.company} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-lg">
                          {job.company.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                          {job.title}
                        </CardTitle>
                        <CardDescription className="text-lg font-medium text-gray-600">
                          {job.company}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {job.isUrgent && (
                        <Badge className="bg-red-500 text-white border-0">
                          Urgent Hiring
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          Remote
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {job.type}
                    </div>
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {job.salary}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {job.postedDate}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-400 fill-current" />
                        <span className="text-sm text-gray-600">{job.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-600">{job.companySize}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBookmark}
                        className={isBookmarked ? "text-purple-600 border-purple-600" : ""}
                      >
                        <Bookmark className={`w-4 h-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
                        {isBookmarked ? "Saved" : "Save"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Job Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">{job.description}</p>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Responsibilities</h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Qualifications</h3>
                    <ul className="space-y-2">
                      {job.qualifications.map((qual, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Requirements & Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.requirements.map((req, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-24">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button 
                      onClick={handleApply}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold"
                    >
                      Apply Now
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Posted</span>
                        <span className="font-medium">{job.postedDate}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience</span>
                        <span className="font-medium">{job.experience}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Job Type</span>
                        <span className="font-medium">{job.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Salary</span>
                        <span className="font-medium text-green-600">{job.salary}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Company Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">About {job.company}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">{job.about}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Industry</span>
                      <span className="font-medium">{job.industry}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Company Size</span>
                      <span className="font-medium">{job.companySize}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Founded</span>
                      <span className="font-medium">{job.founded}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Work-Life Balance</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-400 fill-current" />
                        <span className="text-sm font-medium">{job.workLifeBalance}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Salary & Benefits</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-400 fill-current" />
                        <span className="text-sm font-medium">{job.salaryRating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Culture</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-400 fill-current" />
                        <span className="text-sm font-medium">{job.cultureRating}</span>
                      </div>
                    </div>
                  </div>

                  {job.website && (
                    <>
                      <Separator />
                      <Button variant="outline" className="w-full" asChild>
                        <a href={job.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Company Culture */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Company Culture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">{job.culture}</p>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Linkedin className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Facebook className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}