import { useStore } from '../state';
import { getTheme } from '../theme';

export function useT() {
  const mode = useStore((s) => s.themeMode);
  return getTheme(mode);
}
