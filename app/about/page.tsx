import Link from 'next/link';
import { Users, Target, Award, Globe, Briefcase, UserCheck, Building2, CheckCircle, Mail, TrendingUp, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About NaukriMili</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Your trusted job search and recruitment partner connecting talented professionals 
            with leading employers across India, UAE, USA, UK, and Saudi Arabia.
          </p>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-6 sm:p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                Welcome to NaukriMili.com
              </h2>
              <div className="space-y-4 text-gray-700 text-base md:text-lg leading-relaxed">
                <p>
                  We are a professional job portal and recruitment service connecting talented job seekers with leading employers across <strong>India, the UAE, the USA, the UK, and Saudi Arabia</strong>. Our goal is simple — to make hiring and job searching <strong>faster, easier, and smarter</strong> through technology.
                </p>
                <p>
                  With over <strong>18 years of experience in recruitment</strong> under our placement brand, we understand how to bridge the gap between opportunity and talent. NaukriMili.com brings that expertise online, providing a seamless platform for both employers and job seekers to connect directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* For Job Seekers & Employers Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* For Job Seekers */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Job Seekers</h3>
                </div>
                <p className="text-gray-700 mb-6 text-lg">
                  We help you find the right job that matches your skills, goals, and experience.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Create your profile and upload your resume</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Apply directly to verified jobs posted by employers</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Get updates and alerts for new openings</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">AI-based system helps match you with the best opportunities — saving your time and effort</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Employers */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">For Employers</h3>
                </div>
                <p className="text-gray-700 mb-6 text-lg">
                  We make hiring simple.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Create a company profile</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Post job openings in minutes</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Review applications, shortlist candidates, and schedule interviews easily</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Professional recruitment support through our expert placement team, ensuring quality candidates for every requirement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Mission */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center">
                    <Target className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To empower job seekers and employers by providing a reliable, transparent, and user-friendly recruitment platform that connects the right people with the right opportunities.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become one of the most trusted global job portals, helping millions of people find meaningful employment and helping businesses grow with the right talent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose NaukriMili.com?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">18+ Years Experience</h3>
              <p className="text-gray-600">Proven recruitment expertise</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Employers</h3>
              <p className="text-gray-600">Genuine job postings only</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">Smart job recommendations</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dedicated Support</h3>
              <p className="text-gray-600">For job seekers & companies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Reach Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Global Reach</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting talent across multiple countries and industries
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-lg font-semibold text-gray-900">🇮🇳 India</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-lg font-semibold text-gray-900">🇦🇪 UAE</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-lg font-semibold text-gray-900">🇺🇸 USA</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-lg font-semibold text-gray-900">🇬🇧 UK</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-full shadow-md border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <span className="text-lg font-semibold text-gray-900">🇸🇦 Saudi Arabia</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Let&apos;s Build Careers Together</h2>
          <p className="text-xl text-blue-100 mb-8">
            Whether you&apos;re looking for your next job or hiring your next team member — NaukriMili.com is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/jobs"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all inline-flex items-center gap-2"
            >
              <Briefcase className="h-5 w-5" />
              Explore Jobs
            </Link>
            <Link
              href="/auth/register"
              className="bg-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-600 transition-all inline-flex items-center gap-2"
            >
              <UserCheck className="h-5 w-5" />
              Get Started
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-blue-100">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <a href="mailto:support@naukrimili.com" className="hover:text-white transition-colors">
                support@naukrimili.com
              </a>
            </div>
            <span className="hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <a href="https://www.naukrimili.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                www.naukrimili.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
