import { StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';
import { useFarm } from '@/features/farm';

export default function ProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const { farm } = useFarm();
  const email = profile?.email ?? session?.user.email ?? '';
  const name = profile?.display_name ?? email;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.subtitle}>{email}</Text>
      <Text style={styles.farm}>{farm.name}</Text>
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
  farm: { fontSize: 16, marginTop: 20 },
  actions: { marginTop: 24, alignSelf: 'stretch' },
});
