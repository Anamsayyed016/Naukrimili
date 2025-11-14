'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResumeBuilderPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
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

        {/* Main Content */}
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Resume Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 text-lg">
              Build your professional resume with our easy-to-use resume builder.
            </p>
            <p className="text-gray-500">
              Create, customize, and download your resume in multiple formats.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

