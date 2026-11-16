import {
  MAX_ACTIVE_CROPS,
  canAddCrop,
  describeCropError,
  remainingSlots,
} from '../../src/features/crops/limits';
import { getErrorMessage } from '../../src/utils/errors';

describe('crop limit', () => {
  it('allows 5 crops', () => {
    expect(MAX_ACTIVE_CROPS).toBe(5);
  });
  it('counts remaining slots, never below zero', () => {
    expect(remainingSlots(0)).toBe(5);
    expect(remainingSlots(4)).toBe(1);
    expect(remainingSlots(5)).toBe(0);
    expect(remainingSlots(7)).toBe(0);
  });
  it('allows adding only below the limit', () => {
    expect(canAddCrop(4)).toBe(true);
    expect(canAddCrop(5)).toBe(false);
  });
});

describe('describeCropError', () => {
  it('explains the database limit error', () => {
    const dbError = { message: 'A farm cannot have more than 5 active or planned crops' };
    expect(describeCropError(dbError)).toMatch(/up to 5 crops/);
    expect(describeCropError(new Error(dbError.message))).toMatch(/up to 5 crops/);
  });
  it('explains network errors and falls back for unknown ones', () => {
    expect(describeCropError(new Error('Network request failed'))).toMatch(/connection/i);
    expect(describeCropError({ message: 'TypeError: Failed to fetch' })).toMatch(/connection/i);
    expect(describeCropError(undefined)).toMatch(/try again/i);
  });
});

describe('getErrorMessage', () => {
  it('reads Error objects, plain objects with a message, and ignores everything else', () => {
    expect(getErrorMessage(new Error('a'))).toBe('a');
    expect(getErrorMessage({ message: 'b' })).toBe('b');
    expect(getErrorMessage({ message: 5 })).toBe('');
    expect(getErrorMessage(null)).toBe('');
    expect(getErrorMessage('text')).toBe('');
  });
});
