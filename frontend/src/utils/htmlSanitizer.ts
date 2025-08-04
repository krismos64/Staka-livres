/**
 * Simple HTML sanitizer for trusted admin content
 * Preserves basic formatting while preventing potential XSS
 */

const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'];
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel']
};

/**
 * Basic HTML sanitization for trusted admin content
 * Note: This is for admin-generated content only. For user-generated content, use a proper library like DOMPurify
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Remove script tags and their content
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
  
  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\s(onclick|onload|onerror|onmouseover|onfocus|onblur|onchange|onsubmit|onreset)=[^>\s]*/gi, '');
  
  // Remove javascript: protocol from attributes
  sanitized = sanitized.replace(/(href|src)=["']javascript:[^"']*["']/gi, '');
  
  // Basic validation: only allow specific tags
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.includes(tag)) {
      return ''; // Remove non-allowed tags
    }
    
    // For allowed tags, sanitize attributes
    if (ALLOWED_ATTRIBUTES[tag]) {
      const allowedAttrs = ALLOWED_ATTRIBUTES[tag];
      const attrRegex = /(\w+)=["']([^"']*)["']/g;
      return match.replace(attrRegex, (attrMatch, attrName, attrValue) => {
        if (allowedAttrs.includes(attrName.toLowerCase())) {
          // Sanitize href attributes
          if (attrName.toLowerCase() === 'href') {
            if (attrValue.startsWith('javascript:') || attrValue.startsWith('data:') || attrValue.includes('<script')) {
              return '';
            }
          }
          return attrMatch;
        }
        return '';
      });
    }
    
    return match;
  });
  
  return sanitized;
};

/**
 * Format text content to HTML with sanitization
 * Used for admin pages and content
 */
export const formatContentToHtmlSafe = (text: string): string => {
  if (!text) return "";

  const titleRegex = /^\d+\.\s|:\s*$/;
  const definitionRegex = /^(\w+\s*et\s*\w+|\w+)\s*:/;

  const formatted = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => {
      const lines = block.split("\n");
      const firstLine = lines[0];

      // Escape HTML entities in user input first
      const escapeHtml = (str: string) => 
        str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#x27;');

      if (titleRegex.test(firstLine)) {
        return `<h3>${escapeHtml(firstLine)}</h3><p>${lines.slice(1).map(escapeHtml).join("<br />")}</p>`;
      }

      const match = firstLine.match(definitionRegex);
      if (match) {
        const term = match[1];
        const restOfLine = firstLine.substring(match[0].length).trim();
        const definition = [restOfLine, ...lines.slice(1)].map(escapeHtml).join("<br />");
        return `<p><strong>${escapeHtml(term)} :</strong> ${definition}</p>`;
      }

      return `<p>${lines.map(escapeHtml).join("<br />")}</p>`;
    })
    .join("");

  return sanitizeHtml(formatted);
};

/**
 * Simple sanitizer for basic admin content (just line breaks)
 */
export const sanitizeBasicHtml = (content: string): string => {
  if (!content) return '';
  
  // Escape HTML entities first
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Then allow line breaks
  return escaped.replace(/\n/g, "<br />");
};