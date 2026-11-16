import { Redirect } from 'expo-router';

// "/" has to resolve inside this group, or new users land on "not found".
export default function OnboardingIndex() {
  return <Redirect href="/welcome" />;
}
