export function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  export function validatePhone(phone: string) {
    return /^\+?\d{10,15}$/.test(phone);
  }
  
  export function validateAmount(amount: number) {
    return typeof amount === "number" && amount > 0;
  }
  