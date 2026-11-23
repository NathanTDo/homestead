import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { WeatherWidget } from '@/components/weather';
import { useFarm } from '@/features/farm';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { farm } = useFarm();
  const location = (farm.location ?? '').trim() || null;

  return (
    <ScrollView style={{ paddingTop: insets.top }} contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Home
      </Text>
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
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
