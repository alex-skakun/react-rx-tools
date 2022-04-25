import isDefined from './isDefined';


describe('isDefined()', () => {

  it('should return false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });

  it('should return true for zero', () => {
    expect(isDefined(0)).toBe(true);
  });

  it('should return true for NaN', () => {
    expect(isDefined(NaN)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isDefined('')).toBe(true);
  });

  it('should return true for any boolean', () => {
    expect(isDefined(true)).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

});
