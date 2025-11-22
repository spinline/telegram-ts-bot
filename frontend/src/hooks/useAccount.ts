/**
 * useAccount Hook
 * Fetch and manage account data
 */

import { useEffect, useState } from 'react';
import { fetchAccount } from '../services/api';
import type { AccountResponse, OnlineStatus } from '../types/account';
import { useTelegram } from './useTelegram';

export const useAccount = () => {
  const { user, initData } = useTelegram();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchAccount(initData);

        if (cancelled) return;

        setAccount(data);

        // Calculate online status
        const status = String(data?.status ?? '').toLowerCase();
        const onlineAtMs = data?.onlineAt ? Date.parse(data.onlineAt) : 0;
        const connectedAtMs = data?.lastConnectedNode?.connectedAt
          ? Date.parse(data.lastConnectedNode.connectedAt)
          : 0;
        const freshest = Math.max(onlineAtMs || 0, connectedAtMs || 0);
        const now = Date.now();
        const ONLINE_STALE_MS = 2 * 60 * 1000; // 2 minutes

        const isFresh = Number.isFinite(freshest) && freshest > 0 && now - freshest <= ONLINE_STALE_MS;
        setOnlineStatus(status === 'active' && isFresh ? 'online' : 'offline');
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
        setError(message);
        setAccount(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      cancelled = true;
    };
  }, [user, initData]);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAccount(initData);
      setAccount(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    account,
    loading,
    error,
    onlineStatus,
    isRegistered: !!account && !error,
    refetch,
  };
};

