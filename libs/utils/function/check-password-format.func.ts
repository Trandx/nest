export const validatePasswordFormat = (password: string | null): string | null => {
    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must include at least one uppercase letter.";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must include at least one lowercase letter.";
    }
    if (!/\d/.test(password)) {
      return "Password must include at least one number.";
    }
    if (!/[@$!%*?&.]/.test(password)) {
      return "Password must include at least one special character (@$!%*?&.).";
    }
    return null; // Valid password
  };