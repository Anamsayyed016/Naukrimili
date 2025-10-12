# Job Seeker Dashboard Documentation

## Overview
The Job Seeker Dashboard provides an interactive, mobile-responsive experience for job seekers, including:

- **Statistics Overview:** See jobs applied, profile views, application success rate, and average response time in a glance.
- **Quick Actions Toolbar:** Access Resume Builder, Job Search, Quick Apply, and view your profile completeness.
- **Recent Applications Tracking:** Track your job applications, statuses, and take actions like viewing or withdrawing.
- **Affiliate Marketing Recommendations:** Get personalized suggestions for LinkedIn Premium, resume review, and job search tools.

## Mock API Endpoints
All data is fetched from mock API functions in `lib/jobseeker-api.ts`:

- `getStats()` → `{ applied: 12, views: 45, successRate: 25, avgResponseTime: 3.2 }`
- `getApplications()` →
  ```js
  [
    { company: 'Tech Corp', jobTitle: 'Frontend Developer', appliedDate: '2024-06-01', status: 'Interview', jobLink: '#' },
    { company: 'InnovateX', jobTitle: 'UI/UX Designer', appliedDate: '2024-05-28', status: 'Submitted', jobLink: '#' },
    // ...
  ]
  ```
- `getRecommendations()` →
  ```js
  [
    { title: 'LinkedIn Premium', description: 'Boost your profile visibility...', link: 'https://linkedin.com/premium', icon: '🎓' },
    // ...
  ]
  ```

## Loading States & Mobile Responsiveness
- Each section displays a loading message while fetching data.
- The layout uses responsive CSS classes for optimal display on all devices.
- Tables and toolbars are horizontally scrollable on small screens.

## Accessing the Dashboard
- Visit `/jobseeker/dashboard` in your browser after starting the dev server.
- All features use mock data and are fully interactive.

## Customization
- You can update mock data in `lib/jobseeker-api.ts`.
- UI components can be styled or extended as needed.

---
For questions or further customization, see the code comments or contact the developer. 