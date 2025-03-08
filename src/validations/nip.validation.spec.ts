const validNips = ["5260250274"];
const invalidNips = ["1234567890", "5260250275", "123456789"];

import { isValidNIP } from './nip.validation';

for (const nip of validNips) {
  it(`should return true for valid NIP ${nip}`, () => {
    expect(isValidNIP(nip)).toBe(true);
  });
}

for (const nip of invalidNips) {
  it(`should return false for invalid NIP ${nip}`, () => {
    expect(isValidNIP(nip)).toBe(false);
  })
}