import { getErrorMessage } from '@/utils/errors';

/** Most planned or active crops a farm can have. Also enforced by a database trigger. */
export const MAX_ACTIVE_CROPS = 5;

export function remainingSlots(cropCount: number): number {
  return Math.max(0, MAX_ACTIVE_CROPS - cropCount);
}

export function canAddCrop(cropCount: number): boolean {
  return cropCount < MAX_ACTIVE_CROPS;
}

/** Turns an error from adding or removing a crop into a message for the user. */
export function describeCropError(error: unknown): string {
  const message = getErrorMessage(error);
  if (/more than 5/i.test(message)) {
    return `You can have up to ${MAX_ACTIVE_CROPS} crops. Remove one to add another.`;
  }
  if (/network|fetch|connect|timed? ?out/i.test(message)) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Try again.';
}
