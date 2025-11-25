'use client';

import { useState, useRef } from 'react';
import { Upload, X, User, Camera } from 'lucide-react';
import TextInput from '../form-inputs/TextInput';
import InputWithATS from '../form-inputs/InputWithATS';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PersonalInfoStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function PersonalInfoStep({
  formData,
  onFieldChange,
}: PersonalInfoStepProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    formData.profilePhoto || formData.photo || null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Convert to base64 for storage in formData
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onFieldChange('profilePhoto', base64String);
        setUploadingPhoto(false);
        toast({
          title: 'Photo uploaded',
          description: 'Your photo has been added successfully',
        });
      };
      reader.onerror = () => {
        setUploadingPhoto(false);
        toast({
          title: 'Upload failed',
          description: 'Failed to read the image file',
          variant: 'destructive',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadingPhoto(false);
      toast({
        title: 'Upload failed',
        description: 'An error occurred while uploading the photo',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    onFieldChange('profilePhoto', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
    }
    return '?';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">1</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              What's the best way for employers to contact you?
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              We suggest including an email and phone number. All fields marked with <span className="text-red-500">*</span> are required.
            </p>
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 rounded-2xl p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            {photoPreview && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Profile Photo</h3>
              <p className="text-sm text-gray-600">Add a professional photo to make your resume stand out (optional)</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 border-gray-300 hover:bg-white hover:border-blue-400 hover:text-blue-700 transition-all"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    {photoPreview ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </Button>
              {photoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemovePhoto}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextInput
              label="First Name"
              value={formData.firstName || ''}
              onChange={(val) => onFieldChange('firstName', val)}
              placeholder="Enter your first name"
              required
            />
            <TextInput
              label="Last Name"
              value={formData.lastName || ''}
              onChange={(val) => onFieldChange('lastName', val)}
              placeholder="Enter your last name"
              required
            />
            <TextInput
              label="Email"
              value={formData.email || ''}
              onChange={(val) => onFieldChange('email', val)}
              placeholder="your.email@example.com"
              type="email"
              required
            />
            <TextInput
              label="Phone"
              value={formData.phone || ''}
              onChange={(val) => onFieldChange('phone', val)}
              placeholder="+1 234 567 8900"
              type="tel"
            />
            <TextInput
              label="Location"
              value={formData.location || ''}
              onChange={(val) => onFieldChange('location', val)}
              placeholder="City, Country"
            />
          </div>
        </div>

        {/* Professional Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputWithATS
              label="Job Title / Desired Position"
              value={formData.jobTitle || formData.desiredJobTitle || ''}
              onChange={(val) => onFieldChange('jobTitle', val)}
              placeholder="e.g. Software Engineer"
              fieldType="position"
              formData={formData}
              experienceLevel={formData.experienceLevel || 'experienced'}
            />
            <TextInput
              label="Industry"
              value={formData.industry || ''}
              onChange={(val) => onFieldChange('industry', val)}
              placeholder="e.g. Technology, Finance, Healthcare"
            />
          </div>
        </div>

        {/* Additional Links */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
            <span className="text-xs text-gray-500">(Optional)</span>
          </div>
          <div className="bg-gray-50/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600">
              If you have a LinkedIn profile, portfolio or personal website, you can include links below. You may also include a driver's license and other information required for the job you want.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextInput
              label="LinkedIn"
              value={formData.linkedin || ''}
              onChange={(val) => onFieldChange('linkedin', val)}
              placeholder="linkedin.com/in/yourprofile"
            />
            <TextInput
              label="Portfolio / Website"
              value={formData.portfolio || formData.website || ''}
              onChange={(val) => onFieldChange('portfolio', val)}
              placeholder="yourwebsite.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

