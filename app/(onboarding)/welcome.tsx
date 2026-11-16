import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const name = profile?.display_name;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name ? `Welcome, ${name}` : 'Welcome to Homestead'}</Text>
      <Text style={styles.body}>
        Answer a few questions about your farm, then pick the crops you want to grow. It takes about
        a minute.
      </Text>
      <View style={styles.actions}>
        <Button title="Get started" onPress={() => router.push('/survey')} />
        <Button title="Sign out" variant="link" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  body: { fontSize: 16, opacity: 0.8, lineHeight: 22 },
  actions: { marginTop: 32, gap: 8 },
});
