export const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]*$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validateName(name: string, fieldName = 'Name'): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, periods, apostrophes, or hyphens`,
    };
  }
  return { isValid: true, error: null };
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: null };
}

export function validateMobileNumber(mobile: string): ValidationResult {
  const normalized = normalizeIndianMobile(mobile);
  if (!INDIAN_MOBILE_REGEX.test(normalized)) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
    };
  }
  return { isValid: true, error: null };
}

export function validateDob(dob: string, minAgeYears = 6): ValidationResult {
  if (!dob) {
    return { isValid: false, error: 'Please select a date of birth' };
  }

  const parts = dob.split('-');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const [year, month, day] = parts.map(Number);
  const birthDate = new Date(year, month - 1, day);
  const minimumAllowedDate = new Date();
  minimumAllowedDate.setFullYear(minimumAllowedDate.getFullYear() - minAgeYears);

  const isValidDate =
    !Number.isNaN(birthDate.getTime()) &&
    birthDate.getFullYear() === year &&
    birthDate.getMonth() === month - 1 &&
    birthDate.getDate() === day;

  if (!isValidDate) {
    return { isValid: false, error: 'Invalid date of birth' };
  }

  if (birthDate > minimumAllowedDate) {
    return {
      isValid: false,
      error: `Date of birth must be at least ${minAgeYears} years old`,
    };
  }

  return { isValid: true, error: null };
}

export interface SignupInputData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  role: string;
  guardianName?: string;
  dob: string;
  locationId: string;
}

export function validateSignupData(
  data: SignupInputData,
  isFromAdmin = false
): ValidationResult {
  const {
    email,
    password,
    firstName,
    lastName,
    mobileNumber,
    role,
    guardianName,
    dob,
    locationId,
  } = data;

  if (
    !email ||
    (!password && !isFromAdmin) ||
    !firstName ||
    !lastName ||
    !mobileNumber ||
    (role === 'parent' && !guardianName) ||
    !dob ||
    !locationId
  ) {
    return { isValid: false, error: 'Please fill in all required fields' };
  }

  const firstNameVal = validateName(
    firstName,
    role === 'parent' ? 'Player First Name' : 'First Name'
  );
  if (!firstNameVal.isValid) return firstNameVal;

  const lastNameVal = validateName(
    lastName,
    role === 'parent' ? 'Player Last Name' : 'Last Name'
  );
  if (!lastNameVal.isValid) return lastNameVal;

  if (role === 'parent') {
    const guardianVal = validateName(guardianName ?? '', 'Guardian Name');
    if (!guardianVal.isValid) return guardianVal;
  }

  const emailVal = validateEmail(email);
  if (!emailVal.isValid) return emailVal;

  const mobileVal = validateMobileNumber(mobileNumber);
  if (!mobileVal.isValid) return mobileVal;

  const dobVal = validateDob(dob, 6);
  if (!dobVal.isValid) return dobVal;

  return { isValid: true, error: null };
}
