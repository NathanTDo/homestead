import { validateSignIn, validateSignUp } from '../../src/features/auth/validation';

describe('validateSignIn', () => {
  it('accepts a valid email and any non-empty password', () => {
    expect(validateSignIn('a@b.co', 'x')).toBeNull();
    expect(validateSignIn('  a@b.co  ', 'x')).toBeNull();
  });
  it('rejects a bad email or empty password', () => {
    expect(validateSignIn('nope', 'x')).toMatch(/email/i);
    expect(validateSignIn('a@b.co', '')).toMatch(/password/i);
  });
});

describe('validateSignUp', () => {
  it('accepts valid input', () => {
    expect(validateSignUp('a@b.co', 'secret1', 'Sam')).toBeNull();
  });
  it('requires a name, trimmed, within the length limit', () => {
    expect(validateSignUp('a@b.co', 'secret1', '   ')).toMatch(/name/i);
    expect(validateSignUp('a@b.co', 'secret1', 'x'.repeat(51))).toMatch(/50/);
  });
  it('requires a valid email and a password of at least 6 characters', () => {
    expect(validateSignUp('bad', 'secret1', 'Sam')).toMatch(/email/i);
    expect(validateSignUp('a@b.co', '12345', 'Sam')).toMatch(/6/);
  });
});
