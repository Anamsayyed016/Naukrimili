'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { LazyMotionShell, m } from '@/components/motion/LazyMotionShell';

export type HeroFilters = {
  query: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: string;
  salaryMax: string;
};

export type HeroDynamicConstants = {
  jobTypes: Array<string | { value: string; label: string; count?: number }>;
  experienceLevels: Array<string | { value: string; label: string; count?: number }>;
  locations: unknown[];
};

export interface JobSearchHeroAdvancedFiltersPanelProps {
  filters: HeroFilters;
  setFilters: Dispatch<SetStateAction<HeroFilters>>;
  dynamicConstants: HeroDynamicConstants;
}

export default function JobSearchHeroAdvancedFiltersPanel({
  filters,
  setFilters,
  dynamicConstants,
}: JobSearchHeroAdvancedFiltersPanelProps) {
  return (
    <LazyMotionShell>
      <m.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 sm:mt-6 space-y-4"
      >
        <div className="rounded-2xl p-4 sm:p-5 bg-white/65 backdrop-blur-md border border-slate-200/70 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12),inset_0_1px_0_0_rgba(255,255,255,0.6)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                Job Type
                <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Required</Badge>
              </Label>
              <Select value={filters.jobType} onValueChange={(value) => setFilters((prev) => ({ ...prev, jobType: value }))}>
                <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                  <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Types</SelectItem>
                  {dynamicConstants.jobTypes && dynamicConstants.jobTypes.length > 0 ? (
                    dynamicConstants.jobTypes.map((jobType) => {
                      const value = typeof jobType === 'string' ? jobType : jobType.value;
                      const label = typeof jobType === 'string' ? jobType : jobType.label;
                      const count = typeof jobType === 'string' ? undefined : jobType.count;
                      return (
                        <SelectItem key={value} value={value} className="text-gray-900 hover:bg-blue-50">
                          {label} {count ? `(${count})` : ''}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      <SelectItem value="full-time" className="text-gray-900 hover:bg-blue-50">Full-time</SelectItem>
                      <SelectItem value="part-time" className="text-gray-900 hover:bg-blue-50">Part-time</SelectItem>
                      <SelectItem value="contract" className="text-gray-900 hover:bg-blue-50">Contract</SelectItem>
                      <SelectItem value="internship" className="text-gray-900 hover:bg-blue-50">Internship</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                Experience
                <Badge className="bg-purple-100 text-purple-800 border-0 text-xs">Smart</Badge>
              </Label>
              <Select
                value={filters.experienceLevel}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, experienceLevel: value }))}
              >
                <SelectTrigger className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
                  <SelectItem value="all" className="text-gray-900 hover:bg-blue-50">All Levels</SelectItem>
                  {dynamicConstants.experienceLevels && dynamicConstants.experienceLevels.length > 0 ? (
                    dynamicConstants.experienceLevels.map((level) => {
                      const value = typeof level === 'string' ? level : level.value;
                      const label = typeof level === 'string' ? level : level.label;
                      const count = typeof level === 'string' ? undefined : level.count;
                      return (
                        <SelectItem key={value} value={value} className="text-gray-900 hover:bg-blue-50">
                          {label} {count ? `(${count})` : ''}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      <SelectItem value="entry" className="text-gray-900 hover:bg-blue-50">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid" className="text-gray-900 hover:bg-blue-50">Mid Level (2-5 years)</SelectItem>
                      <SelectItem value="senior" className="text-gray-900 hover:bg-blue-50">Senior Level (5-10 years)</SelectItem>
                      <SelectItem value="lead" className="text-gray-900 hover:bg-blue-50">Lead (10+ years)</SelectItem>
                      <SelectItem value="executive" className="text-gray-900 hover:bg-blue-50">Executive</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                Min Salary
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
              </Label>
              <Input
                placeholder="e.g., 50000"
                value={filters.salaryMin}
                onChange={(e) => setFilters((prev) => ({ ...prev, salaryMin: e.target.value }))}
                type="number"
                className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                Max Salary
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">Optional</Badge>
              </Label>
              <Input
                placeholder="e.g., 100000"
                value={filters.salaryMax}
                onChange={(e) => setFilters((prev) => ({ ...prev, salaryMax: e.target.value }))}
                type="number"
                className="h-12 sm:h-14 border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-gray-900 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-6 border-2 border-gray-200 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remote"
                    checked={filters.isRemote}
                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, isRemote: !!checked }))}
                    className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
                  />
                  <Label htmlFor="remote" className="text-sm sm:text-base font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                    Remote Work
                    <Badge className="bg-orange-100 text-orange-800 border-0 text-xs">Popular</Badge>
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </LazyMotionShell>
  );
}
