import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { EmptyState, ErrorState, LoadingState } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { HARVEST_BAR_COLOR } from '@/constants/taskTypes';
import { useHarvestWindows } from '@/features/calendar';
import { formatDate } from '@/utils/dates';

/** What the green bar on the calendar stands for, for one crop. */
export default function HarvestWindowScreen() {
  const { cropId } = useLocalSearchParams<{ cropId: string }>();
  const { windows, loading, error, offline, reload } = useHarvestWindows(null);

  if (loading) return <LoadingState message="Loading harvest window" />;
  if (error) {
    return (
      <ErrorState
        message="Could not load this harvest window."
        offline={offline}
        onRetry={reload}
      />
    );
  }
  const window = windows.find((w) => w.farm_crop_id === cropId);
  if (!window) {
    return (
      <EmptyState
        fullScreen
        icon="help-circle-outline"
        message="That harvest window could not be found"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: window.plant_name }} />
      <View style={styles.typeRow}>
        <View style={[styles.swatch, { backgroundColor: HARVEST_BAR_COLOR }]} />
        <Text style={styles.type}>Harvest · Green bar</Text>
      </View>
      <Text style={styles.title}>Harvest window</Text>
      <Detail label="Plant" value={window.plant_name} />
      {window.maturity ? (
        <Detail label="Expected maturity" value={formatDate(window.maturity)} />
      ) : null}
      <Detail label="Harvest window begins" value={formatDate(window.harvestStart)} />
      <Detail label="Harvest window ends" value={formatDate(window.harvestEnd)} />
      <Detail
        label="What the bar means"
        value={`The green bar runs from ${formatDate(window.start)} to ${formatDate(window.end)}. The crop is expected to be fully grown at the start, so check for ripe produce then and pick what is left before it ends.`}
      />
      <Text style={styles.note}>
        This is a time to watch for. It is not something you tick off.
      </Text>
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  type: { fontSize: 14, opacity: 0.7 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  detail: { marginBottom: 14 },
  detailLabel: { fontSize: 12, fontWeight: '600', opacity: 0.6, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, marginTop: 2, lineHeight: 22 },
  note: { marginTop: 16, textAlign: 'center', opacity: 0.6 },
});
