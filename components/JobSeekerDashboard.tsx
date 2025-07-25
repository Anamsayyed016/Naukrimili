import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  FileText, 
  BarChart3, 
  User, 
  ClipboardList, 
  Star,
  Search,
  SlidersHorizontal,
  MapPin,
  Upload
} from "lucide-react";
import { JobList } from '@/components/seeker/JobList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import ResumeUploadFlow from './ResumeUploadFlow';
import DashboardStats from './dashboard/DashboardStats';
import DashboardHeader from './dashboard/DashboardHeader';

function ResumeManagerPlaceholder() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-medium">Current Resume</h3>
          <p className="text-gray-400 text-sm">Last updated 2 days ago</p>
        </div>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Update
        </Button>
      </div>
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-blue-400" />
          <div>
            <p className="text-white font-medium">MyResume.pdf</p>
            <p className="text-gray-400 text-sm">2.4 MB • PDF</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">85%</p>
          <p className="text-gray-400 text-sm">ATS Score</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">12</p>
          <p className="text-gray-400 text-sm">Job Matches</p>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { title: "Applications", value: "24", change: "+3", icon: ClipboardList, gradient: "from-blue-500 to-blue-600" },
  { title: "Interviews", value: "5", change: "+1", icon: Briefcase, gradient: "from-green-500 to-green-600" },
  { title: "Saved Jobs", value: "12", change: "+2", icon: Star, gradient: "from-purple-500 to-purple-600" },
  { title: "Profile Score", value: "85%", change: "+5%", icon: User, gradient: "from-orange-500 to-orange-600" },
];

const tabs = [
  { label: "Overview", key: "overview" },
  { label: "Resume", key: "resume" },
  { label: "Applications", key: "applications" },
  { label: "Profile", key: "profile" },
];

export default function JobSeekerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    salary: [0, 50], // LPA
    experienceLevel: '',
  });
  const [activeTab, setActiveTab] = useState("overview");

  const handleViewStats = () => {
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <DashboardHeader
          title="Your NaukriMili Dashboard"
          subtitle="Manage your job search all in one place"
          actions={[
            {
              icon: BarChart3,
              label: "View Stats",
              onClick: handleViewStats,
            },
          ]}
        />

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8"
        >
          <div className="relative w-full md:w-96">
            <Input
              type="search"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
                <SheetDescription>
                  Refine your job search with specific criteria
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={filters.location}
                    onValueChange={(value) =>
                      setFilters({ ...filters, location: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Select
                    value={filters.jobType}
                    onValueChange={(value) =>
                      setFilters({ ...filters, jobType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Experience Level</label>
                  <Select
                    value={filters.experienceLevel}
                    onValueChange={(value) =>
                      setFilters({ ...filters, experienceLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level} value={level.toLowerCase()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Salary Range (LPA)</label>
                  <div className="pt-2">
                    <Slider
                      value={filters.salary}
                      onValueChange={(value) =>
                        setFilters({ ...filters, salary: value as number[] })
                      }
                      min={0}
                      max={50}
                      step={1}
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>₹{filters.salary[0]} LPA</span>
                      <span>₹{filters.salary[1]} LPA</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4"
                  onClick={() => {
                    setFilters({
                      location: '',
                      jobType: '',
                      salary: [0, 50],
                      experienceLevel: '',
                    });
                  }}
                  variant="outline"
                >
                  Reset Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="mb-8 mt-8">
          <div className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 font-semibold text-white transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" /> Resume Manager
                </h2>
                <ResumeManagerPlaceholder />
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cyan-400" /> Job Search
                </h2>
                <p className="text-gray-300">Find jobs tailored to your profile and interests.</p>
              </div>
            </div>
          )}
          {activeTab === "resume" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" /> Resume Manager
              </h2>
              <ResumeManagerPlaceholder />
            </div>
          )}
          {activeTab === "applications" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-400" /> Applications
              </h2>
              <p className="text-gray-300">Your job applications will appear here.</p>
            </div>
          )}
          {activeTab === "profile" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-orange-400" /> Profile
              </h2>
              <p className="text-gray-300">Manage your profile and settings here.</p>
            </div>
          )}
        </div>

        {/* Job List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <JobList 
            searchQuery={searchQuery}
            filters={filters}
          />
        </motion.div>
      </div>
    </div>
  );
}

const jobTypes = [
  'Full Time',
  'Part Time',
  'Contract',
  'Internship',
  'Freelance',
];

const experienceLevels = [
  'Entry Level',
  'Junior',
  'Mid Level',
  'Senior',
  'Lead',
]; 