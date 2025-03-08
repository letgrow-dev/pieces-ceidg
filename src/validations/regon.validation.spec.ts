import { isValidREGON } from './regon.validation';

const validRegons = ["380186266"];
const invalidRegons = ["123456788", "14144436900011", "12345678"];

for (const regon of validRegons) {
    it(`should return true for valid REGON ${regon}`, () => {
        expect(isValidREGON(regon)).toBe(true);
    })
}

for (const regon of invalidRegons) { 
it(`should return false for invalid REGON ${regon}`, () => { 
    expect(isValidREGON(regon)).toBe(false);
})
}