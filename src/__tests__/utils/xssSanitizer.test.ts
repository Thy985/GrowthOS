import { sanitizeUserInput, sanitizeAIOutput } from '../../utils/xssSanitizer';

describe('XSS Sanitizer', () => {
  describe('sanitizeUserInput', () => {
    it('should allow plain text', () => {
      const input = 'Hello, World!';
      const result = sanitizeUserInput(input);
      expect(result).toBe('Hello, World!');
    });

    it('should allow Chinese characters', () => {
      const input = '你好，世界！这是一段中文文本。';
      const result = sanitizeUserInput(input);
      expect(result).toBe(input);
    });

    it('should allow basic HTML tags for formatting', () => {
      const input = '<b>Bold</b> and <i>italic</i>';
      const result = sanitizeUserInput(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    it('should block script injection', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should block onclick injection', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onerror');
    });

    it('should block javascript: URLs', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should block event handlers', () => {
      const input = '<div onmouseover="alert(1)">Hover me</div>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onmouseover');
    });

    it('should handle empty string', () => {
      const result = sanitizeUserInput('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const result = sanitizeUserInput('   \t\n  ');
      expect(result).toBe('   \t\n  ');
    });

    it('should handle Unicode characters', () => {
      const input = 'Hello 你好 مرحبا 👋';
      const result = sanitizeUserInput(input);
      expect(result).toBe(input);
    });

    it('should escape special characters in attributes', () => {
      const input = '<div class="test" onclick="evil()">Content</div>';
      const result = sanitizeUserInput(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('evil');
    });
  });

  describe('sanitizeAIOutput', () => {
    it('should allow plain text from AI', () => {
      const input = 'Here is some helpful advice.';
      const result = sanitizeAIOutput(input);
      expect(result).toBe(input);
    });

    it('should allow code blocks', () => {
      const input = 'Here is some code:\n```\nconsole.log("Hello");\n```';
      const result = sanitizeAIOutput(input);
      expect(result).toContain('console.log');
    });

    it('should allow numbered lists', () => {
      const input = 'Steps:\n1. First step\n2. Second step\n3. Third step';
      const result = sanitizeAIOutput(input);
      expect(result).toBe(input);
    });

    it('should allow bullet lists', () => {
      const input = 'Items:\n- Item one\n- Item two\n- Item three';
      const result = sanitizeAIOutput(input);
      expect(result).toBe(input);
    });

    it('should block executable scripts in AI output', () => {
      const input = 'Check this out: <script>stealCookies()</script>';
      const result = sanitizeAIOutput(input);
      expect(result).not.toContain('<script>');
    });

    it('should block onerror handlers in AI output', () => {
      const input = 'Error image: <img src="x" onerror="hack()">';
      const result = sanitizeAIOutput(input);
      expect(result).not.toContain('onerror');
    });

    it('should allow markdown-style links', () => {
      const input = 'Visit [our website](https://example.com) for more info.';
      const result = sanitizeAIOutput(input);
      expect(result).toContain('[our website]');
      expect(result).toContain('https://example.com');
    });

    it('should block javascript: links', () => {
      const input = 'Click [here](javascript:stealData()) to win!';
      const result = sanitizeAIOutput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle mixed content safely', () => {
      const input = 'Hello!\n\nHere is a <b>bold</b> statement.\n\n```\nconst x = 1;\n```\n\n<script>bad()</script>';
      const result = sanitizeAIOutput(input);
      expect(result).toContain('Hello');
      expect(result).toContain('<b>');
      expect(result).toContain('const x = 1');
      expect(result).not.toContain('<script>');
    });

    it('should handle empty string', () => {
      const result = sanitizeAIOutput('');
      expect(result).toBe('');
    });

    it('should allow international characters in AI output', () => {
      const input = '日本語のテキスト입니다。한국어 테스트。العربية';
      const result = sanitizeAIOutput(input);
      expect(result).toBe(input);
    });

    it('should handle newlines and spacing', () => {
      const input = 'Line 1\n\n\nLine 2\n\n\n\nLine 3';
      const result = sanitizeAIOutput(input);
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
    });
  });

  describe('sanitization consistency', () => {
    it('should have consistent behavior for user input vs AI output', () => {
      const dangerousInput = '<script>alert(1)</script>';
      const userResult = sanitizeUserInput(dangerousInput);
      const aiResult = sanitizeAIOutput(dangerousInput);
      
      expect(userResult).not.toContain('<script>');
      expect(aiResult).not.toContain('<script>');
    });

    it('should preserve valid markdown in AI output but not allow XSS', () => {
      const input = '# Title\n\n**Bold text**\n\n<script>bad()</script>';
      const result = sanitizeAIOutput(input);
      
      expect(result).toContain('# Title');
      expect(result).toContain('**Bold text**');
      expect(result).not.toContain('<script>');
    });
  });
});
