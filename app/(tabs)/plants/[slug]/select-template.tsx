import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Button, DateField } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { describeCropError } from '@/features/crops';
import { useFarm } from '@/features/farm';
import { usePlant } from '@/features/plants';
import {
  describeScheduleError,
  describeTemplate,
  harvestWindowText,
  useTemplates,
} from '@/features/templates';
import * as cropRepository from '@/repositories/cropRepository';
import { ScheduleRequestError, generateSchedule } from '@/repositories/scheduleRepository';
import { formatDate, todayIso, type IsoDate } from '@/utils/dates';

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function SelectTemplateScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { crops, refreshCrops } = useFarm();
  const {
    data: plant,
    loading: plantLoading,
    error: plantError,
    reload: reloadPlant,
  } = usePlant(slug);
  const crop = plant ? crops.find((c) => c.plant_id === plant.id) : undefined;
  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    reload: reloadTemplates,
  } = useTemplates(plant?.id ?? null);

  const [chosenTemplateId, setChosenTemplateId] = useState<string | null>(null);
  const [chosenDate, setChosenDate] = useState<IsoDate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  if (plantLoading || (plant && templatesLoading)) {
    return <ActivityIndicator style={styles.center} />;
  }
  if (plantError || templatesError) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Could not load growing information. Check your connection.
        </Text>
        <Button title="Try again" onPress={plantError ? reloadPlant : reloadTemplates} />
      </View>
    );
  }
  if (!plant || !crop) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Add this plant to your farm before setting up a schedule.
        </Text>
      </View>
    );
  }
  if (createdCount !== null) {
    return (
      <View style={styles.center}>
        <Text style={styles.successTitle}>Schedule created</Text>
        <Text style={styles.message}>
          {createdCount} tasks were added for {plant.name}.
        </Text>
        <Button title="Back to Plants" onPress={() => router.dismissTo('/plants')} />
      </View>
    );
  }
  if (crop.status === 'active') {
    const planted = templates.find((t) => t.id === crop.template_id);
    return (
      <View style={styles.center}>
        <Text style={styles.successTitle}>Schedule already created</Text>
        <Text style={styles.message}>
          {planted ? `${capitalize(planted.season)} season` : 'Season set'}
          {crop.planting_date ? `, planting on ${formatDate(crop.planting_date)}` : ''}.
        </Text>
      </View>
    );
  }
  if (templates.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>There is no growing information for {plant.name} yet.</Text>
      </View>
    );
  }

  // The user's choice wins. Otherwise use the only template, or what the crop already has.
  const selected =
    templates.find((t) => t.id === chosenTemplateId) ??
    (templates.length === 1 ? templates[0] : templates.find((t) => t.id === crop.template_id)) ??
    null;
  const plantingDate = chosenDate ?? crop.planting_date;
  const ready = selected !== null && plantingDate !== null;
  const harvest = selected && plantingDate ? harvestWindowText(selected, plantingDate) : null;

  async function handleSubmit() {
    if (!selected || !plantingDate || !crop) return;
    setBusy(true);
    setError(null);
    try {
      await cropRepository.updateCropSchedule(crop.id, {
        templateId: selected.id,
        templateVersion: selected.version,
        plantingDate,
      });
      const result = await generateSchedule(crop.id);
      await refreshCrops();
      setCreatedCount(result.tasks.length);
    } catch (e) {
      setError(
        e instanceof ScheduleRequestError ? describeScheduleError(e.code) : describeCropError(e),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: plant.name }} />
      <Text style={styles.heading}>
        {templates.length === 1 ? 'Growing season' : 'Choose a season'}
      </Text>

      {templates.map((template) => {
        const isSelected = selected?.id === template.id;
        return (
          <Pressable
            key={template.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => setChosenTemplateId(template.id)}
            style={[styles.card, isSelected && styles.cardSelected]}
          >
            <Text style={styles.season}>{capitalize(template.season)}</Text>
            {describeTemplate(template).map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
          </Pressable>
        );
      })}
      <Text style={styles.disclaimer}>
        These numbers are placeholders and have not been checked against growing guides.
      </Text>

      <View style={styles.dateSection}>
        <DateField label="Planting date" value={plantingDate} onChange={setChosenDate} />
        <Button title="Use today" variant="link" onPress={() => setChosenDate(todayIso())} />
        {harvest ? <Text style={styles.harvest}>{harvest}</Text> : null}
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <Button title="Create schedule" onPress={handleSubmit} loading={busy} disabled={!ready} />
      {!ready ? (
        <Text style={styles.hint}>
          {selected ? 'Choose a planting date to continue.' : 'Choose a season to continue.'}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7 },
  successTitle: { textAlign: 'center', fontSize: 22, fontWeight: 'bold' },
  content: { padding: 24 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  card: { borderWidth: 1, borderColor: '#999', borderRadius: 10, padding: 14, marginBottom: 10 },
  cardSelected: { borderColor: '#2f7d32', borderWidth: 2 },
  season: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  line: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  disclaimer: { fontSize: 12, opacity: 0.6, marginBottom: 20 },
  dateSection: { marginBottom: 8 },
  harvest: { fontSize: 14, opacity: 0.8, marginTop: 4 },
  error: { color: '#c62828', marginBottom: 12 },
  hint: { textAlign: 'center', opacity: 0.6, marginTop: 8 },
});
