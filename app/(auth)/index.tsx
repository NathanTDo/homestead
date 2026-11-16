import { Redirect } from 'expo-router';

// "/" has to resolve inside this group, or signed-out users land on "not found".
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
