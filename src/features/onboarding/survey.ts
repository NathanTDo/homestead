import { MAX_ACTIVE_CROPS } from '@/features/crops';
import type { OnboardingData, Season } from '@/types';
import { getErrorMessage } from '@/utils/errors';

export const FARMING_TYPES = ['outdoor', 'indoor', 'greenhouse', 'mixed'] as const;
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const SEASONS: readonly Season[] = ['spring', 'summer', 'fall', 'winter'];

export type FarmingType = (typeof FARMING_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const MAX_LOCATION_LENGTH = 100;
export const MAX_FARM_NAME_LENGTH = 60;

export interface SurveyAnswers {
  farmingLocation: string;
  farmingType: FarmingType | null;
  seasons: Season[];
  /** Slugs of the catalog plants the user wants to start with (at most MAX_ACTIVE_CROPS). */
  produce: string[];
  experienceLevel: ExperienceLevel | null;
}

export const EMPTY_SURVEY: SurveyAnswers = {
  farmingLocation: '',
  farmingType: null,
  seasons: [],
  produce: [],
  experienceLevel: null,
};

/** Returns an error message, or null if the answers are valid. Location, seasons and produce are optional. */
export function validateSurvey(answers: SurveyAnswers): string | null {
  if (!answers.farmingType) return 'Choose a type of farming.';
  if (!answers.experienceLevel) return 'Choose your experience level.';
  if (answers.produce.length > MAX_ACTIVE_CROPS) {
    return `Choose up to ${MAX_ACTIVE_CROPS} crops to start with.`;
  }
  if (answers.farmingLocation.trim().length > MAX_LOCATION_LENGTH) {
    return `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateFarmName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Give your farm a name.';
  if (trimmed.length > MAX_FARM_NAME_LENGTH) {
    return `Farm name must be ${MAX_FARM_NAME_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Converts survey answers to the shape stored in profiles.onboarding_data (without `completed`). */
export function buildOnboardingData(answers: SurveyAnswers): OnboardingData {
  const location = answers.farmingLocation.trim();
  return {
    ...(location ? { farming_location: location } : {}),
    ...(answers.farmingType ? { farming_type: answers.farmingType } : {}),
    preferred_seasons: answers.seasons,
    interested_produce: answers.produce,
    ...(answers.experienceLevel ? { experience_level: answers.experienceLevel } : {}),
  };
}

/** Maps a create_farm_with_member error to a message for the user. */
export function describeCreateFarmError(error: unknown): string {
  const message = getErrorMessage(error);
  if (message.includes('invalid_farm_name')) return 'Enter a farm name up to 60 characters.';
  if (message.includes('not_authenticated')) return 'Your session expired. Sign in again.';
  if (message.includes('too_many_crops')) {
    return `Choose up to ${MAX_ACTIVE_CROPS} crops to start with.`;
  }
  if (message.includes('invalid_plant')) {
    return 'One of the crops you chose is no longer available. Go back and choose again.';
  }
  if (/network|fetch|connect|timed? ?out/i.test(message)) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return 'Could not create your farm. Try again.';
}

/** True when the error means this account has already finished onboarding. */
export function isAlreadyOnboardedError(error: unknown): boolean {
  return getErrorMessage(error).includes('already_onboarded');
}
