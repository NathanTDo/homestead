import { StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';

// Temporary placeholder. The real welcome and survey screens come in the next slice.
export default function WelcomeScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Homestead</Text>
      <Text style={styles.body}>Onboarding is coming soon.</Text>
      <Button title="Sign out" variant="link" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16, opacity: 0.7 },
});
