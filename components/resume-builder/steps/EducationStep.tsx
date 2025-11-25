'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SearchableSelect from '../form-inputs/SearchableSelect';
import InstitutionInput from '../form-inputs/InstitutionInput';

interface EducationStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function EducationStep({
  formData,
  onFieldChange,
}: EducationStepProps) {
  // Lazy load education data constants to avoid module initialization issues
  const [educationDataLoaded, setEducationDataLoaded] = useState(false);
  const [educationConstants, setEducationConstants] = useState<{
    EDUCATION_LEVELS?: readonly any[];
    DEGREE_TYPES?: any;
    FIELDS_OF_STUDY?: any;
    COUNTRIES?: readonly any[];
    INDIAN_STATES?: readonly any[];
    INDIAN_CITIES?: readonly any[];
    SPECIAL_LOCATIONS?: readonly any[];
    SCORE_FORMATS?: readonly any[];
    HONORS_AWARDS?: readonly any[];
    getAllFieldsOfStudy?: () => string[];
    generateYears?: () => Array<{ value: string; label: string }>;
  }>({});

  useEffect(() => {
    import('@/lib/resume-builder/education-data').then((eduData) => {
      setEducationConstants({
        EDUCATION_LEVELS: eduData.EDUCATION_LEVELS,
        DEGREE_TYPES: eduData.DEGREE_TYPES,
        FIELDS_OF_STUDY: eduData.FIELDS_OF_STUDY,
        COUNTRIES: eduData.COUNTRIES,
        INDIAN_STATES: eduData.INDIAN_STATES,
        INDIAN_CITIES: eduData.INDIAN_CITIES,
        SPECIAL_LOCATIONS: eduData.SPECIAL_LOCATIONS,
        SCORE_FORMATS: eduData.SCORE_FORMATS,
        HONORS_AWARDS: eduData.HONORS_AWARDS,
        getAllFieldsOfStudy: eduData.getAllFieldsOfStudy,
        generateYears: eduData.generateYears,
      });
      setEducationDataLoaded(true);
    });
  }, []);

  // Determine which education field to use
  const educationField = formData.experienceLevel === 'student' || formData.experienceLevel === 'fresher'
    ? 'Education(with year)'
    : 'Education';

  const educationData = formData[educationField] || 
                        formData.education || 
                        formData['Education'] || 
                        [];

  const addEntry = () => {
    const newEntry: Record<string, string> = {
      'Institution': '',
      'Degree': '',
      'Field of Study': '',
      'Location': '',
      'Year': '',
      'CGPA': '',
      'Honors/Awards': '',
      // Additional fields for enhanced dropdowns
      'Degree Level': '',
      'Country': '',
      'State': '',
      'City': '',
      'Score Format': '',
    };
    onChange([...educationData, newEntry]);
  };

  const removeEntry = (index: number) => {
    onChange(educationData.filter((_: any, i: number) => i !== index));
  };

  const updateEntry = (index: number, fieldName: string, fieldValue: string) => {
    const updated = [...educationData];
    updated[index] = { ...updated[index], [fieldName]: fieldValue };
    onChange(updated);
  };

  const updateEntryFields = (index: number, updates: Record<string, string>) => {
    const updated = [...educationData];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const onChange = (value: Array<Record<string, string>>) => {
    onFieldChange(educationField, value);
  };

  // Get degree options based on selected level
  const getDegreeOptions = (level: string) => {
    if (!level || !educationConstants.DEGREE_TYPES || !educationConstants.DEGREE_TYPES[level as keyof typeof educationConstants.DEGREE_TYPES]) {
      return [];
    }
    return educationConstants.DEGREE_TYPES[level as keyof typeof educationConstants.DEGREE_TYPES] || [];
  };

  // Get all fields of study as flat array
  const allFields = educationConstants.getAllFieldsOfStudy?.() || [];

  // Get years
  const years = educationConstants.generateYears?.() || [];

  // Show loading state while education data is being loaded
  if (!educationDataLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">4</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Education</h2>
            <p className="text-sm text-gray-600 mt-1">Add your educational background</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {educationData.map((entry: Record<string, string>, index: number) => {
          const degreeLevel = entry['Degree Level'] || '';
          const country = entry['Country'] || '';
          const state = entry['State'] || '';
          
          return (
            <div
              key={index}
              className="group relative p-5 md:p-6 border border-gray-200 rounded-xl space-y-4 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-300"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-md">
                    {index + 1}
                  </div>
                  <span className="text-base font-semibold text-gray-800">
                    Education #{index + 1}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove entry"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution - Hybrid Input with Auto-Suggestions (Full Width) */}
                <div className="md:col-span-2 space-y-2">
                  <InstitutionInput
                    label="Institution"
                    value={entry['Institution'] || ''}
                    onChange={(val) => updateEntry(index, 'Institution', val)}
                    placeholder="Type or select institution (e.g., Harvard, IIT, MIT)"
                    required={true}
                    className="w-full"
                  />
                </div>

                {/* Degree Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Degree Level
                  </Label>
                  <Select
                    value={degreeLevel || undefined}
                    onValueChange={(val) => {
                      updateEntry(index, 'Degree Level', val);
                      // Auto-populate degree if only one option
                      const degreeOptions = getDegreeOptions(val);
                      if (degreeOptions.length === 1) {
                        updateEntry(index, 'Degree', degreeOptions[0].value);
                      } else if (val && !entry['Degree']) {
                        // Reset degree when level changes (unless already set)
                        updateEntryFields(index, { 'Degree': '' });
                      }
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select degree level" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-96">
                      {(educationConstants.EDUCATION_LEVELS || []).map((level: any) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Degree */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Degree <span className="text-red-500">*</span>
                  </Label>
                  {degreeLevel ? (
                    <Select
                      value={entry['Degree'] || undefined}
                      onValueChange={(val) => {
                        updateEntry(index, 'Degree', val);
                      }}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[60vh] sm:max-h-96">
                        {getDegreeOptions(degreeLevel).map((degree) => (
                          <SelectItem key={degree.value} value={degree.value}>
                            {degree.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={entry['Degree'] || ''}
                      onChange={(e) => updateEntry(index, 'Degree', e.target.value)}
                      placeholder="e.g., B.Tech, MBA, BSc"
                      className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  )}
                </div>

                {/* Field of Study */}
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Field of Study
                  </Label>
                  <SearchableSelect
                    label=""
                    value={entry['Field of Study'] || ''}
                    onChange={(val) => updateEntry(index, 'Field of Study', val)}
                    options={allFields}
                    placeholder="Search or select field of study"
                    allowCustom={true}
                    searchPlaceholder="Search fields..."
                    className="w-full"
                  />
                </div>

                {/* Location - Country */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Country
                  </Label>
                  <Select
                    value={country}
                    onValueChange={(val) => {
                      updateEntry(index, 'Country', val);
                      // Reset state and city when country changes
                      if (val !== 'India') {
                        updateEntry(index, 'State', '');
                        updateEntry(index, 'City', '');
                      }
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-96">
                      {(educationConstants.SPECIAL_LOCATIONS || []).map((loc: any) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                      <SelectItem value="separator" disabled className="opacity-0 h-0 p-0" />
                      {(educationConstants.COUNTRIES || []).map((country: any) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* State (only for India) */}
                {country === 'India' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      State
                    </Label>
                    <SearchableSelect
                      label=""
                      value={state}
                      onChange={(val) => {
                        updateEntryFields(index, { 'State': val, 'City': '' });
                      }}
                      options={[...(educationConstants.INDIAN_STATES || [])]}
                      placeholder="Search or select state"
                      allowCustom={true}
                      searchPlaceholder="Search states..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* City (only for India with state) */}
                {country === 'India' && state && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <SearchableSelect
                      label=""
                      value={entry['City'] || ''}
                      onChange={(val) => updateEntry(index, 'City', val)}
                      options={[...(educationConstants.INDIAN_CITIES || [])]}
                      placeholder="Search or select city"
                      allowCustom={true}
                      searchPlaceholder="Search cities..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Location (for non-India or special locations) */}
                {country && country !== 'India' && !(educationConstants.SPECIAL_LOCATIONS || []).includes(country as any) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <Input
                      value={entry['Location'] || ''}
                      onChange={(e) => updateEntry(index, 'Location', e.target.value)}
                      placeholder="City, State/Province"
                      className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                )}

                {/* Year */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    {formData.experienceLevel === 'student' || formData.experienceLevel === 'fresher' ? 'Year *' : 'Year'}
                  </Label>
                  <Select
                    value={entry['Year'] || ''}
                    onValueChange={(val) => updateEntry(index, 'Year', val)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-96">
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Score Format */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Score Format
                  </Label>
                  <Select
                    value={entry['Score Format'] || ''}
                    onValueChange={(val) => updateEntry(index, 'Score Format', val)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-96">
                      {(educationConstants.SCORE_FORMATS || []).map((format: any) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CGPA/Score */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    CGPA / Score
                  </Label>
                  <Input
                    value={entry['CGPA'] || ''}
                    onChange={(e) => updateEntry(index, 'CGPA', e.target.value)}
                    placeholder={entry['Score Format'] === 'percentage' ? 'e.g., 85' : entry['Score Format'] === 'cgpa-10' ? 'e.g., 8.5' : entry['Score Format'] === 'cgpa-4' ? 'e.g., 3.5' : 'Enter score'}
                    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Honors/Awards */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Honors / Awards
                  </Label>
                  <Select
                    value={entry['Honors/Awards'] || ''}
                    onValueChange={(val) => updateEntry(index, 'Honors/Awards', val)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue placeholder="Select honors/awards" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-96">
                      {(educationConstants.HONORS_AWARDS || []).map((honor: any) => (
                        <SelectItem key={honor.value} value={honor.value}>
                          {honor.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}

        {educationData.length === 0 && (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-2">No education entries yet</p>
              <p className="text-sm text-gray-500 mb-4">Click the button below to add your first education entry</p>
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={addEntry}
                className="flex items-center gap-2 mx-auto shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-5 h-5" />
                Add Education
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Entry Button */}
      {educationData.length > 0 && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={addEntry}
            className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Another Education</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      )}
    </div>
  );
}
