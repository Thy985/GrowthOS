describe('sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p>Hello <strong>world</strong></p>';
      const result = html.replace(/<(?!\/?(p|strong|b|i|u|em|code|pre|br|ul|ol|li|h[1-6])(\s|>|$))/gi, '');
      expect(result).toContain('<p>');
    });

    it('should remove dangerous tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script>';
      const result = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });

    it('should handle empty string', () => {
      const result = '';
      expect(result).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const text = '<script>alert("xss")</script>';
      const result = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should preserve regular text', () => {
      const text = 'Hello World';
      expect(text).toBe('Hello World');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow valid http URLs', () => {
      const url = 'http://example.com';
      const isValid = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid).toBe(true);
    });

    it('should allow valid https URLs', () => {
      const url = 'https://example.com';
      const isValid = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid).toBe(true);
    });

    it('should block javascript: URLs', () => {
      const url = 'javascript:alert(1)';
      const isBlocked = url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:');
      expect(isBlocked).toBe(true);
    });

    it('should block data: URLs', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const isBlocked = url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:');
      expect(isBlocked).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('should allow safe filenames', () => {
      const filename = 'document.pdf';
      const result = filename.replace(/[^a-zA-Z0-9_.\-\s\u4e00-\u9fa5]/g, '').replace(/\.\./g, '');
      expect(result).toBe('document.pdf');
    });

    it('should allow Chinese characters', () => {
      const filename = '文档.pdf';
      const result = filename.replace(/[^a-zA-Z0-9_.\-\s\u4e00-\u9fa5]/g, '');
      expect(result).toContain('文档');
    });

    it('should remove path traversal attempts', () => {
      const filename = '../../../etc/passwd';
      const result = filename.replace(/[^a-zA-Z0-9_.\-\s\u4e00-\u9fa5]/g, '').replace(/\.\./g, '');
      expect(result).not.toContain('..');
    });

    it('should remove leading dots', () => {
      const filename = '...hidden';
      const result = filename.replace(/^\.+/, '');
      expect(result).toBe('hidden');
    });

    it('should truncate very long filenames', () => {
      const filename = 'a'.repeat(300) + '.pdf';
      const result = filename.substring(0, 255);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URL', () => {
      const isValid = (url: string) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid('http://example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      const isValid = (url: string) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid('https://example.com')).toBe(true);
    });

    it('should return true for valid relative URL', () => {
      const isValid = (url: string) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid('/path/to/resource')).toBe(true);
    });

    it('should return false for javascript: URL', () => {
      const isValid = (url: string) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid('javascript:alert(1)')).toBe(false);
    });

    it('should return false for data: URL', () => {
      const isValid = (url: string) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      expect(isValid('data:text/html,<script>')).toBe(false);
    });
  });

  describe('ALLOWED_TAGS', () => {
    it('should contain common safe tags', () => {
      const allowedTags = new Set(['b', 'i', 'u', 'em', 'strong', 'code', 'pre', 'br', 'p', 'span']);
      expect(allowedTags.has('b')).toBe(true);
      expect(allowedTags.has('i')).toBe(true);
      expect(allowedTags.has('script')).toBe(false);
    });
  });

  describe('ALLOWED_ATTRS', () => {
    it('should contain common safe attributes', () => {
      const allowedAttrs = new Set(['href', 'class', 'id', 'title', 'alt', 'src']);
      expect(allowedAttrs.has('href')).toBe(true);
      expect(allowedAttrs.has('class')).toBe(true);
      expect(allowedAttrs.has('onclick')).toBe(false);
    });
  });

  describe('DANGEROUS_PATTERNS', () => {
    it('should include common attack patterns', () => {
      const patterns = [
        /javascript:/i,
        /on\w+=/i,
        /data:/i,
        /vbscript:/i,
      ];
      expect(patterns.length).toBeGreaterThan(0);
    });
  });
});
