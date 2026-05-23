/**
 * Gallery-only demo data for template thumbnails.
 * Never written to form state, export, or live preview defaults.
 */

import { isValidProfileImage } from '@/lib/resume-builder/section-visibility';

/** Static asset — visual only for template gallery / change-template modal */
export const GALLERY_DEMO_PROFILE_IMAGE = '/resume-builder/demo-profile.svg';

export function resolveGalleryProfileImage(
  formData: Record<string, unknown>,
  getString: (keys: string[]) => string
): string {
  const profileImage = getString([
    'Profile Image',
    'Photo',
    'profileImage',
    'photo',
    'profilePhoto',
  ]);
  if (isValidProfileImage(profileImage)) {
    return profileImage;
  }
  return GALLERY_DEMO_PROFILE_IMAGE;
}

/** Rich sample resume used only when gallery has no user form data */
export function buildGallerySampleFormData(): Record<string, unknown> {
  return {
    firstName: 'Brian',
    lastName: 'Baxter',
    name: 'Brian R. Baxter',
    email: 'brian.baxter@email.com',
    phone: '+1 234 567 8900',
    jobTitle: 'Graphic & Web Designer',
    location: 'Chicago, IL',
    linkedin: 'linkedin.com/in/brianbaxter',
    portfolio: 'www.yourwebsite.com',
    profileImage: GALLERY_DEMO_PROFILE_IMAGE,
    summary:
      'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
    skills: [
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Microsoft Word',
      'Microsoft PowerPoint',
      'HTML/CSS',
      'JavaScript',
      'UI/UX Design',
      'Brand Identity',
    ],
    experience: [
      {
        title: 'Senior Web Designer',
        company: 'Creative Agency',
        location: 'Chicago',
        startDate: '2020',
        endDate: 'Present',
        description:
          'Lead design initiatives for major client projects, creating innovative web interfaces and digital experiences.',
      },
      {
        title: 'Graphic Designer',
        company: 'Creative Market',
        location: 'Chicago',
        startDate: '2015',
        endDate: '2020',
        description:
          'Designed marketing materials, brand identities, and digital assets for various clients.',
      },
    ],
    education: [
      {
        degree: 'Master Degree',
        school: 'Stanford University',
        field: 'Graphic Design',
        year: '2011-2013',
        graduationDate: '2013',
      },
      {
        degree: 'Bachelor Degree',
        school: 'University of Chicago',
        field: 'Visual Arts',
        year: '2007-2010',
        graduationDate: '2010',
      },
    ],
    projects: [
      {
        name: 'E-commerce Platform Redesign',
        description:
          'Complete redesign of client e-commerce platform resulting in 40% increase in conversions.',
        technologies: 'React, Node.js, MongoDB',
      },
    ],
    certifications: [
      { name: 'Adobe Certified Expert', issuer: 'Adobe Systems', date: '2020' },
    ],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Spanish', proficiency: 'Fluent' },
    ],
    achievements: ['Employee of the Year 2023', 'Best Design Award 2022'],
    hobbies: ['Photography', 'Reading', 'Traveling'],
  };
}

export function isGalleryEmptyFormData(formData: Record<string, unknown>): boolean {
  return Object.keys(formData).length === 0;
}
