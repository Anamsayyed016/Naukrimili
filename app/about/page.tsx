import Link from 'next/link';
import { Users, Target, Award, Globe, Briefcase, UserCheck, Building2, CheckCircle, Mail, TrendingUp, Shield, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            At NaukriMili.com, we believe that the right opportunity can change a life, and the right talent can transform a business.
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
                  I am <strong>Shoeb Jaffrey</strong>, Founder and Director of NaukriMili.com. My journey in recruitment began more than 20 years ago with Naukri Mili Placement, a recruitment consultancy based in Bhopal. Over the years, we have successfully connected thousands of talented professionals with leading organizations across various industries, gaining deep insight into the challenges faced by both employers and job seekers.
                </p>
                <p>
                  With the rapid growth of digital hiring, we recognized the need for a smarter, more accessible platform that would help candidates and employers connect directly. This vision led to the creation of NaukriMili.com.
                </p>
                <p>
                  Our experience in recruitment revealed a common challenge among job seekers: many talented professionals struggle to create professional resumes that effectively showcase their skills and experience. To address this gap, we developed an easy-to-use Resume Builder within our job portal, enabling candidates to create industry-standard resumes and improve their chances of securing the right opportunities.
                </p>
                <p>
                  Today, NaukriMili.com is more than just a job portal. We are a complete career and recruitment platform dedicated to simplifying the hiring process through technology, innovation, and industry expertise.
                </p>
                <p>
                  We proudly connect talented job seekers with leading employers across <strong>India, the UAE, Saudi Arabia, the United Kingdom, and the United States</strong>. Whether you are a fresher starting your career journey, an experienced professional seeking new opportunities, or an employer looking for exceptional talent, NaukriMili.com is designed to support your success.
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
                  Whether you are a fresher starting your career journey or an experienced professional seeking new opportunities, NaukriMili.com is designed to support your success.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Online Job Portal</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Professional Resume Builder</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Domestic and International Job Opportunities</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Recruitment and Placement Services</p>
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
                  For employers looking for exceptional talent, we provide innovative hiring solutions backed by decades of recruitment expertise.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Employer Hiring Solutions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Candidate Screening and Talent Acquisition</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Recruitment and Placement Services</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">Domestic and International Job Opportunities</p>
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
                  To make hiring and job searching faster, easier, and smarter by providing innovative recruitment solutions that create meaningful connections between employers and candidates.
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
                  To become a trusted global platform that empowers careers, supports businesses, and creates opportunities without borders.
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
            What We Offer
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">20+ Years Experience</h3>
              <p className="text-gray-600">Proven recruitment expertise since Naukri Mili Placement</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Resume Builder</h3>
              <p className="text-gray-600">Industry-standard resumes for better opportunities</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Global Opportunities</h3>
              <p className="text-gray-600">Domestic and international job connections</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Career Platform</h3>
              <p className="text-gray-600">Technology, innovation, and industry expertise</p>
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
              Connecting talented job seekers with leading employers across India, the UAE, Saudi Arabia, the United Kingdom, and the United States
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Career. Your Opportunity. Your Future.</h2>
          <p className="text-xl text-blue-100 mb-8">
            At NaukriMili.com, we are committed to helping people build successful careers and helping organizations find the talent they need to grow. Every connection we create brings us one step closer to our goal of transforming the recruitment experience for everyone. Welcome to NaukriMili.com.
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
