import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, FormField } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';
import {
  MAX_FARM_NAME_LENGTH,
  buildOnboardingData,
  describeCreateFarmError,
  isAlreadyOnboardedError,
  useOnboarding,
  validateFarmName,
} from '@/features/onboarding';
import * as farmRepository from '@/repositories/farmRepository';
import { palette } from '@/constants/Colors';

export default function FarmNameScreen() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { answers } = useOnboarding();
  const [farmName, setFarmName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    const validationError = validateFarmName(farmName);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await farmRepository.createFarmWithMember(farmName.trim(), buildOnboardingData(answers));
    } catch (e) {
      // Already onboarded (for example a double tap): reloading the profile moves us on.
      if (!isAlreadyOnboardedError(e)) {
        setError(describeCreateFarmError(e));
        setSubmitting(false);
        return;
      }
    }
    // The profile now says onboarding is complete, so the route guard unlocks the tabs.
    await refreshProfile();
    router.replace('/plants');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Name your farm</Text>
        <FormField
          label="Farm name"
          value={farmName}
          onChangeText={setFarmName}
          maxLength={MAX_FARM_NAME_LENGTH}
          autoCapitalize="words"
          onSubmitEditing={handleCreate}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button title="Create farm" onPress={handleCreate} loading={submitting} />
          <Button title="Back" variant="link" onPress={() => router.back()} disabled={submitting} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  error: { color: palette.danger, marginBottom: 12 },
  actions: { gap: 8 },
});
