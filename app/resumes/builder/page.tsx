"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Construction } from "lucide-react";
import Link from "next/link";

export default function ResumeBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/role-selection">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
            <p className="text-gray-600">Create your professional resume</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Construction className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Resume Builder Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-lg">
              We're working on an amazing resume builder experience for you!
            </p>
            <p className="text-gray-500">
              In the meantime, you can upload your existing resume or browse available jobs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/resumes/upload">
                <Button className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Upload Resume
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline" className="flex items-center gap-2">
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
