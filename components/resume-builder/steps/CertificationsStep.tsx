'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface CertificationsStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
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
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    className="w-full"
                  />
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

