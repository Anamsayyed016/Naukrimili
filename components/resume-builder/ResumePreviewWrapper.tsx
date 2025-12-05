'use client';

/**
 * Resume Preview Wrapper Component
 * 
 * A self-contained, isolated preview component with independent scrolling
 * Uses the provided CSS template styling with scoped selectors
 * 
 * Features:
 * - Independent vertical scrolling (only preview scrolls, not the page)
 * - Clean A4-like document viewer
 * - No conflicts with existing components
 * - Professional resume template styling
 */

import { useEffect, useRef, useState } from 'react';

interface ResumePreviewWrapperProps {
  formData: Record<string, any>;
  templateId?: string;
  selectedColorId?: string;
  className?: string;
}

export default function ResumePreviewWrapper({
  formData,
  templateId,
  selectedColorId,
  className = '',
}: ResumePreviewWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Generate resume HTML with the provided CSS
  const generateResumeHTML = () => {
    // Extract data from formData with safe fallbacks
    const firstName = formData.firstName || '';
    const lastName = formData.lastName || '';
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (formData.name || 'Your Name');
    const title = formData.title || formData.jobTitle || 'Professional Title';
    const email = formData.email || '';
    const phone = formData.phone || '';
    const location = formData.location || formData.city || '';
    const linkedin = formData.linkedin || '';
    
    const summary = formData.summary || formData.professionalSummary || '';
    
    const experience = Array.isArray(formData.experience) ? formData.experience : [];
    const education = Array.isArray(formData.education) ? formData.education : [];
    const skills = Array.isArray(formData.skills) ? formData.skills : [];
    const languages = Array.isArray(formData.languages) ? formData.languages : [];
    const projects = Array.isArray(formData.projects) ? formData.projects : [];
    const certifications = Array.isArray(formData.certifications) ? formData.certifications : [];
    const achievements = Array.isArray(formData.achievements) ? formData.achievements : [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Preview</title>
  <style>
    :root {
      --page-width: 210mm;
      --page-height: 297mm;
      --margin: 18mm;
      --accent: #0b6efd;
      --text: #111;
      --subtext: #5b6b76;
      --bg-light: #fbfdff;
      --font: "Helvetica Neue", Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #f3f4f6;
      font-family: var(--font);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
    }

    /* ---------- Resume Page ---------- */
    .resume-page {
      width: calc(var(--page-width) - 2 * var(--margin));
      min-height: calc(var(--page-height) - 2 * var(--margin));
      padding: 28px;
      margin: 28px auto;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 6px 18px rgba(12, 20, 40, 0.08);
    }

    /* ---------- Header ---------- */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 14px;
    }

    .name {
      font-size: 24px;
      font-weight: 700;
    }

    .title {
      font-size: 13px;
      color: var(--subtext);
      margin-top: 4px;
    }

    .contact {
      text-align: right;
      font-size: 12px;
      color: var(--subtext);
    }
    .contact div {
      margin-bottom: 4px;
    }

    /* ---------- Divider ---------- */
    .hr {
      height: 1px;
      background: rgba(0, 0, 0, 0.06);
      margin: 14px 0 18px;
    }

    /* ---------- Two Column Layout ---------- */
    .container {
      display: grid;
      grid-template-columns: 1fr 270px;
      gap: 22px;
    }

    /* ---------- Main Content ---------- */
    .section {
      margin-bottom: 18px;
    }

    .section h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--accent);
      margin: 0 0 8px 0;
    }

    p, li {
      font-size: 13px;
      line-height: 1.45;
    }

    ul {
      padding-left: 18px;
      margin: 6px 0 0;
    }

    .company {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .when {
      font-size: 12px;
      color: var(--subtext);
    }

    .job-entry {
      margin-bottom: 16px;
    }

    .edu-entry {
      margin-bottom: 14px;
    }

    .degree {
      font-weight: 600;
      margin-bottom: 2px;
    }

    .school {
      font-size: 12px;
      color: var(--subtext);
    }

    /* ---------- Sidebar ---------- */
    .sidebar {
      background: var(--bg-light);
      padding: 12px;
      border-radius: 6px;
      border: 1px solid rgba(12, 20, 40, 0.04);
    }

    .sidebar h4 {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 700;
    }

    .skill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill {
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 20px;
      background: rgba(11, 110, 253, 0.08);
      color: var(--accent);
    }

    .sidebar-section {
      margin-bottom: 16px;
    }

    .sidebar-section:last-child {
      margin-bottom: 0;
    }

    .sidebar-item {
      margin-bottom: 8px;
      font-size: 12px;
    }

    /* ---------- Printing ---------- */
    @media print {
      body {
        background: #fff;
      }

      .resume-page {
        margin: 0;
        box-shadow: none;
        border-radius: 0;
        width: 100%;
        padding: 20mm;
      }

      .container {
        grid-template-columns: 1fr 300px;
      }
    }

    /* ---------- Mobile Responsive ---------- */
    @media (max-width: 900px) {
      .resume-page {
        margin: 12px;
        padding: 20px;
        width: auto;
      }

      .container {
        display: block;
      }

      .sidebar {
        margin-top: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="resume-page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="name">${fullName}</div>
        <div class="title">${title}</div>
      </div>
      <div class="contact">
        ${email ? `<div>${email}</div>` : ''}
        ${phone ? `<div>${phone}</div>` : ''}
        ${location ? `<div>${location}</div>` : ''}
        ${linkedin ? `<div>${linkedin}</div>` : ''}
      </div>
    </div>

    <div class="hr"></div>

    <!-- Two Column Layout -->
    <div class="container">
      <!-- Main Content -->
      <div>
        ${summary ? `
        <div class="section">
          <h3>Professional Summary</h3>
          <p>${summary}</p>
        </div>
        ` : ''}

        ${experience.length > 0 ? `
        <div class="section">
          <h3>Experience</h3>
          ${experience.map(exp => `
            <div class="job-entry">
              <div class="company">${exp.company || exp.employer || 'Company Name'}</div>
              <div style="font-size: 13px; margin-bottom: 2px;">${exp.position || exp.title || 'Position'}</div>
              <div class="when">${exp.startDate || ''} - ${exp.current ? 'Present' : (exp.endDate || '')}</div>
              ${exp.description ? `<p style="margin-top: 6px;">${exp.description}</p>` : ''}
              ${exp.responsibilities && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 ? `
                <ul>
                  ${exp.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${education.length > 0 ? `
        <div class="section">
          <h3>Education</h3>
          ${education.map(edu => `
            <div class="edu-entry">
              <div class="degree">${edu.degree || 'Degree'}</div>
              <div class="school">${edu.institution || edu.school || 'Institution'}</div>
              <div class="when">${edu.startDate || ''} - ${edu.endDate || ''}</div>
              ${edu.description ? `<p style="margin-top: 4px; font-size: 12px;">${edu.description}</p>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${projects.length > 0 ? `
        <div class="section">
          <h3>Projects</h3>
          ${projects.map(proj => `
            <div class="job-entry">
              <div class="company">${proj.name || 'Project Name'}</div>
              ${proj.description ? `<p>${proj.description}</p>` : ''}
              ${proj.technologies && Array.isArray(proj.technologies) ? `
                <div style="margin-top: 6px; font-size: 12px; color: var(--subtext);">
                  Technologies: ${proj.technologies.join(', ')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${certifications.length > 0 ? `
        <div class="section">
          <h3>Certifications</h3>
          ${certifications.map(cert => `
            <div style="margin-bottom: 8px;">
              <div style="font-weight: 600; font-size: 13px;">${cert.name || cert.title || 'Certification'}</div>
              ${cert.issuer ? `<div class="when">${cert.issuer}${cert.date ? ` - ${cert.date}` : ''}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${achievements.length > 0 ? `
        <div class="section">
          <h3>Achievements</h3>
          <ul>
            ${achievements.map(ach => `<li>${typeof ach === 'string' ? ach : (ach.title || ach.description || 'Achievement')}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        ${skills.length > 0 ? `
        <div class="sidebar-section">
          <h4>Skills</h4>
          <div class="skill-list">
            ${skills.map(skill => `
              <span class="skill">${typeof skill === 'string' ? skill : (skill.name || 'Skill')}</span>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${languages.length > 0 ? `
        <div class="sidebar-section">
          <h4>Languages</h4>
          ${languages.map(lang => `
            <div class="sidebar-item">
              <strong>${typeof lang === 'string' ? lang : (lang.language || lang.name || 'Language')}</strong>
              ${lang.proficiency ? ` - ${lang.proficiency}` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Update iframe content when formData changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    try {
      const html = generateResumeHTML();
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      setIsReady(true);
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  }, [formData, templateId, selectedColorId]);

  return (
    <div 
      className={`resume-preview-wrapper ${className}`}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#f3f4f6',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Preview Header */}
      <div 
        style={{
          padding: '12px 16px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Live Preview
      </div>

      {/* Scrollable Preview Container */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#f3f4f6',
        }}
      >
        <iframe
          ref={iframeRef}
          title="Resume Preview"
          style={{
            width: '100%',
            minHeight: '100%',
            border: 'none',
            display: 'block',
            background: '#f3f4f6',
          }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
