import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { RoomInfo } from '@shared/types/dorm';
import { api, ApiError } from '@/lib/api';

const STORAGE_KEY = 'dorm-power-room-id';

type LoadState = 'loading' | 'ready' | 'unbound' | 'error';

interface RoomContextValue {
  room: RoomInfo | null;
  state: LoadState;
  error: string | null;
  reload: () => Promise<void>;
  setRoom: (room: RoomInfo) => void;
  bindTo: (room: RoomInfo) => void;
  clearBinding: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

const readStoredId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [room, setRoomState] = useState<RoomInfo | null>(null);
  const [state, setState] = useState<LoadState>(() => (readStoredId() ? 'loading' : 'unbound'));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const id = readStoredId();
    if (!id) {
      setRoomState(null);
      setState('unbound');
      return;
    }
    try {
      const info = await api.getRoom(id);
      setRoomState(info);
      setError(null);
      setState('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        localStorage.removeItem(STORAGE_KEY);
        setRoomState(null);
        setState('unbound');
        return;
      }
      setError(err instanceof Error ? err.message : '加载失败');
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (readStoredId()) {
      void reload();
    }
  }, [reload]);

  const setRoom = useCallback((info: RoomInfo) => {
    setRoomState(info);
    setState('ready');
  }, []);

  const bindTo = useCallback((info: RoomInfo) => {
    localStorage.setItem(STORAGE_KEY, info.id);
    setRoomState(info);
    setError(null);
    setState('ready');
  }, []);

  const clearBinding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoomState(null);
    setState('unbound');
  }, []);

  return (
    <RoomContext.Provider value={{ room, state, error, reload, setRoom, bindTo, clearBinding }}>
      {children}
    </RoomContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRoom = (): RoomContextValue => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
};
