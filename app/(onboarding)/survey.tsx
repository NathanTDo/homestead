import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Button, ChipSelect, FormField, type ChipOption } from '@/components/common';
import { Text, View } from '@/components/Themed';
import {
  EXPERIENCE_LEVELS,
  FARMING_TYPES,
  MAX_LOCATION_LENGTH,
  SEASONS,
  useOnboarding,
  validateSurvey,
  type ExperienceLevel,
  type FarmingType,
} from '@/features/onboarding';
import * as plantRepository from '@/repositories/plantRepository';
import type { Season } from '@/types';

function toOptions<T extends string>(values: readonly T[]): ChipOption<T>[] {
  return values.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));
}

const FARMING_TYPE_OPTIONS = toOptions(FARMING_TYPES);
const SEASON_OPTIONS = toOptions(SEASONS);
const EXPERIENCE_OPTIONS = toOptions(EXPERIENCE_LEVELS);

export default function SurveyScreen() {
  const router = useRouter();
  const { answers, updateAnswers } = useOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [plantNames, setPlantNames] = useState<string[] | null>(null);
  const [plantsFailed, setPlantsFailed] = useState(false);

  useEffect(() => {
    let active = true;
    plantRepository
      .searchPlants()
      .then((plants) => active && setPlantNames(plants.map((p) => p.name)))
      .catch(() => active && setPlantsFailed(true));
    return () => {
      active = false;
    };
  }, []);

  function handleContinue() {
    const validationError = validateSurvey(answers);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    router.push('/farm-name');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>About your farm</Text>

      <FormField
        label="Where is your farm? (optional)"
        value={answers.farmingLocation}
        onChangeText={(farmingLocation) => updateAnswers({ farmingLocation })}
        maxLength={MAX_LOCATION_LENGTH}
        autoComplete="postal-address-locality"
      />

      <ChipSelect<FarmingType>
        label="Type of farming"
        options={FARMING_TYPE_OPTIONS}
        selected={answers.farmingType ? [answers.farmingType] : []}
        onChange={(next) => updateAnswers({ farmingType: next[0] ?? null })}
      />

      <ChipSelect<Season>
        label="Seasons you want to grow in (optional)"
        options={SEASON_OPTIONS}
        selected={answers.seasons}
        onChange={(seasons) => updateAnswers({ seasons })}
        multiple
      />

      {plantNames ? (
        <ChipSelect<string>
          label="Crops you're interested in (optional)"
          options={plantNames.map((name) => ({ value: name, label: name }))}
          selected={answers.produce}
          onChange={(produce) => updateAnswers({ produce })}
          multiple
        />
      ) : plantsFailed ? (
        <Text style={styles.note}>Could not load the crop list. You can skip this question.</Text>
      ) : (
        <ActivityIndicator style={styles.loading} />
      )}

      <ChipSelect<ExperienceLevel>
        label="Farming experience"
        options={EXPERIENCE_OPTIONS}
        selected={answers.experienceLevel ? [answers.experienceLevel] : []}
        onChange={(next) => updateAnswers({ experienceLevel: next[0] ?? null })}
      />

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button title="Continue" onPress={handleContinue} />
        <Button title="Back" variant="link" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 64 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  note: { opacity: 0.7, marginBottom: 20 },
  loading: { marginBottom: 20 },
  error: { color: '#c62828', marginBottom: 12 },
  actions: { gap: 8, marginBottom: 24 },
});
