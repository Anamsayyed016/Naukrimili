/**
 * Dynamic repair for merged / cross-mixed Naukri-style project descriptions.
 */

import {
  sanitizeProjectEntry,
  splitMergedProjectEntries,
} from '@/lib/resume-parser/import-sanitize';

describe('project description repair (Naukri / Diksha)', () => {
  it('drops personal-details rows misclassified as projects', () => {
    const dropped = sanitizeProjectEntry(
      {
        name: 'Details',
        description: 'Marital Status: Single Date of birth: 22/07/2000',
      },
      0
    );
    expect(dropped).toBeNull();
  });

  it('splits one merged blob into separate projects by embedded title lines', () => {
    const merged = [
      {
        name: 'Billing Automation Portal',
        description: [
          'Built invoice workflow automation with SAP integration.',
          'Restaurant Ordering Website',
          'Designed online menu, reservations, and payment flow for a restaurant brand.',
        ].join('\n'),
        technologies: 'SAP, Excel',
      },
    ];

    const split = splitMergedProjectEntries(merged);
    expect(split.length).toBe(2);
    expect(split.map((p) => String(p.name))).toEqual(
      expect.arrayContaining(['Billing Automation Portal', 'Restaurant Ordering Website'])
    );
    expect(String(split.find((p) => p.name === 'Billing Automation Portal')?.description)).toContain(
      'invoice workflow'
    );
    expect(String(split.find((p) => p.name === 'Restaurant Ordering Website')?.description)).toContain(
      'online menu'
    );
    expect(
      String(split.find((p) => p.name === 'Billing Automation Portal')?.description)
    ).not.toContain('Restaurant Ordering Website');
  });

  it('rebalances descriptions when sibling project titles appear inside another project body', () => {
    const mixed = [
      {
        name: 'Inventory Dashboard',
        description: [
          'Built Flask API for warehouse stock tracking.',
          'Vendor Onboarding Portal',
          'Created vendor registration and document verification modules.',
        ].join('\n'),
      },
      {
        name: 'Vendor Onboarding Portal',
        description: '',
      },
    ];

    const repaired = splitMergedProjectEntries(mixed);
    const inventory = repaired.find((p) => p.name === 'Inventory Dashboard');
    const vendor = repaired.find((p) => p.name === 'Vendor Onboarding Portal');

    expect(inventory?.description).toContain('Flask API');
    expect(inventory?.description).not.toContain('Vendor Onboarding Portal');
    expect(vendor?.description).toContain('vendor registration');
  });
});
