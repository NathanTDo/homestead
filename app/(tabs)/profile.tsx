import { StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const name = profile?.display_name ?? session?.user.email ?? '';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>{profile?.email ?? session?.user.email}</Text>
      <View style={styles.actions}>
        <Button title="Sign out" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 8 },
  actions: { marginTop: 24, alignSelf: 'stretch' },
});
