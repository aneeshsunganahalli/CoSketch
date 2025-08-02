import validator from 'validator';

export class ValidationUtils {
  // Sanitize and validate name
  static validateName(name: string): { isValid: boolean; error?: string; sanitized?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: "Name is required" };
    }

    const sanitized = name.trim();
    
    if (sanitized.length < 2) {
      return { isValid: false, error: "Name must be at least 2 characters long" };
    }
    
    if (sanitized.length > 50) {
      return { isValid: false, error: "Name must be less than 50 characters long" };
    }

    // Check for potentially malicious characters
    if (/<[^>]*>|javascript:|data:|vbscript:/i.test(sanitized)) {
      return { isValid: false, error: "Name contains invalid characters" };
    }

    return { isValid: true, sanitized };
  }

  // Validate and normalize email
  static validateEmail(email: string): { isValid: boolean; error?: string; normalized?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: "Email is required" };
    }

    const normalized = email.toLowerCase().trim();
    
    if (!validator.isEmail(normalized)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }

    // Additional email security checks
    if (normalized.length > 254) {
      return { isValid: false, error: "Email address is too long" };
    }

    return { isValid: true, normalized };
  }

  // Enhanced password validation
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: "Password is required" };
    }

    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters long" };
    }

    if (password.length > 128) {
      return { isValid: false, error: "Password must be less than 128 characters long" };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return { 
        isValid: false, 
        error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
      };
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '12345678', 'qwerty123', 'admin123', 'welcome123'
    ];
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      return { isValid: false, error: "Password is too common. Please choose a stronger password" };
    }

    return { isValid: true };
  }

  // Sanitize general text input
  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .substring(0, maxLength)
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  }
}

export default ValidationUtils;
