'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function ContactsStep({ formData, updateFormData }: ContactsStepProps) {
  const [focused, setFocused] = useState<string>('');

  const handleChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  const isFieldValid = (field: string): boolean => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  };

  const fields = [
    {
      id: 'firstName',
      label: 'First Name',
      placeholder: 'John',
      required: true,
      value: formData.firstName || formData.name?.split(' ')[0] || '',
    },
    {
      id: 'lastName',
      label: 'Last Name',
      placeholder: 'Doe',
      required: true,
      value: formData.lastName || formData.name?.split(' ').slice(1).join(' ') || '',
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'john.doe@email.com',
      required: true,
      value: formData.email || '',
    },
    {
      id: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '+1 234 567 8900',
      value: formData.phone || '',
    },
    {
      id: 'location',
      label: 'Location',
      placeholder: 'City, State',
      value: formData.location || '',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      placeholder: 'linkedin.com/in/johndoe',
      value: formData.linkedin || '',
    },
    {
      id: 'portfolio',
      label: 'Portfolio/Website',
      placeholder: 'www.yourwebsite.com',
      value: formData.portfolio || formData.website || '',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Contact Information
        </h2>
        <p className="text-sm text-gray-600">
          Add your contact details so employers can reach you.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="text-sm font-semibold text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <AnimatePresence>
                {isFieldValid(field.id) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <motion.div
              className="relative"
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                id={field.id}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onFocus={() => setFocused(field.id)}
                onBlur={() => setFocused('')}
                className={cn(
                  'w-full transition-all duration-200',
                  isFieldValid(field.id) && 'border-green-500 focus-visible:ring-green-500 shadow-sm',
                  focused === field.id && 'ring-2 ring-blue-500 border-blue-500 shadow-md'
                )}
              />
              {focused === field.id && (
                <motion.div
                  layoutId="focusRing"
                  className="absolute inset-0 rounded-md border-2 border-blue-500 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Job Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor="jobTitle" className="text-sm font-semibold text-gray-900">
            Job Title / Professional Title
          </Label>
          <AnimatePresence>
            {isFieldValid('jobTitle') && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Input
            id="jobTitle"
            placeholder="Software Engineer"
            value={formData.jobTitle || formData.title || ''}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            onFocus={() => setFocused('jobTitle')}
            onBlur={() => setFocused('')}
            className={cn(
              'w-full transition-all duration-200',
              isFieldValid('jobTitle') && 'border-green-500 focus-visible:ring-green-500 shadow-sm',
              focused === 'jobTitle' && 'ring-2 ring-blue-500 border-blue-500 shadow-md'
            )}
          />
          {focused === 'jobTitle' && (
            <motion.div
              layoutId="focusRing"
              className="absolute inset-0 rounded-md border-2 border-blue-500 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
            />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

