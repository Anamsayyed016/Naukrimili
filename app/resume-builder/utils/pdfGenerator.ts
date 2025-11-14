/**
 * PDF Generation Utility for Resume Builder
 * Uses jsPDF to generate PDF resumes from HTML/CSS templates
 */

import { jsPDF } from 'jspdf';
import { ResumeBuilderData } from '../types';

export class PDFGenerator {
  /**
   * Generate PDF from resume data and template
   */
  static async generatePDF(data: ResumeBuilderData, templateId: string): Promise<Blob> {
    // Create HTML content from template
    const htmlContent = this.generateHTML(data, templateId);
    
    // Create jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Convert HTML to PDF (simplified - you may want to use html2canvas or similar)
    // For now, we'll create a text-based PDF
    this.addContentToPDF(pdf, data, templateId);

    // Generate blob
    return pdf.output('blob');
  }

  /**
   * Generate HTML content for a template (for future HTML-based PDF generation)
   */
  private static generateHTML(data: ResumeBuilderData, templateId: string): string {
    // This would generate HTML based on template
    // For now, return empty - implement template-specific HTML generation
    return '';
  }

  /**
   * Add content to PDF document
   */
  private static addContentToPDF(pdf: jsPDF, data: ResumeBuilderData, templateId: string): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const fontSize = 12;

    // Set font
    pdf.setFontSize(fontSize);

    // Header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.personalInfo.fullName || 'Resume', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight + 2;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const contactInfo = [
      data.personalInfo.email,
      data.personalInfo.phone,
      data.personalInfo.location,
    ].filter(Boolean).join(' | ');
    
    if (contactInfo) {
      pdf.text(contactInfo, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight + 5;
    }

    // Summary
    if (data.personalInfo.summary) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professional Summary', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(data.personalInfo.summary, pageWidth - 2 * margin);
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * lineHeight + 5;
    }

    // Skills
    if (data.skills.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, pageHeight, lineHeight);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Skills', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const skillsText = data.skills.map(s => s.name).join(', ');
      const skillsLines = pdf.splitTextToSize(skillsText, pageWidth - 2 * margin);
      pdf.text(skillsLines, margin, yPosition);
      yPosition += skillsLines.length * lineHeight + 5;
    }

    // Experience
    if (data.experience.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, pageHeight, lineHeight * 3);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Professional Experience', margin, yPosition);
      yPosition += lineHeight + 2;

      data.experience.forEach((exp) => {
        yPosition = this.checkPageBreak(pdf, yPosition, pageHeight, lineHeight * 4);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(exp.position, margin, yPosition);
        yPosition += lineHeight;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || 'Present'}`, margin, yPosition);
        yPosition += lineHeight;

        if (exp.description) {
          const descLines = pdf.splitTextToSize(exp.description, pageWidth - 2 * margin);
          pdf.text(descLines, margin, yPosition);
          yPosition += descLines.length * lineHeight;
        }
        yPosition += 3;
      });
    }

    // Education
    if (data.education.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, pageHeight, lineHeight * 3);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Education', margin, yPosition);
      yPosition += lineHeight + 2;

      data.education.forEach((edu) => {
        yPosition = this.checkPageBreak(pdf, yPosition, pageHeight, lineHeight * 3);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${edu.degree} in ${edu.field}`, margin, yPosition);
        yPosition += lineHeight;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${edu.institution} | ${edu.startDate} - ${edu.endDate || 'Present'}`, margin, yPosition);
        yPosition += lineHeight + 3;
      });
    }
  }

  /**
   * Check if we need a new page
   */
  private static checkPageBreak(pdf: jsPDF, yPosition: number, pageHeight: number, requiredSpace: number): number {
    if (yPosition + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      return 20;
    }
    return yPosition;
  }

  /**
   * Download PDF
   */
  static downloadPDF(data: ResumeBuilderData, templateId: string, fileName?: string): Promise<void> {
    return this.generatePDF(data, templateId).then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `${data.personalInfo.fullName || 'resume'}-${templateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }
}

