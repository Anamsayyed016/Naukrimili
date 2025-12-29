'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface CertificationsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
  link?: string;
  url?: string;
}

export default function CertificationsStep({ formData, updateFormData }: CertificationsStepProps) {
  const certifications: Certification[] = Array.isArray(formData.certifications)
    ? formData.certifications
    : [];
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: string[] }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: number]: boolean }>({});
  const debounceTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const addCertification = () => {
    const newCert: Certification = {
      name: '',
      issuer: '',
      date: '',
      link: '',
    };
    updateFormData({
      certifications: [...certifications, newCert],
    });
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ certifications: updated });
  };

  const removeCertification = (index: number) => {
    const updated = certifications.filter((_, i) => i !== index);
    updateFormData({ certifications: updated });
    setAiSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[index];
      return newSuggestions;
    });
  };

  const fetchAISuggestions = async (index: number, value: string) => {
    // Reduced minimum length to 1 character for faster suggestions
    if (!value || value.trim().length < 1) {
      setAiSuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }

    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    debounceTimers.current[index] = setTimeout(async () => {
      setLoadingSuggestions(prev => ({ ...prev, [index]: true }));

      try {
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'certification',
            value,
            context: {
              jobTitle: formData.jobTitle || formData.title || '',
              skills: Array.isArray(formData.skills) ? formData.skills : [],
              experienceLevel: formData.experienceLevel || 'mid-level',
              industry: formData.industry || '',
              userInput: value
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Certification suggestions received:', { count: data.suggestions?.length, provider: data.aiProvider });
          if (data.success && data.suggestions && Array.isArray(data.suggestions)) {
            setAiSuggestions(prev => ({ ...prev, [index]: data.suggestions }));
          } else {
            console.warn('⚠️ No suggestions in response:', data);
            setAiSuggestions(prev => ({ ...prev, [index]: [] }));
          }
        } else {
          console.error('❌ Failed to fetch certification suggestions:', response.status, response.statusText);
          setAiSuggestions(prev => ({ ...prev, [index]: [] }));
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoadingSuggestions(prev => ({ ...prev, [index]: false }));
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Certifications</h2>
        <p className="text-sm text-gray-600">
          Add your professional certifications and credentials.
        </p>
      </div>

      <div className="space-y-4">
        {certifications.map((cert, index) => {
          const name = cert.name || '';
          const issuer = cert.issuer || '';
          const date = cert.date || '';
          const link = cert.link || cert.url || '';

          return (
            <div
              key={index}
              className="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Certification #{index + 1}
                </h3>
                {certifications.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCertification(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Certification Name</Label>
                  <Input
                    placeholder="AWS Certified Solutions Architect"
                    value={name}
                    onChange={(e) => {
                      updateCertification(index, 'name', e.target.value);
                      fetchAISuggestions(index, e.target.value);
                    }}
                    className="w-full"
                  />
                  {loadingSuggestions[index] && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Getting AI suggestions...</span>
                    </div>
                  )}
                  {!loadingSuggestions[index] && aiSuggestions[index] && aiSuggestions[index].length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Suggestions:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiSuggestions[index].slice(0, 5).map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              updateCertification(index, 'name', suggestion);
                              setAiSuggestions(prev => ({ ...prev, [index]: [] }));
                            }}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Issuing Organization</Label>
                  <Input
                    placeholder="Amazon Web Services"
                    value={issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Date</Label>
                  <Input
                    type="month"
                    value={date}
                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Credential Link (Optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/certificate"
                    value={link}
                    onChange={(e) => updateCertification(index, 'link', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={addCertification}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No certifications added yet.</p>
          <Button variant="outline" onClick={addCertification}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Certification
          </Button>
        </div>
      )}
    </div>
  );
}

