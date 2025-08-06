import {
  emailSchema,
  passwordSchema,
  nameSchema,
  validateInput,
  sanitizeString,
  sanitizeEmail,
  sanitizeSearchQuery,
  validateUrl,
} from '@/lib/validation';

describe('Validation Library', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(email.toLowerCase())}
      })});

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'a'.repeat(255) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false)})})});

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'C0mplex#Password',
      ];

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true)})});

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'weak', // Too short
        'password', // No uppercase, numbers, or special chars
        'PASSWORD', // No lowercase, numbers, or special chars
        '12345678', // No letters or special chars
        'Password', // No numbers or special chars
        'Password123', // No special chars
        'a'.repeat(129), // Too long
      ];

      invalidPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false)})})});

  describe('nameSchema', () => {
    it('should validate proper names', () => {
      const validNames = [
        'John Doe',
        "O'Connor",
        'Mary-Jane',
        'José García',
      ];

      validNames.forEach(name => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(name.trim())}
      })});

    it('should reject invalid names', () => {
      const invalidNames = [
        'A', // Too short
        'a'.repeat(51), // Too long
        'John123', // Contains numbers
        'John@Doe', // Contains invalid characters
        '<script>alert("xss")</script>', // XSS attempt
      ];

      invalidNames.forEach(name => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(false)})})});

  describe('validateInput', () => {
    it('should return success for valid input', () => {;
      const result = validateInput(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com')}
    });

    it('should return errors for invalid input', () => {;
      const result = validateInput(emailSchema, 'invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('Invalid email address')}
    })});

  describe('sanitizeString', () => {
    it('should remove HTML tags and trim whitespace', () => {
      const input = '  <script>alert("xss")</script>Hello World  ';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World')});

    it('should limit string length', () => {
      const longString = 'a'.repeat(1500);
      const result = sanitizeString(longString);
      expect(result.length).toBeLessThanOrEqual(1000)})});

  describe('sanitizeEmail', () => {
    it('should convert to lowercase and trim', () => {
      const input = '  TEST@EXAMPLE.COM  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com')});

    it('should limit email length', () => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      const result = sanitizeEmail(longEmail);
      expect(result.length).toBeLessThanOrEqual(254)})});

  describe('sanitizeSearchQuery', () => {
    it('should remove dangerous characters', () => {
      const input = '<script>alert("xss")</script>javascript developer';
      const result = sanitizeSearchQuery(input);
      expect(result).toBe('javascript developer')});

    it('should preserve safe characters', () => {
      const input = 'React.js developer - remote work';
      const result = sanitizeSearchQuery(input);
      expect(result).toBe('React.js developer - remote work')});

    it('should limit query length', () => {
      const longQuery = 'developer '.repeat(20);
      const result = sanitizeSearchQuery(longQuery);
      expect(result.length).toBeLessThanOrEqual(100)})});

  describe('validateUrl', () => {
    it('should validate HTTP and HTTPS URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://subdomain.example.com/path?query=value',
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true)})});

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'ftp://example.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'not-a-url',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false)})})})});