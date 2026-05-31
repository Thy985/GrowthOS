const DANGEROUS_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  eventHandler: /\bon\w+\s*=/gi,
  javascript: /javascript\s*:/gi,
  dataUri: /data\s*:/gi,
  expression: /expression\s*\(/gi,
  vbscript: /vbscript\s*:/gi,
  iframe: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  object: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  embed: /<embed\b[^>]*>/gi,
  applet: /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  form: /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  svg: /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  math: /<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi,
  imgOnerror: /<img\b[^>]*onerror\s*=/gi,
  styleInjection: /<\s*style\b[^>]*>[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi
};

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function escapeHtml(text: string): string {
  return text
    .replace(/[&<>"'`=/]/g, char => HTML_ESCAPE_MAP[char] || char);
}

export function unescapeHtml(text: string): string {
  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };

  return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, 
    entity => unescapeMap[entity] || entity
  );
}

export function stripHtml(html: string): string {
  return html
    .replace(DANGEROUS_PATTERNS.script, '')
    .replace(DANGEROUS_PATTERNS.iframe, '')
    .replace(DANGEROUS_PATTERNS.object, '')
    .replace(DANGEROUS_PATTERNS.embed, '')
    .replace(DANGEROUS_PATTERNS.applet, '')
    .replace(DANGEROUS_PATTERNS.svg, '')
    .replace(DANGEROUS_PATTERNS.math, '')
    .replace(DANGEROUS_PATTERNS.styleInjection, '')
    .replace(/<[^>]+>/g, '');
}

export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[],
  allowedAttrs?: string[],
  stripAll?: boolean,
}): string {
  const {
    allowedTags = [],
    allowedAttrs = [],
    stripAll = false
  } = options || {};

  if (stripAll) {
    return escapeHtml(stripHtml(html));
  }

  let sanitized = html;

  const allTags = stripHtml(html).split(/<[^>]+>/).filter(Boolean);
  sanitized = allTags.join('');

  if (allowedTags.length > 0) {
    const tagPattern = new RegExp(`</?(${allowedTags.join('|')})\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(tagPattern, match => match);
  }

  if (allowedAttrs.length > 0) {
    const attrPattern = new RegExp(`\\s(${allowedAttrs.join('|')})\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(attrPattern, '');
  }

  Object.entries(DANGEROUS_PATTERNS).forEach(([, pattern]) => {
    sanitized = sanitized.replace(pattern, '');
  });

  return escapeHtml(sanitized);
}

export function hasDangerousContent(text: string): boolean {
  return Object.values(DANGEROUS_PATTERNS).some(pattern => 
    pattern.test(text)
  );
}

export function detectXSSAttempt(text: string): {
  hasXSS: boolean,
  risks: string[],
} {
  const risks: string[] = [];

  if (DANGEROUS_PATTERNS.script.test(text)) {
    risks.push('script标签');
  }
  if (DANGEROUS_PATTERNS.eventHandler.test(text)) {
    risks.push('事件处理器');
  }
  if (DANGEROUS_PATTERNS.javascript.test(text)) {
    risks.push('JavaScript协议');
  }
  if (DANGEROUS_PATTERNS.dataUri.test(text)) {
    risks.push('Data URI');
  }
  if (DANGEROUS_PATTERNS.iframe.test(text)) {
    risks.push('iframe标签');
  }
  if (DANGEROUS_PATTERNS.imgOnerror.test(text)) {
    risks.push('图片onerror');
  }

  return {
    hasXSS: risks.length > 0,
    risks
  };
}

export function sanitizeForStorage(text: string): string {
  return sanitizeHtml(text, { stripAll: true });
}

export function sanitizeForDisplay(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li'],
    allowedAttrs: [],
    stripAll: false
  });
}

export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();
  
  const allowedProtocols = ['https:', 'http:'];
  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '#';
    }
    return parsed.href;
  } catch {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return '#';
  }
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9_.\-\s\u4e00-\u9fa5]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\.+/, '')
    .substring(0, 255);
}

export class InputSanitizer {
  static sanitizeRecord(data: {
    activity?: string,
    learning?: string,
    reflection?: string,
    tags?: string[],
  }): {
    activity?: string,
    learning?: string,
    reflection?: string,
    tags?: string[],
  } {
    return {
      activity: data.activity ? sanitizeForStorage(data.activity) : undefined,
      learning: data.learning ? sanitizeForStorage(data.learning) : undefined,
      reflection: data.reflection ? sanitizeForStorage(data.reflection) : undefined,
      tags: data.tags?.map(tag => sanitizeForStorage(tag).toLowerCase())
    };
  }

  static sanitizeSearch(query: string): string {
    return query
      .trim()
      .substring(0, 200)
      .replace(/[<>]/g, '');
  }

  static sanitizeName(name: string): string {
    return name
      .trim()
      .substring(0, 100)
      .replace(/[<>]/g, '');
  }
}
