import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/Themed';
import { WeatherWidget } from '@/components/weather';
import { useFarm } from '@/features/farm';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { farm } = useFarm();
  const location = (farm.location ?? '').trim() || null;

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.row}>
        {/* The left half is left free for upcoming home screen content. */}
        <View style={styles.half} />
        <View style={styles.half}>
          <WeatherWidget location={location} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
