import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { Button } from './Button';
import { StateLayout } from './StateLayout';

interface EmptyStateProps {
  /** What is empty, e.g. "No activities scheduled this month". */
  message: string;
  /** A short line saying what to do about it. */
  hint?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  action?: { label: string; onPress: () => void };
  fullScreen?: boolean;
  safeArea?: boolean;
}

export function EmptyState({
  message,
  hint,
  icon = 'leaf-outline',
  action,
  fullScreen = false,
  safeArea,
}: EmptyStateProps) {
  return (
    <StateLayout fullScreen={fullScreen} safeArea={safeArea}>
      <Ionicons name={icon} size={36} color={palette.textMuted} />
      <Text style={{ textAlign: 'center', fontSize: 16 }}>{message}</Text>
      {hint ? <Text style={{ textAlign: 'center', opacity: 0.6 }}>{hint}</Text> : null}
      {action ? <Button title={action.label} variant="link" onPress={action.onPress} /> : null}
    </StateLayout>
  );
}
