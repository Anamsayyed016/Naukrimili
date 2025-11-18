'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResumeSamplesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/jobseeker">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Samples</h1>
            <p className="text-gray-600">Browse professional resume templates</p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <FileText className="h-10 w-10 text-purple-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Resume Samples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-lg">
              Explore our collection of professional resume templates.
            </p>
            <p className="text-gray-500">
              Get inspired by sample resumes for different industries and roles.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

