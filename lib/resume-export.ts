/**
 * RESUME EXPORT SYSTEM
 * Lead Engineer & Code Guardian - PDF/DOCX Export with Security
 */

import { UnifiedResumeData } from '@/types/unified-resume';
import { ResumeTemplateManager, TemplateCustomization } from './resume-templates';

export interface ExportOptions {
  format: 'pdf' | 'docx';
  templateId: string;
  customization: TemplateCustomization;
  includePhoto: boolean;
  quality: 'draft' | 'standard' | 'high';
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  data?: Blob;
  filename: string;
  size: number;
  error?: string;
}

export class ResumeExporter {
  /**
   * Export resume to PDF
   */
  static async exportToPDF(resumeData: UnifiedResumeData, options: ExportOptions): Promise<ExportResult> {
    try {
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Get template configuration
      const template = ResumeTemplateManager.getTemplateById(options.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Generate PDF content based on template
      await this.generatePDFContent(doc, resumeData, template, options);
      
      // Generate filename
      const filename = options.filename || `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      
      // Get PDF blob
      const pdfBlob = doc.output('blob');
      
      return {
        success: true,
        data: pdfBlob,
        filename,
        size: pdfBlob.size
      };
    } catch (error) {
      console.error('PDF export failed:', error);
      return {
        success: false,
        filename: 'resume.pdf',
        size: 0,
        error: error instanceof Error ? error.message : 'PDF export failed'
      };
    }
  }

  /**
   * Export resume to DOCX
   */
  static async exportToDOCX(resumeData: UnifiedResumeData, options: ExportOptions): Promise<ExportResult> {
    try {
      // Dynamic import to reduce bundle size
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      // Generate DOCX content
      const doc = new Document({
        sections: [{
          properties: {},
          children: await this.generateDOCXContent(resumeData, options)
        }]
      });
      
      // Generate filename
      const filename = options.filename || `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`;
      
      // Generate DOCX blob
      const buffer = await Packer.toBuffer(doc);
      const docxBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      return {
        success: true,
        data: docxBlob,
        filename,
        size: docxBlob.size
      };
    } catch (error) {
      console.error('DOCX export failed:', error);
      return {
        success: false,
        filename: 'resume.docx',
        size: 0,
        error: error instanceof Error ? error.message : 'DOCX export failed'
      };
    }
  }

  /**
   * Generate PDF content based on template
   */
  private static async generatePDFContent(doc: any, resumeData: UnifiedResumeData, template: any, options: ExportOptions) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(resumeData.personalInfo.fullName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Contact info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactInfo = [
      resumeData.personalInfo.email,
      resumeData.personalInfo.phone,
      resumeData.personalInfo.location
    ].filter(Boolean).join(' • ');
    
    doc.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Summary
    if (resumeData.personalInfo.summary) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL SUMMARY', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(resumeData.personalInfo.summary, pageWidth - 40);
      doc.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 5 + 10;
    }

    // Experience
    if (resumeData.experience.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFESSIONAL EXPERIENCE', 20, yPosition);
      yPosition += 8;

      resumeData.experience.forEach(exp => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.position, 20, yPosition);
        yPosition += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`, 20, yPosition);
        yPosition += 5;

        if (exp.description) {
          const descLines = doc.splitTextToSize(exp.description, pageWidth - 40);
          doc.text(descLines, 20, yPosition);
          yPosition += descLines.length * 4 + 5;
        }

        if (exp.achievements.length > 0) {
          exp.achievements.forEach(achievement => {
            doc.text(`• ${achievement}`, 25, yPosition);
            yPosition += 4;
          });
        }
        yPosition += 5;
      });
    }

    // Education
    if (resumeData.education.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCATION', 20, yPosition);
      yPosition += 8;

      resumeData.education.forEach(edu => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${edu.degree} in ${edu.field}`, 20, yPosition);
        yPosition += 5;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.institution} | ${edu.startDate} - ${edu.endDate}`, 20, yPosition);
        yPosition += 8;
      });
    }

    // Skills
    if (resumeData.skills.length > 0) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SKILLS', 20, yPosition);
      yPosition += 8;

      const skillsText = resumeData.skills.map(skill => skill.name).join(' • ');
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(skillsLines, 20, yPosition);
    }
  }

  /**
   * Generate DOCX content
   */
  private static async generateDOCXContent(resumeData: UnifiedResumeData, options: ExportOptions) {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const content: any[] = [];

    // Header
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resumeData.personalInfo.fullName,
            bold: true,
            size: 32
          })
        ],
        alignment: 'center',
        spacing: { after: 200 }
      })
    );

    // Contact info
    const contactInfo = [
      resumeData.personalInfo.email,
      resumeData.personalInfo.phone,
      resumeData.personalInfo.location
    ].filter(Boolean).join(' • ');

    content.push(
      new Paragraph({
        children: [new TextRun({ text: contactInfo, size: 20 })],
        alignment: 'center',
        spacing: { after: 300 }
      })
    );

    // Summary
    if (resumeData.personalInfo.summary) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      content.push(
        new Paragraph({
          children: [new TextRun({ text: resumeData.personalInfo.summary, size: 22 })],
          spacing: { after: 300 }
        })
      );
    }

    // Experience
    if (resumeData.experience.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL EXPERIENCE',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      resumeData.experience.forEach(exp => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.position,
                bold: true,
                size: 22
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        );

        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`,
                size: 20
              })
            ],
            spacing: { after: 100 }
          })
        );

        if (exp.description) {
          content.push(
            new Paragraph({
              children: [new TextRun({ text: exp.description, size: 20 })],
              spacing: { after: 100 }
            })
          );
        }

        if (exp.achievements.length > 0) {
          exp.achievements.forEach(achievement => {
            content.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${achievement}`,
                    size: 20
                  })
                ],
                spacing: { after: 50 }
              })
            );
          });
        }
      });
    }

    // Education
    if (resumeData.education.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'EDUCATION',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      resumeData.education.forEach(edu => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${edu.degree} in ${edu.field}`,
                bold: true,
                size: 22
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        );

        content.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${edu.institution} | ${edu.startDate} - ${edu.endDate}`,
                size: 20
              })
            ],
            spacing: { after: 200 }
          })
        );
      });
    }

    // Skills
    if (resumeData.skills.length > 0) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SKILLS',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 200 }
        })
      );

      const skillsText = resumeData.skills.map(skill => skill.name).join(' • ');
      content.push(
        new Paragraph({
          children: [new TextRun({ text: skillsText, size: 20 })],
          spacing: { after: 200 }
        })
      );
    }

    return content;
  }

  /**
   * Download file
   */
  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
