"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import ResumeUploadFlow from "@/components/ResumeUploadFlow";

export default function ProfileSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Complete Your Profile</h1>
          <p className="text-xl text-gray-300">Let's get your profile set up for better job matches</p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 p-8">
            <ResumeUploadFlow />
          </Card>
        </div>
      </div>
    </div>
  );
}
