// Simple but effective XSS sanitizer - no dependencies needed
export function sanitize(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Don't sanitize base64 images, passwords, or emails
      if (key === "password" || key === "profilePhoto" || key === "image" || key === "photo" ||
          key === "verificationPhoto" || key === "idDocument" || value.startsWith("data:") ||
          value.startsWith("[IMG]") || value.startsWith("[VID]") || value.startsWith("[VOICE]")) {
        clean[key] = value;
      } else {
        clean[key] = sanitize(value.trim());
      }
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone (digits only, 7-15 chars after code)
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// Validate username (3-20 chars, lowercase, numbers, underscores)
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

// Check for suspicious content (SQL injection, XSS attempts)
export function isSuspicious(input: string): boolean {
  const patterns = [
    /<script/i, /javascript:/i, /on\w+\s*=/i, /eval\(/i,
    /union\s+select/i, /drop\s+table/i, /insert\s+into/i,
    /--\s*$/, /\/\*.*\*\//
  ];
  return patterns.some(p => p.test(input));
}
