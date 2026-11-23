import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, FormField } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { useAuth } from '@/features/auth';
import { useFarm } from '@/features/farm';
import {
  describeLocationError,
  MAX_LOCATION_LENGTH,
  validateLocation,
} from '@/features/onboarding';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut } = useAuth();
  const { farm, setLocation } = useFarm();
  const email = profile?.email ?? session?.user.email ?? '';
  const name = profile?.display_name ?? email;

  const saved = farm.location ?? '';
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const changed = draft.trim() !== saved;

  const saveLocation = async () => {
    const invalid = validateLocation(draft);
    if (invalid) return setMessage({ text: invalid, isError: true });
    setSaving(true);
    setMessage(null);
    try {
      await setLocation(draft);
      setDraft(draft.trim());
      setMessage({ text: 'Location saved.', isError: false });
    } catch (error) {
      setMessage({ text: describeLocationError(error), isError: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text accessibilityRole="header" style={styles.screenTitle}>
        Profile
      </Text>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>{email}</Text>
        <Text style={styles.farm}>{farm.name}</Text>
        <View style={styles.location}>
          <FormField
            label="Farm location"
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setMessage(null);
            }}
            placeholder="Zip code or city, e.g. 94103"
            maxLength={MAX_LOCATION_LENGTH}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={changed ? saveLocation : undefined}
          />
          {message ? (
            <Text
              accessibilityRole={message.isError ? 'alert' : undefined}
              style={message.isError ? styles.error : styles.success}
            >
              {message.text}
            </Text>
          ) : null}
          <Button
            title="Save location"
            onPress={saveLocation}
            loading={saving}
            disabled={!changed}
          />
        </View>
        <View style={styles.actions}>
          <Button title="Sign out" onPress={signOut} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  screenTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 14, opacity: 0.6, marginTop: 8 },
  farm: { fontSize: 16, marginTop: 20 },
  location: { marginTop: 24, alignSelf: 'stretch' },
  error: { color: palette.danger, marginBottom: 12 },
  success: { opacity: 0.8, marginBottom: 12 },
  actions: { marginTop: 24, alignSelf: 'stretch' },
});
