export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email ?? '');
};

export const validatePassword = (password: string): boolean => {
  return (password ?? '').length >= 6;
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = (phone ?? '').replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

export const validateCEP = (cep: string): boolean => {
  const cleaned = (cep ?? '').replace(/\D/g, '');
  return cleaned.length === 8;
};

export const validateRequired = (value: string): boolean => {
  return (value ?? '').trim().length > 0;
};
