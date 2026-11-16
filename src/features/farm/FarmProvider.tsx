import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/features/auth';
import * as cropRepository from '@/repositories/cropRepository';
import * as farmRepository from '@/repositories/farmRepository';
import type { Farm, FarmCrop } from '@/types';

interface FarmContextValue {
  farm: Farm;
  /** The farm's planned and active crops. Archived crops are not included. */
  crops: FarmCrop[];
  /** Adds a plant as a planned crop. Rejects if the database refuses (for example at the limit). */
  addCrop: (plantId: string) => Promise<void>;
  /** Archives a crop (soft delete). */
  removeCrop: (cropId: string) => Promise<void>;
}

interface Loaded {
  key: string;
  farm: Farm | null;
  crops: FarmCrop[];
  error: boolean;
}

const ACTIVE_STATUSES: FarmCrop['status'][] = ['planned', 'active'];

const FarmContext = createContext<FarmContextValue | null>(null);

/**
 * Loads the signed-in user's farm and crops and shares them with every tab. Children render
 * only when both loaded, so screens can rely on `farm` existing.
 */
export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const userId = session?.user.id ?? null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // Plants whose add request is in flight, so a double tap sends only one request.
  const [pendingPlantIds] = useState(() => new Set<string>());
  const key = `${userId}#${attempt}`;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    farmRepository
      .getFarmForUser(userId)
      .then(async (farm) => {
        const crops = farm ? await cropRepository.listCrops(farm.id, ACTIVE_STATUSES) : [];
        if (active) setLoaded({ key, farm, crops, error: false });
      })
      .catch(() => active && setLoaded({ key, farm: null, crops: [], error: true }));
    return () => {
      active = false;
    };
  }, [userId, key]);

  const current = loaded?.key === key ? loaded : null;
  const farm = current?.farm ?? null;
  const crops = useMemo(() => current?.crops ?? [], [current]);

  const updateCrops = useCallback(
    (change: (crops: FarmCrop[]) => FarmCrop[]) =>
      setLoaded((prev) =>
        prev && prev.key === key ? { ...prev, crops: change(prev.crops) } : prev,
      ),
    [key],
  );

  const addCrop = useCallback(
    async (plantId: string) => {
      if (!farm) return;
      // Ignore a second tap while the first is in flight, and plants already on the farm.
      if (pendingPlantIds.has(plantId)) return;
      if (crops.some((crop) => crop.plant_id === plantId)) return;
      pendingPlantIds.add(plantId);
      try {
        const crop = await cropRepository.createCrop(farm.id, plantId);
        updateCrops((existing) => [...existing, crop]);
      } finally {
        pendingPlantIds.delete(plantId);
      }
    },
    [farm, crops, updateCrops, pendingPlantIds],
  );

  const removeCrop = useCallback(
    async (cropId: string) => {
      await cropRepository.archiveCrop(cropId);
      updateCrops((existing) => existing.filter((crop) => crop.id !== cropId));
    },
    [updateCrops],
  );

  const value = useMemo<FarmContextValue | null>(
    () => (farm ? { farm, crops, addCrop, removeCrop } : null),
    [farm, crops, addCrop, removeCrop],
  );

  if (!current) {
    return <ActivityIndicator style={styles.center} />;
  }
  if (current.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Your farm could not be loaded. Check your connection.</Text>
        <Button title="Try again" onPress={() => setAttempt((n) => n + 1)} />
        <Button title="Sign out" variant="link" onPress={signOut} />
      </View>
    );
  }
  if (!value) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>We could not find a farm for your account.</Text>
        <Button title="Try again" onPress={() => setAttempt((n) => n + 1)} />
        <Button title="Sign out" variant="link" onPress={signOut} />
      </View>
    );
  }
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm(): FarmContextValue {
  const value = useContext(FarmContext);
  if (!value) throw new Error('useFarm must be used inside <FarmProvider>.');
  return value;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7 },
});
