import {
  EMPTY_SURVEY,
  buildOnboardingData,
  describeCreateFarmError,
  isAlreadyOnboardedError,
  validateFarmName,
  validateSurvey,
  type SurveyAnswers,
} from '../../src/features/onboarding/survey';

const valid: SurveyAnswers = {
  ...EMPTY_SURVEY,
  farmingType: 'outdoor',
  experienceLevel: 'beginner',
};

describe('validateSurvey', () => {
  it('accepts a type and experience level, leaving the rest optional', () => {
    expect(validateSurvey(valid)).toBeNull();
  });
  it('requires farming type and experience level', () => {
    expect(validateSurvey({ ...valid, farmingType: null })).toMatch(/type of farming/i);
    expect(validateSurvey({ ...valid, experienceLevel: null })).toMatch(/experience/i);
  });
  it('rejects a location over 100 characters', () => {
    expect(validateSurvey({ ...valid, farmingLocation: 'x'.repeat(101) })).toMatch(/100/);
  });
});

describe('validateFarmName', () => {
  it('trims before checking', () => {
    expect(validateFarmName('  Sunny Acres ')).toBeNull();
    expect(validateFarmName('   ')).toMatch(/name/i);
  });
  it('rejects names over 60 characters', () => {
    expect(validateFarmName('x'.repeat(61))).toMatch(/60/);
    expect(validateFarmName('x'.repeat(60))).toBeNull();
  });
});

describe('buildOnboardingData', () => {
  it('maps answers to the stored keys and trims the location', () => {
    expect(
      buildOnboardingData({
        farmingLocation: '  Oregon ',
        farmingType: 'mixed',
        seasons: ['spring', 'fall'],
        produce: ['Kale'],
        experienceLevel: 'advanced',
      }),
    ).toEqual({
      farming_location: 'Oregon',
      farming_type: 'mixed',
      preferred_seasons: ['spring', 'fall'],
      interested_produce: ['Kale'],
      experience_level: 'advanced',
    });
  });
  it('leaves out an empty location and never sets completed', () => {
    const data = buildOnboardingData(valid);
    expect(data).not.toHaveProperty('farming_location');
    expect(data).not.toHaveProperty('completed');
  });
});

describe('create farm errors', () => {
  it('maps known database errors to messages', () => {
    expect(describeCreateFarmError(new Error('invalid_farm_name'))).toMatch(/farm name/i);
    expect(describeCreateFarmError(new Error('not_authenticated'))).toMatch(/sign in/i);
    expect(describeCreateFarmError(new Error('Network request failed'))).toMatch(/connection/i);
    expect(describeCreateFarmError('weird')).toMatch(/try again/i);
  });
  it('detects the already-onboarded error', () => {
    expect(isAlreadyOnboardedError(new Error('already_onboarded'))).toBe(true);
    expect(isAlreadyOnboardedError(new Error('other'))).toBe(false);
    expect(isAlreadyOnboardedError(null)).toBe(false);
  });
});
