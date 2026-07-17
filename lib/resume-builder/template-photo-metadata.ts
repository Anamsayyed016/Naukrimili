import templatesData from './templates.json';
import type { Template } from './types';

const photoSupportByTemplateId = new Map<string, boolean>(
  (templatesData.templates as Template[]).map((template) => [
    template.id,
    template.hasPhoto === true,
  ])
);

/** Whether a registered template renders a profile photo region. */
export function templateSupportsProfilePhoto(templateId?: string): boolean {
  if (!templateId) return false;
  return photoSupportByTemplateId.get(templateId) === true;
}
