"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Edit } from "lucide-react";

export default function JobSeekerProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch user from localStorage (mock backend)
    const token = localStorage.getItem("mock_token");
    if (token) {
      const decoded = JSON.parse(atob(token));
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const user = users.find((u: any) => u.email === decoded.email);
      setProfile(user);
    }
  }, []);

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <Card className="max-w-xl w-full mx-4 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-500" />
              Profile Not Found
            </CardTitle>
            <p className="text-gray-600 mt-2">Please log in to view your profile.</p>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Card className="max-w-2xl w-full mx-4 bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <User className="w-8 h-8 text-purple-500" />
              {profile.name || "No Name"}
            </CardTitle>
            <p className="text-gray-600 mt-2">Job Seeker Profile</p>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "/profile-setup"}>
            <Edit className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-purple-400" /> {profile.email}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-purple-400" /> {profile.phone || "-"}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-purple-400" /> {profile.location || "-"}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" /> Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                profile.skills.map((skill: string, idx: number) => (
                  <Badge key={idx} className="bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 border-0 px-3 py-1">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No skills listed.</span>
              )}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" /> Experience
            </h3>
            <div className="space-y-2">
              {profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0 ? (
                profile.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {typeof exp === "string" ? exp : JSON.stringify(exp)}
                  </div>
                ))
              ) : (
                <span className="text-gray-400">No experience listed.</span>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-cyan-500" /> Education
            </h3>
            <div className="space-y-2">
              {profile.education && Array.isArray(profile.education) && profile.education.length > 0 ? (
                profile.education.map((edu: any, idx: number) => (
                  <div key={idx} className="p-3 bg-cyan-50 rounded-lg text-gray-700">
                    {typeof edu === "string" ? edu : JSON.stringify(edu)}
                  </div>
                ))
              ) : (
                <span className="text-gray-400">No education listed.</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 