"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Eye, Plus, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout, { DashboardStats, DashboardAction } from './DashboardLayout';

export default function CompanyView() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats: DashboardStats[] = [
    { title: 'Active Jobs', value: 8, change: '+2 this week', trend: 'up', icon: <Briefcase className="w-6 h-6" /> },
    { title: 'Total Applications', value: 156, change: '+23 this week', trend: 'up', icon: <Users className="w-6 h-6" /> },
    { title: 'Profile Views', value: 89, change: '+12 this week', trend: 'up', icon: <Eye className="w-6 h-6" /> },
    { title: 'Hired This Month', value: 3, change: '+1 this week', trend: 'up', icon: <CheckCircle className="w-6 h-6" /> }
  ];

  const actions: DashboardAction[] = [
    { icon: Plus, label: 'Post Job', onClick: () => setActiveTab('post-job'), variant: 'default' }
  ];

  const recentApplications = [
    { id: 1, name: 'Sarah Johnson', position: 'Senior React Developer', status: 'shortlisted', appliedDate: '2 hours ago' },
    { id: 2, name: 'Michael Chen', position: 'Full Stack Engineer', status: 'reviewed', appliedDate: '4 hours ago' },
    { id: 3, name: 'Emily Rodriguez', position: 'UI/UX Designer', status: 'pending', appliedDate: '6 hours ago' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-600';
      case 'reviewed':
        return 'bg-blue-600';
      case 'pending':
        return 'bg-secondary';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <DashboardLayout
      title="Company Dashboard"
      subtitle="Manage your job postings and applications"
      stats={stats}
      actions={actions}
      userRole="employer"
    >
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{application.name}</h4>
                          <p className="text-sm text-gray-300">{application.position}</p>
                          <p className="text-xs text-gray-400">{application.appliedDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getStatusColor(application.status)} text-white capitalize`}
                          variant="secondary"
                        >
                          {application.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => setActiveTab('post-job')}
                  >
                    <Plus className="w-6 h-6" />
                    <span>Post New Job</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
