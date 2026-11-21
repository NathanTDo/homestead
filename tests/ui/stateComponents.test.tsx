import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  EmptyState,
  ErrorState,
  GENERIC_ERROR_MESSAGE,
  LoadingState,
  OFFLINE_MESSAGE,
} from '../../src/components/common';

describe('LoadingState', () => {
  it('shows a spinner and an optional message', async () => {
    await render(<LoadingState message="Loading your tasks" />);
    expect(screen.getByText('Loading your tasks')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('works without a message', async () => {
    await render(<LoadingState />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('shows the message and calls onRetry when "Try again" is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Could not load plants." onRetry={onRetry} />);
    expect(screen.getByText('Could not load plants.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the offline message instead when the device is offline', async () => {
    await render(<ErrorState message="Could not load plants." offline onRetry={() => {}} />);
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('Could not load plants.')).toBeNull();
  });

  it('uses a generic message if none is given, and has no retry button without onRetry', async () => {
    await render(<ErrorState />);
    expect(screen.getByText(GENERIC_ERROR_MESSAGE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('announces itself as an alert', async () => {
    await render(<ErrorState message="Boom" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('shows extra actions under the retry button', async () => {
    const onSignOut = jest.fn();
    await render(
      <ErrorState message="x" onRetry={() => {}}>
        <EmptyState message="child" action={{ label: 'Sign out', onPress: onSignOut }} />
      </ErrorState>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('shows the message and a hint', async () => {
    await render(
      <EmptyState message="No activities scheduled this month" hint="Set up a schedule." />,
    );
    expect(screen.getByText('No activities scheduled this month')).toBeTruthy();
    expect(screen.getByText('Set up a schedule.')).toBeTruthy();
  });

  it('shows an optional action', async () => {
    const onPress = jest.fn();
    await render(<EmptyState message="Nothing here" action={{ label: 'Add one', onPress }} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add one' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
