import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, ErrorState, LoadingState } from '@/components/common';
import { Text } from '@/components/Themed';
import { useAuth } from '@/features/auth';
import * as cropRepository from '@/repositories/cropRepository';
import * as farmRepository from '@/repositories/farmRepository';
import * as profileRepository from '@/repositories/profileRepository';
import { isNetworkError } from '@/utils/errors';
import type { Farm, FarmCrop } from '@/types';

interface FarmContextValue {
  farm: Farm;
  /** The farm's planned and active crops. Archived crops are not included. */
  crops: FarmCrop[];
  /** Adds a plant as a planned crop. Rejects if the database refuses (for example at the limit). */
  addCrop: (plantId: string) => Promise<void>;
  /** Archives a crop (soft delete). */
  removeCrop: (cropId: string) => Promise<void>;
  /** Reloads the crops, e.g. after a schedule was created and a crop became active. */
  refreshCrops: () => Promise<void>;
  /** Saves the farm's location (zip code or place name). An empty string clears it. */
  setLocation: (location: string) => Promise<void>;
}

interface Loaded {
  key: string;
  farm: Farm | null;
  crops: FarmCrop[];
  error: boolean;
  offline: boolean;
}

const ACTIVE_STATUSES: FarmCrop['status'][] = ['planned', 'active'];

const FarmContext = createContext<FarmContextValue | null>(null);

/**
 * Loads the signed-in user's farm and crops and shares them with every tab. Children render
 * only when both loaded, so screens can rely on `farm` existing.
 */
export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { session, signOut, refreshProfile } = useAuth();
  const userId = session?.user.id ?? null;
  const [attempt, setAttempt] = useState(0);
  const [restarting, setRestarting] = useState(false);
  const [restartFailed, setRestartFailed] = useState(false);
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
        if (active) setLoaded({ key, farm, crops, error: false, offline: false });
      })
      .catch(
        (failure: unknown) =>
          active &&
          setLoaded({
            key,
            farm: null,
            crops: [],
            error: true,
            offline: isNetworkError(failure),
          }),
      );
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

  const setLocation = useCallback(
    async (location: string) => {
      if (!farm) return;
      const saved = await farmRepository.updateFarmLocation(farm.id, location);
      setLoaded((prev) =>
        prev && prev.key === key && prev.farm
          ? { ...prev, farm: { ...prev.farm, location: saved } }
          : prev,
      );
    },
    [farm, key],
  );
  const refreshCrops = useCallback(async () => {
    if (!farm) return;
    const fresh = await cropRepository.listCrops(farm.id, ACTIVE_STATUSES);
    updateCrops(() => fresh);
  }, [farm, updateCrops]);

  // An account marked as onboarded can end up without a farm. Clearing the flag sends the user
  // back through onboarding, which creates a new farm.
  const restartSetup = useCallback(async () => {
    if (!userId) return;
    setRestarting(true);
    setRestartFailed(false);
    try {
      await profileRepository.updateProfile(userId, { onboarding_data: null });
      await refreshProfile();
    } catch {
      setRestartFailed(true);
      setRestarting(false);
    }
  }, [userId, refreshProfile]);

  const value = useMemo<FarmContextValue | null>(
    () => (farm ? { farm, crops, addCrop, removeCrop, refreshCrops, setLocation } : null),
    [farm, crops, addCrop, removeCrop, refreshCrops, setLocation],
  );

  if (!current) {
    return <LoadingState safeArea message="Loading your farm" />;
  }
  if (current.error) {
    return (
      <ErrorState
        safeArea
        message="Your farm could not be loaded."
        offline={current.offline}
        onRetry={() => setAttempt((n) => n + 1)}
      >
        <Button title="Sign out" variant="link" onPress={signOut} />
      </ErrorState>
    );
  }
  if (!value) {
    return (
      <ErrorState safeArea message="We could not find a farm for your account.">
        <Button title="Set up my farm" onPress={restartSetup} loading={restarting} />
        {restartFailed ? (
          <Text accessibilityRole="alert" style={styles.message}>
            Could not restart setup. Check your connection and try again.
          </Text>
        ) : null}
        <Button title="Try again" variant="link" onPress={() => setAttempt((n) => n + 1)} />
        <Button title="Sign out" variant="link" onPress={signOut} />
      </ErrorState>
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
  message: { textAlign: 'center', opacity: 0.7 },
});
