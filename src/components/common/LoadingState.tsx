import { ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { StateLayout } from './StateLayout';

interface LoadingStateProps {
  /** Optional text under the spinner, e.g. "Loading your tasks". */
  message?: string;
  fullScreen?: boolean;
  safeArea?: boolean;
}

export function LoadingState({ message, fullScreen, safeArea }: LoadingStateProps) {
  return (
    <StateLayout fullScreen={fullScreen} safeArea={safeArea}>
      <ActivityIndicator
        color={palette.text}
        accessibilityLabel={message ?? 'Loading'}
        accessibilityRole="progressbar"
        accessible
      />
      {message ? <Text style={{ opacity: 0.7, textAlign: 'center' }}>{message}</Text> : null}
    </StateLayout>
  );
}
