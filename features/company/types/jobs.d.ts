export interface JobPostForm {
  title: string;
  description: string;
  remotePolicy: 'remote' | 'hybrid' | 'onsite';
  salaryRange: [number, number];
  skills: string[];
} 