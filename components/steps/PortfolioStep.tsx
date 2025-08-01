import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

interface PortfolioStepProps {
  data: {
    resume: File | null;
    profilePicture: File | null;
    socialLinks: {
      linkedin: string;
      github: string;
      portfolio: string;
    };
  };
  onUpdate: (updates: Partial<PortfolioStepProps['data']>) => void;
}

export function PortfolioStep({ data, onUpdate }: PortfolioStepProps) {
  const handleFileChange = useCallback((field: 'resume' | 'profilePicture') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onUpdate({ [field]: file });
  }, [onUpdate]);

  const handleSocialLinkChange = useCallback((platform: keyof typeof data.socialLinks) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      socialLinks: {
        ...data.socialLinks,
        [platform]: event.target.value
      }
    });
  }, [data.socialLinks, onUpdate]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">📁 Portfolio & Resume</h2>
      
      <div className="space-y-6">
        {/* Resume Upload */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Resume</label>
          <div className="space-y-2">
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                data.resume
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange('resume')}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <div className="text-center">
                {data.resume ? (
                  <>
                    <span className="text-green-400 text-lg mb-2">✓ Resume Uploaded</span>
                    <p className="text-green-300 text-sm">{data.resume.name}</p>
                  </>
                ) : (
                  <>
                    <span className="text-purple-300 text-lg mb-2">📄 Upload Resume</span>
                    <p className="text-purple-300 text-sm">PDF, DOC, or DOCX</p>
                  </>
                )}
              </div>
            </motion.label>
          </div>
        </div>

        {/* Profile Picture Upload */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">Profile Picture</label>
          <div className="space-y-2">
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                data.profilePicture
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange('profilePicture')}
                accept="image/*"
                className="hidden"
              />
              <div className="text-center">
                {data.profilePicture ? (
                  <>
                    <span className="text-green-400 text-lg mb-2">✓ Picture Uploaded</span>
                    <p className="text-green-300 text-sm">{data.profilePicture.name}</p>
                  </>
                ) : (
                  <>
                    <span className="text-purple-300 text-lg mb-2">🖼️ Upload Picture</span>
                    <p className="text-purple-300 text-sm">PNG, JPG, or GIF</p>
                  </>
                )}
              </div>
            </motion.label>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Social Links</h3>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">LinkedIn</label>
            <input
              type="url"
              value={data.socialLinks.linkedin}
              onChange={handleSocialLinkChange('linkedin')}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">GitHub</label>
            <input
              type="url"
              value={data.socialLinks.github}
              onChange={handleSocialLinkChange('github')}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
              placeholder="https://github.com/yourusername"
            />
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-2">Portfolio Website</label>
            <input
              type="url"
              value={data.socialLinks.portfolio}
              onChange={handleSocialLinkChange('portfolio')}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
              placeholder="https://yourportfolio.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
