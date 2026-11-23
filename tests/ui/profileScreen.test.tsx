import { fireEvent, render, screen } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';

const mockSetLocation = jest.fn();
let mockLocation: string | null = '94103';
jest.mock('../../src/features/auth', () => ({
  useAuth: () => ({
    profile: { email: 'a@b.c', display_name: 'Ann' },
    session: null,
    signOut: jest.fn(),
  }),
}));
jest.mock('../../src/features/farm', () => ({
  useFarm: () => ({
    farm: { name: 'Test Farm', location: mockLocation },
    setLocation: mockSetLocation,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLocation = '94103';
  mockSetLocation.mockResolvedValue(undefined);
});

const save = () => screen.getByRole('button', { name: 'Save location' });

describe('ProfileScreen farm location', () => {
  it('shows the saved location and disables Save until it changes', async () => {
    await render(<ProfileScreen />);
    expect(screen.getByRole('header', { name: 'Profile' })).toBeTruthy();
    expect(screen.getByLabelText('Farm location').props.value).toBe('94103');
    expect(save().props.accessibilityState.disabled).toBe(true);
  });
  it('saves a changed location', async () => {
    await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByLabelText('Farm location'), ' Portland, OR ');
    await fireEvent.press(save());
    expect(mockSetLocation).toHaveBeenCalledWith(' Portland, OR ');
    expect(await screen.findByText('Location saved.')).toBeTruthy();
  });
  it('can clear the location', async () => {
    await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByLabelText('Farm location'), '');
    await fireEvent.press(save());
    expect(mockSetLocation).toHaveBeenCalledWith('');
  });
  it('shows an error and keeps the text when saving fails', async () => {
    mockSetLocation.mockRejectedValue(new Error('farm_not_found'));
    await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByLabelText('Farm location'), '97201');
    await fireEvent.press(save());
    expect(await screen.findByText('Only the farm owner can change the location.')).toBeTruthy();
    expect(screen.getByLabelText('Farm location').props.value).toBe('97201');
  });
  it('rejects a location that is too long without calling the server', async () => {
    await render(<ProfileScreen />);
    await fireEvent.changeText(screen.getByLabelText('Farm location'), 'x'.repeat(101));
    await fireEvent.press(save());
    expect(await screen.findByText(/100 characters or fewer/)).toBeTruthy();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });
});
