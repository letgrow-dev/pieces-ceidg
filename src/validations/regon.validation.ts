import { z } from "zod";

export function isValidREGON(regon: string): boolean {
  if (regon === "") return true;
  if (typeof regon !== "string") return false;

  const regonLength = regon.length;

  if (regonLength !== 9 && regonLength !== 14) {
    return false;
  }

  const weights9 = [8, 9, 2, 3, 4, 5, 6, 7];
  const weights14 = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

  let sum = 0;
  let controlDigit: number;

  if (regonLength === 9) {
    for (let i = 0; i < 8; i++) {
      const digit = parseInt(regon[i], 10);
      if (isNaN(digit)) {
        return false;
      }
      sum += digit * weights9[i];
    }
    controlDigit = parseInt(regon[8], 10);
  } else { 
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(regon[i], 10);
      if (isNaN(digit)) {
        return false;
      }
      sum += digit * weights14[i];
    }
    controlDigit = parseInt(regon[13], 10);
  }

  if (isNaN(controlDigit)) {
    return false;
  }

  const calculatedControlDigit = sum % 11 === 10 ? 0 : sum % 11;
  return calculatedControlDigit === controlDigit;
}

export const regonSchema = z.string().refine(isValidREGON, {
  message: "Invalid REGON number",
});