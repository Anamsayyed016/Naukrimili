import { createJobSchema } from '../lib/validation/job';

describe('createJobSchema', () => {
  it('accepts minimal required fields', () => {
    const parsed = createJobSchema.safeParse({
      source: 'test',
      sourceId: 'abc',
      title: 'Engineer',
      country: 'US',
      description: 'Desc',
      rawJson: { a: 1 }
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects missing required', () => {
    const parsed = createJobSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});
