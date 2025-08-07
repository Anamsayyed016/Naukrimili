'use client';
import React, {
  useState
}
} from 'react';
import {
  motion
}
} from 'framer-motion';
import {
  Building,
  Briefcase,
  Users,
  BarChart3,
  Plus,
  TrendingUp,
  Eye,
  Send,
}
  CheckCircle }
  DollarSign
} from 'lucide-react';
import {
  Button
}
} from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle
}
} from '@/components/ui/card';
import {
  Badge
}
} from '@/components/ui/badge';
import DashboardLayout, {
  DashboardStats, DashboardAction
}
} from './DashboardLayout';

export default function CompanyView() {
  ;
  const [activeTab, setActiveTab] = useState("overview") // Dashboard stats;
  const stats: DashboardStats[] = [{
    ;";
      title: "Active Jobs";
      value: 8;";
      change: "+2 this week";";
      trend: "up"
}
  }";
      icon: <Briefcase className="w-6 h-6" />

  },
    {
  ;";
      title: "Total Applications";
      value: 156;";
      change: "+23 this week";";
      trend: "up";";
      icon: <Users className="w-6 h-6" />

}
  },
    {
  ;";
      title: "Profile Views";
      value: 89;";
      change: "+12 this week";";
      trend: "up";";
      icon: <Eye className="w-6 h-6" />
}
} ];
    {
  ;";
      title: "Hired This Month";
      value: 3;";
      change: "+1 this week";";
      trend: "up";";
      icon: <CheckCircle className="w-6 h-6" />
}
}
  ] // Dashboard actions;
  const actions: DashboardAction[] = [{
  ;
      icon: BarChart3;";
      label: "Analytics";";
      onClick: () => setActiveTab("analytics")
}
  }";
      variant: "outline
} ];
    {
  ;";
      icon: Plus;";";
      label: "Post Job";";
      onClick: () => setActiveTab("post-job");";
      variant: "default
}
}
  ] // Mock data for recent applications;
  const recentApplications = [{
  ;";
      id: 1;";";
      name: "Sarah Johnson";";
      position: "Senior React Developer";";
      status: "shortlisted";";
      appliedDate: "2 hours ago"
}
  }";
      avatar: "/avatars/sarah.jpg

  },
    {
  ;";
      id: 2;";";
      name: "Michael Chen";";
      position: "Full Stack Engineer";";
      status: "reviewed";";
      appliedDate: "4 hours ago";";
      avatar: "/avatars/michael.jpg
}
} ];
    {
  ;";
      id: 3;";";
      name: "Emily Rodriguez";";
      position: "UI/UX Designer";";
      status: "pending";";
      appliedDate: "6 hours ago";";
      avatar: "/avatars/emily.jpg
}
}
  ];

  const getStatusColor = (status: string) => {
  ;
    switch (status) {;
      case 'shortlisted':;
        return 'bg-green-500';
      case 'reviewed':;
        return 'bg-blue-500';
      case 'pending':;
        return 'bg-yellow-500';
}
      default: return 'bg-gray-500'}
}
";
  return ( <DashboardLayout;";";
      title="Company Dashboard;";
      subtitle="Manage your job postings and applications;
      stats={stats}
}
      actions={actions}
}";
      userRole="employer >;
      {
  /* Tab Content */
}";
} <div className="space-y-6">;
        {";
  activeTab === "overview" && ( <motion.div;
}
            initial={{ opacity: 0 }
}
            animate={{ opacity: 1 }
}
            transition={{ delay: 0.5 }
}";
            className="space-y-6 >;
            {
  /* Recent Applications */
}";
} <Card className="bg-white/10 border-white/20"> <CardHeader> <CardTitle className="text-white">Recent Applications</CardTitle> </CardHeader> <CardContent> <div className="space-y-4">;
                  {
  recentApplications.map((application) => ( <div;
}
                      key={application.id}
}";
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 "><div className="flex items-center gap-3"> <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center"> <Users className="w-5 h-5 text-white" /> </div> <div> <h4 className="font-medium text-white">{
  application.name
}";
}</h4> <p className="text-sm text-gray-300">{
  application.position
}";
}</p> <p className="text-xs text-gray-400">{
  application.appliedDate
}";
}</p> </div> </div> <div className="flex items-center gap-2"> <Badge;";
                          variant="secondary;
                          className={
  `${getStatusColor(application.status);
}
  } text-white`} >;
                          {
  application.status
}";
} </Badge> <Button size="sm" variant="outline">;
                          View </Button> </div> </div>)) </div> </CardContent> </Card>;
            {
  /* Quick Actions */
}";
} <Card className="bg-white/10 border-white/20"> <CardHeader> <CardTitle className="text-white">Quick Actions</CardTitle> </CardHeader> <CardContent> <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> <Button;";
                    variant="outline;";
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/20 hover:bg-white/10;
                    onClick={";
  () => setActiveTab("post-job");
}";
  } > <Plus className="w-6 h-6" /> <span>Post New Job</span> </Button> <Button;";
                    variant="outline;";
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/20 hover:bg-white/10;
                    onClick={";
  () => setActiveTab("analytics");
}";
  } > <BarChart3 className="w-6 h-6" /> <span>View Analytics</span> </Button> <Button;";
                    variant="outline;";
                    className="h-20 flex flex-col items-center justify-center gap-2 bg-white/5 border-white/20 hover:bg-white/10 "><Users className="w-6 h-6" /> <span>Manage Team</span> </Button> </div> </CardContent> </Card> </motion.div>);
        {";
  activeTab === "analytics" && ( <motion.div;
}
            initial={{ opacity: 0 }
}
            animate={{ opacity: 1 }
}
            transition={{ delay: 0.5 }";
} > <Card className="bg-white/10 border-white/20"> <CardHeader> <CardTitle className="text-white">Analytics Overview</CardTitle> </CardHeader> <CardContent> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-4"> <h3 className="text-lg font-semibold text-white">Application Trends</h3> <div className="space-y-2"> <div className="flex justify-between text-sm"> <span className="text-gray-300">This Week</span> <span className="text-white">23 applications</span> </div> <div className="flex justify-between text-sm"> <span className="text-gray-300">Last Week</span> <span className="text-white">18 applications</span> </div> <div className="flex justify-between text-sm"> <span className="text-gray-300">Growth</span> <span className="text-green-400">+27.8%</span> </div> </div> </div> <div className="space-y-4"> <h3 className="text-lg font-semibold text-white">Job Performance</h3> <div className="space-y-2"> <div className="flex justify-between text-sm"> <span className="text-gray-300">Most Views</span> <span className="text-white">Senior React Developer</span> </div> <div className="flex justify-between text-sm"> <span className="text-gray-300">Most Applications</span> <span className="text-white">Full Stack Engineer</span> </div> <div className="flex justify-between text-sm"> <span className="text-gray-300">Best Conversion</span> <span className="text-white">UI/UX Designer</span> </div> </div> </div> </div> </CardContent> </Card> </motion.div>);
        {";
  activeTab === "post-job" && ( <motion.div;
}
            initial={{ opacity: 0 }
}
            animate={{ opacity: 1 }
}
            transition={{ delay: 0.5 }";
} > <Card className="bg-white/10 border-white/20"> <CardHeader> <CardTitle className="text-white">Post New Job</CardTitle> </CardHeader> <CardContent> <p className="text-gray-300 mb-4">;";
                  Create a new job posting to attract top talent to your company. </p> <Button className="w-full"> <Plus className="w-4 h-4 mr-2" />;";
                  Create Job Posting </Button> </CardContent> </Card> </motion.div>) </div> </DashboardLayout>);