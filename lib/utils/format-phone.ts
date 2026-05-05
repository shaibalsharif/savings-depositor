export function formatPhoneNumber(phone: string | null | undefined) {
  if (!phone) return "—";
  
  // Remove all non-numeric characters
  const clean = phone.replace(/\D/g, "");
  
  // If it starts with 880, it already has the country code
  if (clean.startsWith("880") && clean.length === 13) {
    return `+${clean}`;
  }
  
  // If it starts with 0 and is 11 digits (typical BD number), add +88
  if (clean.startsWith("0") && clean.length === 11) {
    return `+88${clean}`;
  }

  // If it's just 10 digits and doesn't start with 0, assume it's a BD number without the leading 0
  if (clean.length === 10 && !clean.startsWith("0")) {
    return `+880${clean}`;
  }

  // Default: just add + if it doesn't have one, or return as is if it looks like a full number
  return phone.startsWith("+") ? phone : `+${phone}`;
}
