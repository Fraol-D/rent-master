import { useCallback } from 'react';

export const useSelectOnClick = () => {
  return useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    if (!e.currentTarget.disabled) {
      e.currentTarget.select();
    }
  }, []);
};