import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  companyName: z.string().min(2),
  logo: z.instanceof(File).optional(),
  website: z.string().url().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompanyProfileEditor() {
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // TODO: handle profile update
    alert('Profile updated! ' + JSON.stringify(data, null, 2));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-company-700 mb-4">Company Profile</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-company-700 mb-1">Company Name</label>
        <input className="w-full border border-company-200 rounded px-3 py-2" {...register('companyName')} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-company-700 mb-1">Logo</label>
        <div className="bg-company-50 border border-company-200 rounded p-4 text-company-400">[LogoUpload Component]</div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-company-700 mb-1">Website</label>
        <input className="w-full border border-company-200 rounded px-3 py-2" {...register('website')} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-company-700 mb-1">Social Media Links</label>
        <div className="bg-company-50 border border-company-200 rounded p-4 text-company-400">[SocialLinksInput Component]</div>
      </div>
      <button type="submit" className="bg-company-500 text-white px-4 py-2 rounded">Save Changes</button>
    </form>
  );
} 