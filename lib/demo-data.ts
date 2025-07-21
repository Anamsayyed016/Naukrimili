// Demo data for homepage sections

export function getDemoHero() {
  return Promise.resolve({
    headline: 'Find Your Dream Job',
    subheadline: 'Connecting top talent with great companies.',
    image: '/hero-image.png',
  });
}

export function getDemoStats() {
  return Promise.resolve({
    jobs: 1200,
    companies: 300,
    users: 5000,
    hires: 800,
  });
}

export function getDemoFeaturedJobs() {
  return Promise.resolve({
    jobs: [
      { id: 1, title: 'Frontend Developer', company: 'TechCorp', location: 'Remote' },
      { id: 2, title: 'UI/UX Designer', company: 'Designify', location: 'New York' },
      { id: 3, title: 'Data Scientist', company: 'AI Solutions', location: 'San Francisco' },
    ],
  });
}

export function getDemoHowItWorks() {
  return Promise.resolve({
    steps: [
      { title: 'Sign Up', description: 'Create your free account as a jobseeker or employer.' },
      { title: 'Post or Search Jobs', description: 'Employers post jobs, seekers search and apply.' },
      { title: 'Get Matched', description: 'Our AI matches candidates to jobs.' },
      { title: 'Get Hired', description: 'Land your dream job or hire top talent.' },
    ],
  });
}

export function getDemoTestimonials() {
  return Promise.resolve({
    testimonials: [
      { id: 1, name: 'Alice', text: 'I found my dream job in just 2 weeks!' },
      { id: 2, name: 'Bob', text: 'The hiring process was smooth and fast.' },
      { id: 3, name: 'Carol', text: 'Great platform for both employers and jobseekers.' },
    ],
  });
}

export function getDemoCTA() {
  return Promise.resolve({
    text: 'Ready to take the next step in your career?',
    button: 'Get Started',
    link: '/register',
  });
} 