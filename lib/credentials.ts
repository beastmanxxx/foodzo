const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 100;

type ValidationFailure = {
  success: false;
  error: string;
};

export type SignupValidationSuccess = {
  success: true;
  username: string;
  email: string;
  phone: string;
  password: string;
  normalizedUsername: string;
  normalizedEmail: string;
  normalizedPhone: string;
};

export type SigninValidationSuccess = (
  | {
      success: true;
      mode: "email";
      identifier: string;
      password: string;
      normalizedEmail: string;
    }
  | {
      success: true;
      mode: "phone";
      identifier: string;
      password: string;
      normalizedPhone: string;
    }
);

export type SignupValidationResult = SignupValidationSuccess | ValidationFailure;
export type SigninValidationResult = SigninValidationSuccess | ValidationFailure;

export function validateSignupPayload(payload: unknown): SignupValidationResult {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Invalid request body." };
  }

  const { username, email, phone, password } = payload as Record<string, unknown>;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof phone !== "string" ||
    typeof password !== "string"
  ) {
    return { success: false, error: "All fields are required." };
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();
  const trimmedPassword = password;

  if (!trimmedUsername) {
    return { success: false, error: "Username cannot be empty." };
  }

  if (trimmedUsername.length < MIN_USERNAME_LENGTH) {
    return {
      success: false,
      error: `Username must be at least ${MIN_USERNAME_LENGTH} characters long.`,
    };
  }

  if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
    return {
      success: false,
      error: `Username must be at most ${MAX_USERNAME_LENGTH} characters long.`,
    };
  }

  if (!USERNAME_REGEX.test(trimmedUsername)) {
    return {
      success: false,
      error: "Username can only contain letters, numbers, and underscores.",
    };
  }

  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return { success: false, error: "Please provide a valid email address." };
  }

  if (!trimmedPhone || !PHONE_REGEX.test(trimmedPhone)) {
    return {
      success: false,
      error: "Please provide a valid phone number (7-15 digits, optional +).",
    };
  }

  if (!trimmedPassword) {
    return { success: false, error: "Password cannot be empty." };
  }

  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long.`,
    };
  }

  const normalizedPhone = trimmedPhone.replace(/[^0-9+]/g, "");

  return {
    success: true,
    username: trimmedUsername,
    email: trimmedEmail,
    phone: trimmedPhone,
    password: trimmedPassword,
    normalizedUsername: trimmedUsername.toLowerCase(),
    normalizedEmail: trimmedEmail,
    normalizedPhone,
  };
}

export function validateSigninPayload(payload: unknown): SigninValidationResult {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Invalid request body." };
  }

  const { identifier, password } = payload as Record<string, unknown>;

  if (typeof identifier !== "string" || typeof password !== "string") {
    return { success: false, error: "Identifier and password are required." };
  }

  const trimmedIdentifier = identifier.trim();
  const trimmedPassword = password;

  if (!trimmedIdentifier) {
    return { success: false, error: "Enter your email address or phone number." };
  }

  if (!trimmedPassword) {
    return { success: false, error: "Password cannot be empty." };
  }

  if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (EMAIL_REGEX.test(trimmedIdentifier.toLowerCase())) {
    return {
      success: true,
      mode: "email",
      identifier: trimmedIdentifier,
      password: trimmedPassword,
      normalizedEmail: trimmedIdentifier.toLowerCase(),
    };
  }

  const normalizedPhone = trimmedIdentifier.replace(/[^0-9+]/g, "");
  if (PHONE_REGEX.test(normalizedPhone)) {
    return {
      success: true,
      mode: "phone",
      identifier: trimmedIdentifier,
      password: trimmedPassword,
      normalizedPhone,
    };
  }

  return {
    success: false,
    error: "Enter a valid email address or phone number.",
  };
}
