"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle,
  Briefcase,
  Building2,
  User,
  Upload,
  Brain,
  Shield,
  Zap
} from "lucide-react";
import Link from "next/link";
import HeroSection from "@/components/home/HeroSection";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const features = [
    {
      title: "AI-Powered Matching",
      description: "Get job recommendations tailored to your skills, experience, and preferences using advanced AI algorithms.",
      icon: Brain,
      gradient: "from-white to-blue-50/30",
      iconColor: "text-indigo-600"
    },
    {
      title: "Verified Companies",
      description: "Browse jobs from top-rated, verified employers. All companies are screened for authenticity and quality.",
      icon: Shield,
      gradient: "from-white to-emerald-50/30",
      iconColor: "text-emerald-600"
    },
    {
      title: "Smart Job Search",
      description: "Find your dream job faster with our intelligent search and filtering system.",
      icon: Zap,
      gradient: "from-white to-violet-50/30",
      iconColor: "text-violet-600"
    }
  ];

  return (
    <main>
      <HeroSection />

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="py-16 bg-gradient-to-br from-slate-50 to-gray-100"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`shadow-lg border-0 bg-gradient-to-br ${feature.gradient} hover:shadow-xl transition-all duration-300`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                      <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
} 