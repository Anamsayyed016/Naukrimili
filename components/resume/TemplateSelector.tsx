"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye, Palette, Columns, Camera } from 'lucide-react';
import { ResumeTemplateManager, TemplateCustomization } from '@/lib/resume-templates';

interface TemplateSelectorProps {
  selectedTemplate: string;
  customization: TemplateCustomization;
  onTemplateSelect: (templateId: string) => void;
  onCustomizationChange: (customization: TemplateCustomization) => void;
  onPreview: (templateId: string) => void;
}

const colorOptions = [
  { name: 'White', value: 'white', color: 'bg-white border-2 border-gray-300' },
  { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
  { name: 'Green', value: 'green', color: 'bg-green-500' },
  { name: 'Teal', value: 'teal', color: 'bg-teal-500' },
  { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', color: 'bg-orange-500' },
  { name: 'Red', value: 'red', color: 'bg-red-500' },
  { name: 'Gray', value: 'gray', color: 'bg-gray-500' },
];

const layoutOptions = [
  { name: 'One Column', value: 'single', icon: Columns },
  { name: 'Two Column', value: 'two', icon: Columns },
  { name: 'With Photo', value: 'photo', icon: Camera },
];

export default function TemplateSelector({
  selectedTemplate,
  customization,
  onTemplateSelect,
  onCustomizationChange,
  onPreview
}: TemplateSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(customization.colorScheme);
  const [selectedLayout, setSelectedLayout] = useState('two');
  const [showPhoto, setShowPhoto] = useState(customization.showProfilePhoto);

  const templates = ResumeTemplateManager.getAllTemplates();

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onCustomizationChange({
      ...customization,
      colorScheme: color as any
    });
  };

  const handleLayoutSelect = (layout: string) => {
    setSelectedLayout(layout);
  };

  const handlePhotoToggle = () => {
    const newShowPhoto = !showPhoto;
    setShowPhoto(newShowPhoto);
    onCustomizationChange({
      ...customization,
      showProfilePhoto: newShowPhoto
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Templates we recommend for you
        </h2>
        <p className="text-gray-600">
          You can always change your template later.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="bg-white border-2 border-gray-200 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            {/* Filter by */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              
              {/* Headshot Filter */}
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500" />
                <select 
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  value={showPhoto ? 'with' : 'without'}
                  onChange={(e) => handlePhotoToggle()}
                >
                  <option value="with">With Headshot</option>
                  <option value="without">Without Headshot</option>
                </select>
              </div>

              {/* Layout Filter */}
              <div className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-gray-500" />
                <select 
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  value={selectedLayout}
                  onChange={(e) => handleLayoutSelect(e.target.value)}
                >
                  <option value="single">One Column</option>
                  <option value="two">Two Column</option>
                </select>
              </div>
            </div>

            {/* Color Selection */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Colors:</span>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value)}
                    className={`w-8 h-8 rounded-full ${color.color} ${
                      selectedColor === color.value 
                        ? 'ring-2 ring-blue-500 ring-offset-2' 
                        : 'hover:scale-110'
                    } transition-all duration-200`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {templates.slice(0, 3).map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-blue-500 shadow-xl' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => onTemplateSelect(template.id)}
            >
              <CardContent className="p-0">
                {/* Template Preview */}
                <div className="relative">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                    {/* Template Preview Content */}
                    <div className="h-full bg-white rounded shadow-sm p-4">
                      {/* Header */}
                      <div className={`text-center mb-4 ${
                        selectedColor === 'blue' ? 'bg-blue-500 text-white' :
                        selectedColor === 'green' ? 'bg-green-500 text-white' :
                        selectedColor === 'teal' ? 'bg-teal-500 text-white' :
                        selectedColor === 'purple' ? 'bg-purple-500 text-white' :
                        selectedColor === 'orange' ? 'bg-orange-500 text-white' :
                        selectedColor === 'red' ? 'bg-red-500 text-white' :
                        selectedColor === 'gray' ? 'bg-gray-500 text-white' :
                        'bg-gray-200 text-gray-800'
                      } p-3 rounded`}>
                        <h3 className="font-bold text-sm">JOHN DOE</h3>
                        <p className="text-xs">Software Developer</p>
                      </div>
                      
                      {/* Content Preview */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-300 rounded w-full"></div>
                        <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-300 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {selectedTemplate === template.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                    {template.isPopular && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(template.id);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTemplateSelect(template.id);
                      }}
                      size="sm"
                      className={`flex-1 ${
                        selectedTemplate === template.id 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {selectedTemplate === template.id ? 'Selected' : 'Choose Template'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Customization Summary */}
      {selectedTemplate && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Selected Template</h3>
                <p className="text-sm text-blue-700">
                  {ResumeTemplateManager.getTemplateById(selectedTemplate)?.name} • 
                  {selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} • 
                  {showPhoto ? 'With Photo' : 'Without Photo'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Palette className="w-4 h-4 mr-1" />
                  Customize
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
