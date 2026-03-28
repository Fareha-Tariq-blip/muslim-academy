export const ACADEMY_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@muslimacademy\.com$/;

export const validateAcademyEmail = (email: string): string | null => {
  if (!ACADEMY_EMAIL_REGEX.test(email)) {
    return 'Email must follow the format: name@muslimacademy.com';
  }
  return null;
};

export const PASSWORD_RULES = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < PASSWORD_RULES.minLength) errors.push('At least 8 characters');
  if (!PASSWORD_RULES.hasUppercase.test(password)) errors.push('At least one uppercase letter');
  if (!PASSWORD_RULES.hasLowercase.test(password)) errors.push('At least one lowercase letter');
  if (!PASSWORD_RULES.hasNumber.test(password)) errors.push('At least one number');
  if (!PASSWORD_RULES.hasSpecial.test(password)) errors.push('At least one special character');
  return errors;
};
