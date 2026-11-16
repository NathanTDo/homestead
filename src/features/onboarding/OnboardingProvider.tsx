import { createContext, useContext, useMemo, useState } from 'react';
import { EMPTY_SURVEY, type SurveyAnswers } from './survey';

interface OnboardingContextValue {
  answers: SurveyAnswers;
  updateAnswers: (changes: Partial<SurveyAnswers>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/** Keeps survey answers while the user moves between onboarding screens. */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<SurveyAnswers>(EMPTY_SURVEY);
  const value = useMemo<OnboardingContextValue>(
    () => ({
      answers,
      updateAnswers: (changes) => setAnswers((current) => ({ ...current, ...changes })),
    }),
    [answers],
  );
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used inside <OnboardingProvider>.');
  return value;
}
