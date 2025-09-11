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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What field is this resume for?</h2>
              <p className="text-gray-600">We'll suggest ATS-optimized keywords for your industry</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableFields.map((field) => (
                <motion.div
                  key={field}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedField === field 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleFieldSelect(field)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{field}</h3>
                          <p className="text-sm text-gray-600">
                            {FieldKeywordManager.getKeywordsForField(field)?.category}
                          </p>
                        </div>
                        {selectedField === field && (
                          <Check className="w-6 h-6 text-blue-500" />
                        )}
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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose a Template</h2>
              <p className="text-gray-600">Select a professional template that matches your style</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedTemplate === template.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.isPopular && (
                            <Badge variant="secondary">Popular</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.features.slice(0, 2).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
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

      case 'customize':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Resume</h2>
              <p className="text-gray-600">Choose colors, fonts, and add your photo</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Color Scheme */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    {['blue', 'green', 'purple', 'gray', 'red', 'orange', 'teal', 'pink'].map((color) => (
                      <button
                        key={color}
                        className={`w-12 h-12 rounded-full border-2 ${
                          customization.colorScheme === color 
                            ? 'border-gray-900' 
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: getColorValue(color) }}
                        onClick={() => setCustomization(prev => ({ ...prev, colorScheme: color }))}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Font Family */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Font Family
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={customization.fontFamily} 
                    onValueChange={(value) => setCustomization(prev => ({ ...prev, fontFamily: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif (Modern)</SelectItem>
                      <SelectItem value="serif">Serif (Traditional)</SelectItem>
                      <SelectItem value="mono">Monospace (Technical)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Photo Option */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profile Photo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPhoto"
                      checked={customization.showProfilePhoto}
                      onCheckedChange={(checked) => 
                        setCustomization(prev => ({ ...prev, showProfilePhoto: !!checked }))
                      }
                    />
                    <Label htmlFor="showPhoto">Include profile photo</Label>
                  </div>
                </CardContent>
              </Card>

              {/* AI Keyword Suggestions */}
              {selectedField && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      AI-Powered Keyword Suggestions
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Select keywords that match your experience for better ATS optimization
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {keywordSuggestions.slice(0, 12).map((suggestion) => (
                          <Badge
                            key={suggestion.keyword}
                            variant={selectedKeywords.includes(suggestion.keyword) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-blue-100"
                            onClick={() => handleKeywordSelect(suggestion.keyword)}
                          >
                            {suggestion.keyword}
                          </Badge>
                        ))}
                      </div>
                      {selectedKeywords.length > 0 && (
                        <Alert>
                          <AlertDescription>
                            <strong>Selected keywords:</strong> {selectedKeywords.join(', ')}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Preview Your Resume</h2>
              <p className="text-gray-600">Review your resume before finalizing</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resume Details</h3>
                <div className="space-y-2">
                  <p><strong>Field:</strong> {selectedField}</p>
                  <p><strong>Template:</strong> {templates.find(t => t.id === selectedTemplate)?.name}</p>
                  <p><strong>Color:</strong> {customization.colorScheme}</p>
                  <p><strong>Font:</strong> {customization.fontFamily}</p>
                  <p><strong>Photo:</strong> {customization.showProfilePhoto ? 'Yes' : 'No'}</p>
                  <p><strong>Keywords:</strong> {selectedKeywords.length} selected</p>
                </div>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="aspect-[3/4] bg-white rounded border flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-2" />
                    <p>Resume Preview</p>
                    <p className="text-sm">Template: {templates.find(t => t.id === selectedTemplate)?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Resume Created Successfully!</h2>
            <p className="text-gray-600">
              Your professional resume is ready. You can now edit, customize, and download it.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Start Editing'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
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
        <div className="border-t p-6 flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Complete'}
            </Button>
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
