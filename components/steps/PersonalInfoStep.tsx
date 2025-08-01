import React from 'react';

interface PersonalInfoStepProps {
  data: {
    firstName: string;
    lastName: string;
    phone: string;
    location: string;
    bio: string;
  };
  onUpdate: (updates: Partial<PersonalInfoStepProps['data']>) => void;
}

export function PersonalInfoStep({ data, onUpdate }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">👤 Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">First Name</label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
            placeholder="Enter your first name"
          />
        </div>
        
        <div>
          <label className="block text-white text-sm font-medium mb-2">Last Name</label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
            placeholder="Enter your last name"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-white text-sm font-medium mb-2">Phone Number</label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
          placeholder="Enter your phone number"
        />
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">Location</label>
        <input
          type="text"
          value={data.location}
          onChange={(e) => onUpdate({ location: e.target.value })}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
          placeholder="City, Country"
        />
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">Bio</label>
        <textarea
          value={data.bio}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 h-32"
          placeholder="Tell us about yourself..."
        />
      </div>
    </div>
  );
}
