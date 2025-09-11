"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Palette, 
  Type, 
  Camera, 
  Upload,
  Lightbulb,
  Target,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldKeywordManager, FieldKeywords, KeywordSuggestion } from '@/lib/field-keywords';
import { ResumeTemplateManager, ResumeTemplate } from '@/lib/resume-templates';
import { UnifiedResumeData, ResumeDataFactory } from '@/types/unified-resume';

interface ModernResumeWizardProps {
  onComplete: (resumeData: UnifiedResumeData, template: string, customization: any) => void;
  onClose: () => void;
}

const STEPS = [
  { id: 'field', title: 'Choose Field', icon: Target },
  { id: 'template', title: 'Select Template', icon: FileText },
  { id: 'customize', title: 'Customize', icon: Palette },
  { id: 'preview', title: 'Preview', icon: Eye },
  { id: 'complete', title: 'Complete', icon: Check }
];

export default function ModernResumeWizard({ onComplete, onClose }: ModernResumeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customization, setCustomization] = useState({
    colorScheme: 'blue',
    fontFamily: 'sans',
    showProfilePhoto: false,
    spacing: 'standard'
  });
  const [resumeData, setResumeData] = useState<UnifiedResumeData>(ResumeDataFactory.createEmpty());
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableFields = FieldKeywordManager.getAllFields();
  const templates = ResumeTemplateManager.getAllTemplates();

  // Get keyword suggestions when field is selected
  useEffect(() => {
    if (selectedField) {
      const suggestions = FieldKeywordManager.getAISuggestions(
        selectedField, 
        resumeData.personalInfo.summary || '',
        selectedKeywords
      );
      setKeywordSuggestions(suggestions);
    }
  }, [selectedField, resumeData.personalInfo.summary, selectedKeywords]);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldSelect = (field: string) => {
    setSelectedField(field);
    // Auto-advance to next step after field selection
    setTimeout(() => {
      nextStep();
    }, 500);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Auto-advance to next step after template selection
    setTimeout(() => {
      nextStep();
    }, 500);
  };

  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedField !== '';
      case 1: return selectedTemplate !== '';
      case 2: return true; // Customization step always allows proceeding
      case 3: return true; // Preview step always allows proceeding
      default: return false;
    }
  };

  const handleComplete = () => {
    setIsLoading(true);
    // Apply selected keywords to resume data
    const updatedResumeData = {
      ...resumeData,
      skills: [
        ...resumeData.skills,
        ...selectedKeywords.map(keyword => ({
          id: Date.now().toString() + Math.random(),
          name: keyword,
          level: 'intermediate' as const
        }))
      ]
    };
    
    onComplete(updatedResumeData, selectedTemplate, customization);
    setIsLoading(false);
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'field':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  What field is this resume for?
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  We'll suggest ATS-optimized keywords and industry-specific templates for your field
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableFields.map((field, index) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-300 group ${
                      selectedField === field 
                        ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                        : 'hover:shadow-xl hover:ring-2 hover:ring-blue-200'
                    }`}
                    onClick={() => handleFieldSelect(field)}
                  >
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedField === field 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          <Target className="w-6 h-6" />
                        </div>
                        {selectedField === field && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900">{field}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {FieldKeywordManager.getKeywordsForField(field)?.category}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {FieldKeywordManager.getKeywordsForField(field)?.keywords.technical.slice(0, 3).map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Choose a Template
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Select a professional template that matches your style and industry
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-300 group ${
                      selectedTemplate === template.id 
                        ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                        : 'hover:shadow-xl hover:ring-2 hover:ring-blue-200'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-6">
                      {/* Template Preview */}
                      <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-6 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-bold text-lg text-gray-800 mb-2">{template.name}</h4>
                          <div className="space-y-1">
                            <div className="h-2 bg-gray-300 rounded w-20 mx-auto"></div>
                            <div className="h-2 bg-gray-300 rounded w-16 mx-auto"></div>
                            <div className="h-2 bg-gray-300 rounded w-24 mx-auto"></div>
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-xl text-gray-900">{template.name}</h3>
                          {template.isPopular && (
                            <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                              Popular
                            </Badge>
                          )}
                          {template.isNew && (
                            <Badge className="bg-gradient-to-r from-green-400 to-blue-400 text-white">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {template.features.slice(0, 3).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs bg-white/50">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{template.layout.sections}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{template.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'customize':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Customize Your Resume
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Choose colors, fonts, and add your photo to make it uniquely yours
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Color Scheme */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Palette className="w-5 h-5 text-white" />
                      </div>
                      Color Scheme
                    </CardTitle>
                    <p className="text-gray-600">Choose a color that represents your professional style</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {['blue', 'green', 'purple', 'gray', 'red', 'orange', 'teal', 'pink'].map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative w-16 h-16 rounded-2xl border-3 transition-all duration-200 ${
                            customization.colorScheme === color 
                              ? 'border-blue-500 shadow-lg scale-105' 
                              : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                          }`}
                          style={{ backgroundColor: getColorValue(color) }}
                          onClick={() => setCustomization(prev => ({ ...prev, colorScheme: color }))}
                        >
                          {customization.colorScheme === color && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                        </motion.button>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Selected:</strong> {customization.colorScheme.charAt(0).toUpperCase() + customization.colorScheme.slice(1)} theme
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Font Family */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      Font Family
                    </CardTitle>
                    <p className="text-gray-600">Choose a font that matches your professional style</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { value: 'sans', label: 'Sans Serif', desc: 'Modern & Clean', style: 'font-sans' },
                        { value: 'serif', label: 'Serif', desc: 'Traditional & Professional', style: 'font-serif' },
                        { value: 'mono', label: 'Monospace', desc: 'Technical & Precise', style: 'font-mono' }
                      ].map((font) => (
                        <motion.button
                          key={font.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                            customization.fontFamily === font.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          onClick={() => setCustomization(prev => ({ ...prev, fontFamily: font.value }))}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className={`font-semibold text-lg ${font.style}`}>{font.label}</h4>
                              <p className="text-sm text-gray-600">{font.desc}</p>
                            </div>
                            {customization.fontFamily === font.value && (
                              <Check className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Photo Option */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      Profile Photo
                    </CardTitle>
                    <p className="text-gray-600">Add a professional photo to your resume</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <Checkbox
                        id="showPhoto"
                        checked={customization.showProfilePhoto}
                        onCheckedChange={(checked) => 
                          setCustomization(prev => ({ ...prev, showProfilePhoto: !!checked }))
                        }
                        className="w-5 h-5"
                      />
                      <Label htmlFor="showPhoto" className="text-lg font-medium cursor-pointer">
                        Include profile photo
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {customization.showProfilePhoto 
                        ? 'Your resume will include a space for your professional photo'
                        : 'Your resume will be text-only without a photo section'
                      }
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AI Keyword Suggestions */}
              {selectedField && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="lg:col-span-2"
                >
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        AI-Powered Keyword Suggestions
                      </CardTitle>
                      <p className="text-gray-600">
                        Select keywords that match your experience for better ATS optimization
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-3">
                          {keywordSuggestions.slice(0, 15).map((suggestion) => (
                            <motion.button
                              key={suggestion.keyword}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                selectedKeywords.includes(suggestion.keyword)
                                  ? 'bg-blue-500 text-white shadow-lg'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                              onClick={() => handleKeywordSelect(suggestion.keyword)}
                            >
                              {suggestion.keyword}
                            </motion.button>
                          ))}
                        </div>
                        {selectedKeywords.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-white rounded-xl border border-blue-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Check className="w-5 h-5 text-green-500" />
                              <span className="font-semibold text-green-700">Selected Keywords:</span>
                            </div>
                            <p className="text-gray-700">{selectedKeywords.join(', ')}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              These keywords will be automatically added to your skills section
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  Preview Your Resume
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Review your resume configuration and see how it will look
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      Resume Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Field</p>
                        <p className="font-semibold">{selectedField}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Template</p>
                        <p className="font-semibold">{templates.find(t => t.id === selectedTemplate)?.name}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Color</p>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: getColorValue(customization.colorScheme) }}
                          ></div>
                          <p className="font-semibold capitalize">{customization.colorScheme}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Font</p>
                        <p className="font-semibold capitalize">{customization.fontFamily}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Profile Photo</p>
                      <p className="font-semibold">{customization.showProfilePhoto ? 'Included' : 'Not included'}</p>
                    </div>
                    {selectedKeywords.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium mb-2">Selected Keywords ({selectedKeywords.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedKeywords.slice(0, 6).map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {selectedKeywords.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedKeywords.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      Live Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[3/4] bg-white rounded-xl border-2 border-gray-200 overflow-hidden relative">
                      <div className="absolute inset-0 p-6">
                        <div className="h-full flex flex-col">
                          {/* Header */}
                          <div className="text-center border-b pb-4 mb-4">
                            <div className={`w-16 h-16 bg-gradient-to-br from-${customization.colorScheme}-500 to-${customization.colorScheme}-600 rounded-full mx-auto mb-3`}></div>
                            <h1 className={`text-2xl font-bold text-gray-900 ${customization.fontFamily === 'serif' ? 'font-serif' : customization.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`}>
                              John Doe
                            </h1>
                            <p className="text-gray-600">Software Developer</p>
                            <p className="text-sm text-gray-500">john@example.com • (555) 123-4567</p>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 space-y-4">
                            <div>
                              <h2 className={`text-lg font-semibold text-${customization.colorScheme}-600 mb-2`}>Summary</h2>
                              <p className="text-sm text-gray-700">Experienced software developer with expertise in modern technologies...</p>
                            </div>
                            
                            <div>
                              <h2 className={`text-lg font-semibold text-${customization.colorScheme}-600 mb-2`}>Skills</h2>
                              <div className="flex flex-wrap gap-1">
                                {selectedKeywords.slice(0, 4).map((keyword) => (
                                  <span key={keyword} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {keyword}
                                  </span>
                                ))}
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">...</span>
                              </div>
                            </div>
                            
                            <div>
                              <h2 className={`text-lg font-semibold text-${customization.colorScheme}-600 mb-2`}>Experience</h2>
                              <div className="space-y-2">
                                <div>
                                  <h3 className="font-medium text-sm">Senior Developer</h3>
                                  <p className="text-xs text-gray-600">Tech Company • 2020-2023</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-4">
                      This is a preview of how your resume will look
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Resume Created Successfully!
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your professional resume has been generated with AI-optimized keywords and is ready for customization
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">What's Next?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Review & Edit</h4>
                    <p className="text-sm text-gray-600">Customize your resume details and content</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Add Experience</h4>
                    <p className="text-sm text-gray-600">Include your work history and achievements</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Download</h4>
                    <p className="text-sm text-gray-600">Export as PDF or DOCX format</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Apply to Jobs</h4>
                    <p className="text-sm text-gray-600">Start applying with confidence!</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-4 justify-center"
            >
              <Button 
                onClick={handleComplete} 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg"
              >
                {isLoading ? 'Creating...' : 'Start Editing Resume'}
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="px-8 py-3 text-lg"
              >
                Close
              </Button>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/60 to-purple-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Your Resume</h1>
              <p className="text-gray-600">Step {currentStep + 1} of {STEPS.length}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={(currentStep + 1) / STEPS.length * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className={index <= currentStep ? 'text-blue-600' : 'text-gray-400'}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-gray-100 p-6 flex justify-between items-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0}
              className="px-6 py-2 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {STEPS.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {currentStep < STEPS.length - 1 ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-2 font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleComplete} 
                disabled={isLoading}
                className="px-8 py-2 font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Helper function to get color values
function getColorValue(color: string): string {
  const colors: Record<string, string> = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    gray: '#6B7280',
    red: '#EF4444',
    orange: '#F59E0B',
    teal: '#14B8A6',
    pink: '#EC4899'
  };
  return colors[color] || '#3B82F6';
}
