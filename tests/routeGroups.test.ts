/// <reference types="node" />
import { existsSync } from 'fs';
import { join } from 'path';

// The root layout shows one of these groups at a time (Stack.Protected). The app opens
// at "/", so each group needs an index route. Without one, users land on "not found".
describe('route groups', () => {
  for (const group of ['(auth)', '(onboarding)', '(tabs)']) {
    it(`${group} has an index route`, () => {
      const dir = join(__dirname, '..', 'app', group);
      expect(existsSync(join(dir, 'index.tsx'))).toBe(true);
    });
  }
});
