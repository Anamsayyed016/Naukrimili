"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import RegisterForm from "@/components/auth/RegisterForm";

type UserType = "jobseeker" | "company" | null;

export default function RegisterPage() {
  const [userType, setUserType] = useState<UserType>(null);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  if (userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md bg-white dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8"
        >
          <button 
            onClick={() => setUserType(null)} 
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            &larr; Back to selection
          </button>
          <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
            Register as a {userType === "jobseeker" ? "Job Seeker" : "Company"}
          </h2>
          <RegisterForm type={userType} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 inline-block"
        >
          <h1 className="text-4xl font-extrabold text-gray-900">Join Our Platform</h1>
          <p className="text-lg text-gray-600 mt-2">Choose your path and let's get started.</p>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <div
            className="p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg cursor-pointer h-full flex flex-col items-center text-center border-2 border-transparent hover:border-blue-500 transition-all"
            onClick={() => setUserType("jobseeker")}
          >
            <User className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">I am a Job Seeker</h2>
            <p className="text-gray-600 mb-6">Find your next career opportunity. Browse jobs, create a profile, and get hired.</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-auto">Sign up as a Job Seeker</Button>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <div
            className="p-8 bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg cursor-pointer h-full flex flex-col items-center text-center border-2 border-transparent hover:border-purple-500 transition-all"
            onClick={() => setUserType("company")}
          >
            <Building className="w-16 h-16 text-purple-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">I am an Employer</h2>
            <p className="text-gray-600 mb-6">Post jobs, find talent, and grow your team with our powerful hiring tools.</p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-auto">Sign up as a Company</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
