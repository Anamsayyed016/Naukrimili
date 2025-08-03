'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  FileText, 
  BarChart3, 
  Search,
  SlidersHorizontal,
  MapPin,
  Upload,
  TrendingUp,
  Eye,
  Send,
  CheckCircle
} from 'lucide-react';
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
import ResumeUploadFlow from '../ResumeUploadFlow';
import DashboardLayout, { DashboardStats, DashboardAction } from './DashboardLayout';

export default function JobSeekerView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    salary: [0, 50], // LPA
    experienceLevel: '',
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard stats
  const stats: DashboardStats[] = [
    {
      title: "Applications",
      value: 12,
      change: "+3 this week",
      trend: "up",
      icon: <Send className="w-6 h-6" />
    },
    {
      title: "Profile Views",
      value: 45,
      change: "+12 this week",
      trend: "up",
      icon: <Eye className="w-6 h-6" />
    },
    {
      title: "Interviews",
      value: 3,
      change: "+1 this week",
      trend: "up",
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: "ATS Score",
      value: "85%",
      change: "+5% this week",
      trend: "up",
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];

  // Dashboard actions
  const actions: DashboardAction[] = [
    {
      icon: BarChart3,
      label: "View Stats",
      onClick: () => setActiveTab("overview"),
      variant: "outline"
    },
    {
      icon: Upload,
      label: "Upload Resume",
      onClick: () => setActiveTab("resume"),
      variant: "default"
    }
  ];

  const handleViewStats = () => {
    setActiveTab("overview");
  };

  return (
    <DashboardLayout
      title="Your NaukriMili Dashboard"
      subtitle="Manage your job search all in one place"
      stats={stats}
      actions={actions}
      userRole="jobseeker"
    >
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
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
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Job Filters</SheetTitle>
              <SheetDescription>
                Customize your job search preferences
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bangalore">Bangalore</SelectItem>
                    <SelectItem value="mumbai">Mumbai</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                    <SelectItem value="hyderabad">Hyderabad</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Type</label>
                <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Salary Range (LPA)</label>
                <div className="px-2">
                  <Slider
                    value={filters.salary}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, salary: value as number[] }))}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>₹{filters.salary[0]}L</span>
                    <span>₹{filters.salary[1]}L</span>
                  </div>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Job Matches</h2>
              <JobList 
                searchQuery={searchQuery}
                filters={filters}
                limit={5}
              />
            </div>
          </motion.div>
        )}

        {activeTab === "resume" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ResumeUploadFlow />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
} 