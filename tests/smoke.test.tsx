import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('Smoke test', () => {
  it('Jest and React Native Testing Library are working', async () => {
    const { getByText } = await render(<Text testID="test-text">Hello, Farm App</Text>);
    expect(getByText('Hello, Farm App')).toBeTruthy();
  });
});
