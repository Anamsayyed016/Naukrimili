import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatItem {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  gradient: string}

interface DashboardStatsProps {
  stats: StatItem[]}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${stat.gradient} p-4`}>
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                {stat.change && (
                  <p className="text-sm mt-1">
                    <span className="text-green-100">{stat.change}</span> this week
                  </p>
                )}
              </div>
              <stat.icon className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>)} 