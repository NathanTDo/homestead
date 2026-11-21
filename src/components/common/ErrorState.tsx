import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { Button } from './Button';
import { StateLayout } from './StateLayout';

interface ErrorStateProps {
  /** What went wrong, in plain words. A default is used if left out. */
  message?: string;
  /** The device could not reach the server. Shows an offline icon and message. */
  offline?: boolean;
  /** Shows a "Try again" button. */
  onRetry?: () => void;
  /** Extra actions under the retry button, such as "Sign out". */
  children?: React.ReactNode;
  fullScreen?: boolean;
  safeArea?: boolean;
}

export const OFFLINE_MESSAGE = 'You appear to be offline. Check your connection and try again.';
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Try again.';

export function ErrorState({
  message,
  offline = false,
  onRetry,
  children,
  fullScreen,
  safeArea,
}: ErrorStateProps) {
  const text = offline ? OFFLINE_MESSAGE : (message ?? GENERIC_ERROR_MESSAGE);
  return (
    <StateLayout fullScreen={fullScreen} safeArea={safeArea}>
      <Ionicons
        name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={40}
        color={palette.textMuted}
      />
      <Text accessibilityRole="alert" style={{ textAlign: 'center', opacity: 0.8 }}>
        {text}
      </Text>
      {onRetry ? <Button title="Try again" onPress={onRetry} /> : null}
      {children}
    </StateLayout>
  );
}
