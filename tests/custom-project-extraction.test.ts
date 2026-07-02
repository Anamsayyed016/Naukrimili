import {
  extractProjectsFromSection,
  extractProjectsWithMeta,
  toCanonicalProject,
  scoreProjectTitleCandidate,
  isValidProject,
} from '@/lib/resume-parser/custom/project-extraction';

describe('custom project extraction engine', () => {
  it('ATS layout — title, tech stack, links, bullets', () => {
    const section = [
      'E-Commerce Platform',
      'React, Node.js, MongoDB, Stripe',
      'github.com/anam/ecommerce | https://shop.example.com',
      'Jan 2024 - Mar 2024',
      '- Built checkout flow with cart persistence',
      '- Integrated Stripe payment gateway',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(1);
    expect(projects[0].title).toMatch(/E-Commerce Platform/i);
    expect(projects[0].technologies).toEqual(
      expect.arrayContaining(['React', 'Node.js', 'MongoDB'])
    );
    expect(projects[0].github).toMatch(/github\.com/i);
    expect(projects[0].liveUrl).toMatch(/shop\.example\.com/i);
    expect(projects[0].achievements.length).toBeGreaterThanOrEqual(2);
    expect(projects[0].confidence).toBeGreaterThan(30);

    const canonical = toCanonicalProject(projects[0]);
    expect(canonical.name).toMatch(/E-Commerce/i);
    expect(canonical.technologies.length).toBeGreaterThan(0);
  });

  it('bullet-first creative layout', () => {
    const section = [
      '• Portfolio Website — HTML, CSS, JavaScript',
      'Personal site showcasing projects and blog posts.',
      'Live: https://anam.dev',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(1);
    expect(projects[0].title).toMatch(/Portfolio Website/i);
    expect(projects[0].liveUrl).toMatch(/anam\.dev/i);
  });

  it('academic capstone project', () => {
    const section = [
      'Capstone: Smart Attendance System',
      'Python, Django, OpenCV, PostgreSQL',
      'Role: Team Lead & Backend Developer',
      'Final year academic project using facial recognition.',
      '- Achieved 95% attendance logging accuracy',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(1);
    expect(projects[0].title).toMatch(/Smart Attendance/i);
    expect(projects[0].role).toMatch(/Team Lead|Backend/i);
    expect(projects[0].technologies).toEqual(expect.arrayContaining(['Python', 'Django']));
  });

  it('multi-project with blank separation', () => {
    const section = [
      'Task Manager API',
      'FastAPI, PostgreSQL, Docker',
      'github.com/user/task-api',
      '- REST API with JWT authentication',
      '',
      'Weather Dashboard',
      'React, Tailwind CSS',
      'https://weather-demo.app',
      '- Real-time weather data visualization',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(2);
    expect(projects[0].title).toMatch(/Task Manager/i);
    expect(projects[1].title).toMatch(/Weather Dashboard/i);
  });

  it('rejects isolated technology list', () => {
    const { projects, rejectedCount } = extractProjectsWithMeta('Python, React, AWS, Docker, Redis');
    expect(projects).toHaveLength(0);
    expect(rejectedCount).toBeGreaterThanOrEqual(1);
  });

  it('never classifies job title as project', () => {
    expect(scoreProjectTitleCandidate('Full Stack Python Developer')).toBe(0);
    expect(
      isValidProject({
        title: 'Senior Software Engineer',
        role: '',
        description: '',
        technologies: [],
        github: '',
        liveUrl: '',
        duration: '',
        company: '',
        achievements: [],
        confidence: 0,
        fieldConfidence: {
          title: 50,
          role: 0,
          description: 0,
          technologies: 0,
          links: 0,
          company: 0,
          duration: 0,
        },
      })
    ).toBe(false);
  });

  it('accepts description-only project when title missing', () => {
    const section = [
      'Built a real-time chat application using WebSockets and Redis pub/sub for message delivery.',
      '- Supports private rooms and typing indicators',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(1);
    expect(projects[0].description || projects[0].achievements.length).toBeTruthy();
  });

  it('open source with GitLab link', () => {
    const section = [
      'Open Source CLI Tool',
      'gitlab.com/anam/cli-tool',
      'Go, Cobra',
      'Command-line utility for batch file processing.',
    ].join('\n');

    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBe(1);
    expect(projects[0].github).toMatch(/gitlab\.com/i);
  });
});
