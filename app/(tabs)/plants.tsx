import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function PlantsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plants</Text>
      <Text style={styles.subtitle}>Plant catalog will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
});
