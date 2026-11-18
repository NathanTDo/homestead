/**
 * The app's colors. It has one look, a deep green theme with cream accents, so light and dark
 * share the same palette. Use `palette` for fixed styles and `useThemeColor` in themed components.
 */
export const palette = {
  /** Screen background. */
  background: '#1E5130',
  /** Dark panels, cards and the tab bar. */
  surface: '#143D24',
  /** Light card (the calendar). */
  card: '#E4EDD6',
  /** Dark text on the light card. */
  cardText: '#143D24',
  /** Muted text on the light card. */
  cardTextMuted: 'rgba(20, 61, 36, 0.4)',
  /** Main text on the green background. */
  text: '#F1F6EA',
  textMuted: 'rgba(241, 246, 234, 0.65)',
  /** Thin outlines around panels, fields and chips. */
  border: 'rgba(241, 246, 234, 0.3)',
  /** Cream used for primary buttons and selected states. */
  accent: '#E6EFD9',
  /** Text on top of the accent color. */
  onAccent: '#143D24',
  /** Error text, light enough to read on green. */
  danger: '#FFB4AB',
  /** Dim backdrop behind sheets. */
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

const theme = {
  text: palette.text,
  background: palette.background,
  tint: palette.accent,
  tabIconDefault: palette.textMuted,
  tabIconSelected: palette.accent,
};

export default {
  light: theme,
  dark: theme,
};
