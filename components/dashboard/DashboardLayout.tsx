'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Settings, 
  Bell, 
  User,
  Briefcase,
  Building,
  Shield,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';

export interface DashboardStats {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export interface DashboardAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

export interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  stats?: DashboardStats[];
  actions?: DashboardAction[];
  children: ReactNode;
  userRole?: 'jobseeker' | 'employer' | 'admin';
  className?: string;
}

export default function DashboardLayout({
  title,
  subtitle,
  stats = [],
  actions = [],
  children,
  userRole = 'jobseeker',
  className = ''
}: DashboardLayoutProps) {
  const { user } = useAuth();

  const getRoleIcon = () => {
    switch (userRole) {
      case 'jobseeker':
        return <Briefcase className="w-5 h-5" />;
      case 'employer':
        return <Building className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'jobseeker':
        return 'bg-blue-500';
      case 'employer':
        return 'bg-green-500';
      case 'admin':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8 ${className}`}>
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${getRoleColor()} text-white`}>
                {getRoleIcon()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                {subtitle && (
                  <p className="text-gray-300 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {userRole}
                </Badge>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">Welcome back, {user.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={action.onClick}
                  variant={action.variant || 'default'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              </motion.div>
            ))}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Stats */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    {stat.change && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs ${
                          stat.trend === 'up' ? 'text-green-400' : 
                          stat.trend === 'down' ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    )}
                  </div>
                  {stat.icon && (
                    <div className="text-white/60">
                      {stat.icon}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 