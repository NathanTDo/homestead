import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { describeWeatherCode, useLocalWeather } from '@/features/weather';
import { OFFLINE_MESSAGE } from '@/components/common';

/** A small box with the farm location's name, current temperature, and today's high and low. */
export function WeatherWidget({ location }: { location: string | null }) {
  return (
    <View style={styles.box} accessibilityRole="summary" accessibilityLabel="Weather">
      {location ? <Forecast location={location} /> : <Note text="No farm location set" />}
    </View>
  );
}

function Forecast({ location }: { location: string }) {
  const { data, loading, error, offline, reload } = useLocalWeather(location);

  if (loading) {
    return <ActivityIndicator accessibilityLabel="Loading weather" color={palette.accent} />;
  }
  if (error) {
    return (
      <>
        <Note text={offline ? OFFLINE_MESSAGE : 'Could not load the weather.'} />
        <Pressable accessibilityRole="button" onPress={reload}>
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </>
    );
  }
  if (!data) return <Note text={`Could not find "${location}"`} />;

  const { label, icon } = describeWeatherCode(data.weatherCode);
  return (
    <>
      <Text style={styles.place} numberOfLines={1}>
        {data.placeName}
      </Text>
      <View style={styles.currentRow}>
        <Text style={styles.temperature}>{Math.round(data.temperatureF)}°</Text>
        <Ionicons name={icon} size={28} color={palette.text} accessibilityLabel={label} />
      </View>
      <Text style={styles.condition}>{label}</Text>
      <Text style={styles.highLow}>
        H: {Math.round(data.highF)}° L: {Math.round(data.lowF)}°
      </Text>
    </>
  );
}

function Note({ text }: { text: string }) {
  return <Text style={styles.note}>{text}</Text>;
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    minHeight: 120,
    justifyContent: 'center',
  },
  place: { fontSize: 15, fontWeight: '600' },
  currentRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  temperature: { fontSize: 38, fontWeight: '300' },
  condition: { fontSize: 13, color: palette.textMuted },
  highLow: { fontSize: 14, marginTop: 6 },
  note: { fontSize: 13, color: palette.textMuted },
  retry: { fontSize: 13, fontWeight: '600', marginTop: 8, textDecorationLine: 'underline' },
});
