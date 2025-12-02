/**
 * Resume Builder Types
 * Type-only definitions to avoid module initialization issues
 * These types are separated from template-loader to prevent TDZ errors
 * Order: Define ColorVariant first, then Template, then LoadedTemplate to avoid circular references
 */

export interface ColorVariant {
  id: string;
  name: string;
  primary: string;
  accent: string;
  text: string;
}

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  preview: string;
  html: string;
  css: string;
  categories: string[];
  layout: string;
  hasSidebar: boolean;
  hasPhoto: boolean;
  recommended: boolean;
  colors: ColorVariant[];
  defaultColor: string;
}

export interface LoadedTemplate {
  template: Template;
  html: string;
  css: string;
}

export interface BackgroundPattern {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  pattern: string;
  opacity: number;
  atsScore: number;
  category: string;
  recommended: boolean;
}

export interface BackgroundCategory {
  id: string;
  name: string;
  description: string;
}

