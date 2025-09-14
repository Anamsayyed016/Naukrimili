"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Eye, 
  ArrowRight, 
  Check,
  Sparkles,
  FileText,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'creative' | 'minimal';
  difficulty: 'easy' | 'medium' | 'hard';
  features: string[];
  preview: string;
  colorSchemes: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

const templates: Template[] = [
  {
    id: 'modern-blue',
    name: 'Modern Professional',
    description: 'Clean and contemporary design perfect for tech and business roles',
    category: 'modern',
    difficulty: 'easy',
    features: ['ATS Optimized', 'Clean Layout', 'Professional Colors', 'Easy Customization'],
    preview: '/api/resumes/templates/modern-blue/preview',
    colorSchemes: ['blue', 'green', 'purple', 'gray'],
    isPopular: true
  },
  {
    id: 'classic-formal',
    name: 'Classic Formal',
    description: 'Traditional layout ideal for corporate and academic positions',
    category: 'classic',
    difficulty: 'easy',
    features: ['Traditional Layout', 'Formal Typography', 'Conservative Design', 'Wide Compatibility'],
    preview: '/api/resumes/templates/classic-formal/preview',
    colorSchemes: ['black', 'navy', 'gray', 'brown']
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    description: 'Eye-catching design for creative professionals and designers',
    category: 'creative',
    difficulty: 'medium',
    features: ['Visual Appeal', 'Creative Layout', 'Color Accents', 'Portfolio Ready'],
    preview: '/api/resumes/templates/creative-portfolio/preview',
    colorSchemes: ['purple', 'orange', 'teal', 'pink'],
    isNew: true
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple and focused design that puts content first',
    category: 'minimal',
    difficulty: 'easy',
    features: ['Minimal Design', 'Content Focused', 'Fast Loading', 'Mobile Friendly'],
    preview: '/api/resumes/templates/minimal-clean/preview',
    colorSchemes: ['gray', 'black', 'blue', 'green']
  },
  {
    id: 'executive-premium',
    name: 'Executive Premium',
    description: 'Sophisticated design for senior-level professionals',
    category: 'classic',
    difficulty: 'hard',
    features: ['Executive Style', 'Premium Layout', 'Advanced Customization', 'Print Ready'],
    preview: '/api/resumes/templates/executive-premium/preview',
    colorSchemes: ['navy', 'charcoal', 'burgundy', 'gold']
  },
  {
    id: 'tech-focused',
    name: 'Tech Focused',
    description: 'Modern design optimized for technology and engineering roles',
    category: 'modern',
    difficulty: 'medium',
    features: ['Tech Optimized', 'Skill Highlighting', 'Project Showcase', 'Code Friendly'],
    preview: '/api/resumes/templates/tech-focused/preview',
    colorSchemes: ['blue', 'green', 'purple', 'orange']
  }
];

const categories = [
  { id: 'all', name: 'All Templates', icon: Palette },
  { id: 'modern', name: 'Modern', icon: Sparkles },
  { id: 'classic', name: 'Classic', icon: FileText },
  { id: 'creative', name: 'Creative', icon: Briefcase },
  { id: 'minimal', name: 'Minimal', icon: GraduationCap }
];

export default function ResumeTemplatesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate && user) {
      router.push(`/resumes/builder?template=${selectedTemplate}`);
    } else if (!user) {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Resume Template
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select from our professionally designed templates. All templates are ATS-friendly and optimized for your industry.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-blue-500 shadow-lg' 
                    : 'hover:scale-105'
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.isPopular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        {template.isNew && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            New
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Template Preview Placeholder */}
                  <div className="bg-gray-100 rounded-lg h-32 mb-4 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Template Preview</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Color Schemes */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Color Schemes:</p>
                    <div className="flex gap-2">
                      {template.colorSchemes.map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full border-2 border-white shadow-sm ${
                            color === 'blue' ? 'bg-blue-500' :
                            color === 'green' ? 'bg-green-500' :
                            color === 'purple' ? 'bg-purple-500' :
                            color === 'gray' ? 'bg-gray-500' :
                            color === 'black' ? 'bg-black' :
                            color === 'navy' ? 'bg-blue-800' :
                            color === 'brown' ? 'bg-amber-700' :
                            color === 'orange' ? 'bg-orange-500' :
                            color === 'teal' ? 'bg-teal-500' :
                            color === 'pink' ? 'bg-pink-500' :
                            color === 'charcoal' ? 'bg-gray-800' :
                            color === 'burgundy' ? 'bg-red-800' :
                            color === 'gold' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={
                        template.difficulty === 'easy' ? 'default' :
                        template.difficulty === 'medium' ? 'secondary' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {template.difficulty === 'easy' ? 'Easy' :
                       template.difficulty === 'medium' ? 'Medium' : 'Advanced'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          {selectedTemplate ? (
            <div className="space-y-4">
              <Button 
                onClick={handleUseTemplate}
                size="lg"
                className="px-8"
              >
                Use This Template
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-gray-600">
                You'll be redirected to the resume builder with this template pre-selected
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a template to get started</p>
            </div>
          )}
        </div>

        {/* Template Tips */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Template Selection Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Industry Considerations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Creative fields: Choose colorful, unique designs</li>
                    <li>• Corporate roles: Stick to classic, formal templates</li>
                    <li>• Tech positions: Modern, clean layouts work best</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Experience Level</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Entry-level: Simple, clean templates</li>
                    <li>• Mid-career: Professional, modern designs</li>
                    <li>• Executive: Sophisticated, premium layouts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">ATS Optimization</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• All templates are ATS-friendly</li>
                    <li>• Clean formatting ensures parsing</li>
                    <li>• Standard fonts and layouts</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
