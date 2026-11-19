import { describeAuthError } from '../../src/features/auth/errors';
import { isNetworkError } from '../../src/utils/errors';

describe('isNetworkError', () => {
  it.each([
    new Error('Network request failed'),
    new TypeError('Failed to fetch'),
    { message: 'fetch failed' },
    { message: 'Load failed' },
    new Error('Request timed out'),
    new Error('getaddrinfo ENOTFOUND example.com'),
    new Error('The Internet connection appears to be offline.'),
  ])('recognises %p', (error) => {
    expect(isNetworkError(error)).toBe(true);
  });

  it.each([
    new Error('A farm cannot have more than 5 active or planned crops'),
    { message: 'duplicate key value violates unique constraint' },
    new Error('invalid_farm_name'),
    null,
    undefined,
    'text',
    {},
  ])('does not treat %p as a network problem', (error) => {
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('describeAuthError', () => {
  it('explains network failures', () => {
    expect(describeAuthError(new Error('Network request failed'), 'sign in')).toMatch(
      /connection/i,
    );
  });
  it('explains wrong credentials and existing accounts', () => {
    expect(describeAuthError({ message: 'Invalid login credentials' }, 'sign in')).toBe(
      'Incorrect email or password.',
    );
    expect(describeAuthError({ message: 'User already registered' }, 'sign up')).toMatch(
      /already exists/i,
    );
  });
  it('explains rate limits and weak passwords', () => {
    expect(describeAuthError({ message: 'email rate limit exceeded' }, 'sign up')).toMatch(
      /too many/i,
    );
    expect(
      describeAuthError({ message: 'Password should be at least 6 characters' }, 'sign up'),
    ).toMatch(/longer/i);
  });
  it('falls back to a message naming the action', () => {
    expect(describeAuthError(new Error('weird'), 'sign in')).toBe('Could not sign in. Try again.');
    expect(describeAuthError(undefined, 'sign up')).toBe('Could not sign up. Try again.');
  });
});
