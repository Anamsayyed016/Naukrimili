"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  MapPin, 
  Building2, 
  Users, 
  Star, 
  Globe, 
  Calendar, 
  Filter,
  TrendingUp,
  Award,
  Heart,
  ExternalLink,
  Briefcase,
  DollarSign,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import Link from "next/link"

interface Company {
  id: string
  name: string
  description: string
  industry: string
  size: string
  location: string
  founded: string
  website: string
  logo?: string
  rating: number
  reviewCount: number
  workLifeBalance: number
  salaryRating: number
  cultureRating: number
  activeJobs: number
  isHiring: boolean
  isTrending?: boolean
  benefits: string[]
  technologies: string[]
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Mock company data
  const mockCompanies: Company[] = [
    {
      id: "1",
      name: "TechCorp",
      description: "Leading technology company focused on innovative solutions that transform how people work and live.",
      industry: "Technology",
      size: "100-500 employees",
    location: "San Francisco, CA",
      founded: "2018",
      website: "https://techcorp.com",
      logo: "/placeholder-logo.png",
      rating: 4.5,
      reviewCount: 234,
      workLifeBalance: 4.2,
      salaryRating: 4.3,
      cultureRating: 4.6,
      activeJobs: 12,
      isHiring: true,
      isTrending: true,
      benefits: ["Health insurance", "401k matching", "Remote work", "Flexible hours"],
      technologies: ["React", "Node.js", "Python", "AWS"]
  },
  {
      id: "2",
      name: "DesignStudio",
      description: "Creative agency specializing in user experience design and digital product development.",
      industry: "Design",
      size: "50-100 employees",
      location: "New York, NY",
      founded: "2015",
      website: "https://designstudio.com",
      logo: "/placeholder-logo.png",
      rating: 4.2,
      reviewCount: 156,
      workLifeBalance: 4.0,
      salaryRating: 3.8,
      cultureRating: 4.4,
      activeJobs: 8,
      isHiring: true,
      benefits: ["Creative environment", "Professional development", "Health benefits"],
      technologies: ["Figma", "Adobe Creative Suite", "Sketch", "InVision"]
  },
  {
      id: "3",
      name: "AI Solutions",
      description: "Pioneering artificial intelligence solutions for enterprise clients worldwide.",
      industry: "Artificial Intelligence",
      size: "200-500 employees",
      location: "Remote",
      founded: "2020",
      website: "https://aisolutions.com",
      logo: "/placeholder-logo.png",
      rating: 4.8,
      reviewCount: 89,
      workLifeBalance: 4.5,
      salaryRating: 4.7,
      cultureRating: 4.8,
      activeJobs: 15,
      isHiring: true,
      isTrending: true,
      benefits: ["Competitive salary", "Stock options", "Remote work", "Learning budget"],
      technologies: ["Python", "TensorFlow", "PyTorch", "AWS", "Kubernetes"]
  },
  {
      id: "4",
      name: "StartupXYZ",
      description: "Fast-growing startup revolutionizing the fintech industry with innovative payment solutions.",
      industry: "Fintech",
      size: "10-50 employees",
      location: "Austin, TX",
      founded: "2022",
      website: "https://startupxyz.com",
      logo: "/placeholder-logo.png",
      rating: 4.1,
      reviewCount: 67,
      workLifeBalance: 3.8,
      salaryRating: 4.0,
      cultureRating: 4.2,
      activeJobs: 5,
      isHiring: true,
      benefits: ["Equity", "Flexible PTO", "Health insurance", "Remote work"],
      technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Docker"]
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompanies(mockCompanies)
      setFilteredCompanies(mockCompanies)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    // Filter companies based on search and filters
    let filtered = companies.filter(company => {
      const matchesQuery = !searchQuery || 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry
      const matchesSize = !selectedSize || company.size === selectedSize

      return matchesQuery && matchesIndustry && matchesSize
    })

    setFilteredCompanies(filtered)
  }, [companies, searchQuery, selectedIndustry, selectedSize])

  const industries = [...new Set(companies.map(c => c.industry))]
  const sizes = [...new Set(companies.map(c => c.size))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium mb-4 shadow">
              <Sparkles className="w-4 h-4 mr-2" />
              Top Companies
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent mb-4">
              Discover Amazing Companies
            </h1>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Explore companies that are hiring and find your perfect workplace
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
           <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-8 shadow-lg">
             <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
               <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                 <Input
                   type="text"
                   placeholder="Search companies, industries, or locations..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-10 h-10 sm:h-12 bg-white/20 border-white/20 text-white placeholder:text-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-sm sm:text-base"
                 />
               </div>

                {/* Filter Toggle */}
                <Button
                   variant="outline"
                   onClick={() => setShowFilters(!showFilters)}
                 className="h-10 sm:h-12 px-4 sm:px-6 border-white/20 text-white hover:bg-white/10 rounded-xl text-sm sm:text-base"
                >
                 <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: "auto" }}
                     exit={{ opacity: 0, height: 0 }}
                     transition={{ duration: 0.3 }}
                    className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                       <label className="text-xs sm:text-sm font-medium text-white mb-2 block">Industry</label>
                        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                         <SelectTrigger className="bg-white/20 border-white/20 text-white text-xs sm:text-base">
                            <SelectValue placeholder="All industries" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                       <label className="text-xs sm:text-sm font-medium text-white mb-2 block">Company Size</label>
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                         <SelectTrigger className="bg-white/20 border-white/20 text-white text-xs sm:text-base">
                            <SelectValue placeholder="All sizes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All sizes</SelectItem>
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

      {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6"
        >
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {loading ? "Loading companies..." : `${filteredCompanies.length} companies found`}
            </h2>
            {!loading && (
              <p className="text-gray-600">
                Discover opportunities at these amazing companies
              </p>
            )}
          </div>
        </motion.div>

        {/* Companies Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
        </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCompanies.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedIndustry("")
                      setSelectedSize("")
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
      </div>
          ) : (
            filteredCompanies.map((company, index) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
          >
                <Card className="h-full border-gray-200/50 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={company.logo} alt={company.name} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                            {company.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                    <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">
                        {company.name}
                      </CardTitle>
                          <CardDescription className="text-gray-600">
                          {company.industry}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {company.isTrending && (
                          <Badge className="bg-orange-100 text-orange-800 border-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                        </Badge>
                        )}
                        {company.isHiring && (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            Hiring
                        </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {company.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {company.size}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Founded {company.founded}
                  </div>
                </div>
              </CardHeader>

                  <CardContent className="pt-0">
                                         <p className="text-gray-700 text-sm mb-4 line-clamp-3 overflow-hidden">
                      {company.description}
                    </p>

                    {/* Ratings */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-purple-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">{company.rating}</span>
                        <span className="text-sm text-gray-500">({company.reviewCount} reviews)</span>
                  </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Work-Life: {company.workLifeBalance}</span>
                        <span>Salary: {company.salaryRating}</span>
                        <span>Culture: {company.cultureRating}</span>
                  </div>
                </div>

                    {/* Technologies */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.technologies.slice(0, 4).map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tech}
                    </Badge>
                  ))}
                        {company.technologies.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.technologies.length - 4} more
                          </Badge>
                        )}
                      </div>
                </div>

                    {/* Active Jobs */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">
                          {company.activeJobs} active jobs
                        </span>
                  </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-4 h-4" />
                          </a>
                    </Button>
                  </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link href={`/companies/${company.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Profile
                        </Button>
                      </Link>
                      <Link href={`/jobs?company=${company.id}`} className="flex-1">
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">
                          View Jobs
                        </Button>
                      </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}
