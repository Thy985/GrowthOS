const ALLOWED_TAGS = new Set([
  'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'strong'
]);

const ALLOWED_ATTRS = new Set(['href', 'class']);

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];
const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITY_MAP[char] || char);
}

function sanitizeUrl(url: string): string {
  const lowerUrl = url.toLowerCase().trim();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return '#';
    }
  }
  return url;
}

function sanitizeAttribute(value: string): string {
  const trimmed = value.trim().toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  return escapeHtml(value);
}

export function sanitizeHtml(html: string): string {
  const stack: string[] = [];
  let result = '';
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) {
        result += escapeHtml(html[i]);
        i++;
        continue;
      }

      const tagContent = html.slice(i + 1, tagEnd);
      const isClosingTag = tagContent.startsWith('/');
      const tagNameMatch = tagContent.match(/^(\/?)([a-zA-Z][a-zA-Z0-9]*)/);

      if (tagNameMatch) {
        const [, slash, tagName] = tagNameMatch;
        const lowerTag = tagName.toLowerCase();

        if (isClosingTag || slash) {
          if (ALLOWED_TAGS.has(lowerTag)) {
            if (!isClosingTag && !slash) {
              const attrPart = tagContent.slice(tagName.length);
              let sanitizedAttrs = '';
              
              const attrRegex = /([a-zA-Z-]+)(?:=["']([^"']*)["'])?/g;
              let attrMatch;
              while ((attrMatch = attrRegex.exec(attrPart)) !== null) {
                const [_, attrName, attrValue] = attrMatch;
                if (ALLOWED_ATTRS.has(attrName.toLowerCase())) {
                  if (attrName.toLowerCase() === 'href' && attrValue) {
                    sanitizedAttrs += ` ${attrName}="${sanitizeUrl(attrValue)}"`;
                  } else if (attrValue) {
                    sanitizedAttrs += ` ${attrName}="${sanitizeAttribute(attrValue)}"`;
                  }
                }
              }
              
              result += `<${lowerTag}${sanitizedAttrs}>`;
              stack.push(lowerTag);
            } else {
              result += `</${lowerTag}>`;
            }
          }
        } else {
          if (ALLOWED_TAGS.has(lowerTag)) {
            let sanitizedAttrs = '';
            
            const attrRegex = /([a-zA-Z-]+)(?:=["']([^"']*)["'])?/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(tagContent.slice(tagName.length))) !== null) {
              const [_, attrName, attrValue] = attrMatch;
              if (ALLOWED_ATTRS.has(attrName.toLowerCase())) {
                if (attrName.toLowerCase() === 'href' && attrValue) {
                  sanitizedAttrs += ` ${attrName}="${sanitizeUrl(attrValue)}"`;
                } else if (attrValue !== undefined) {
                  sanitizedAttrs += ` ${attrName}="${sanitizeAttribute(attrValue)}"`;
                }
              }
            }
            
            result += `<${lowerTag}${sanitizedAttrs}>`;
            stack.push(lowerTag);
          }
        }
      }
      
      i = tagEnd + 1;
    } else {
      result += html[i];
      i++;
    }
  }

  return result;
}

export function escapeText(text: string): string {
  return escapeHtml(text);
}

export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return escapeHtml(input.trim()).slice(0, 4000);
}

export function sanitizeAIOutput(output: string): string {
  if (!output || typeof output !== 'string') {
    return '';
  }
  return sanitizeHtml(output);
}

export function createMarkup(content: string): { __html: string } {
  return { __html: sanitizeAIOutput(content) };
}
