import { z } from "zod";

export function isValidNIP (nip: string) : boolean {
  if (typeof nip !== "string" || nip.length !== 10) {
    return false;
  }

  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const digit = parseInt(nip[i], 10);

    if (isNaN(digit)) {
      return false;
    }

    sum += digit * weights[i];
  }

  const controlDigit = parseInt(nip[9], 10);

  if (isNaN(controlDigit)) {
    return false;
  }

  return sum % 11 === controlDigit;
}

export const nipSchema = z.string().refine(isValidNIP, {
  message: "Invalid NIP number",
});