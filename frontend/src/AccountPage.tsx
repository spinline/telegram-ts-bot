import { useEffect, useMemo } from 'react';
import {
  Text,
  Group,
  Title,
  Stack,
  Badge,
  Code,
  Loader,
  Alert,
  ThemeIcon,
  Progress,
  Button,
} from '@mantine/core';
import {
  IconCircleCheck,
  IconClock,
  IconBan,
  IconHelp,
  IconAlertTriangle,
  IconGauge,
  IconCalendar,
  IconCopy,
} from '@tabler/icons-react';

export interface HwidDevice {
  hwid: string;
  userUuid: string;
  platform?: string | null;
  osVersion?: string | null;
  deviceModel?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountResponse {
  status: 'ACTIVE' | 'DISABLED' | 'LIMITED' | 'EXPIRED' | string;
  trafficLimitBytes: number;
  usedTrafficBytes: number;
  expireAt: string;
  username: string;
  tag?: string;
  manageUrl?: string;
  subscriptionUrl?: string;
  onlineAt?: string | null;
  hwidDeviceLimit?: number | null;
  lastConnectedNode?: {
    connectedAt?: string | null;
    nodeName?: string;
    countryCode?: string;
  } | null;
  happ?: {
    cryptoLink: string;
  };
  hwid?: {
    total: number;
    devices: HwidDevice[];
  };
}

export function AccountPage({
  loading,
  error,
  account,
}: {
  loading: boolean;
  error: string | null;
  account: AccountResponse | null;
}) {
  const webApp = (window as any).Telegram.WebApp;
  const user = webApp?.initDataUnsafe?.user;

  useEffect(() => {
    try { webApp?.ready?.(); } catch {}
  }, [webApp?.colorScheme, webApp]);

  const accountStats = useMemo(() => {
    if (!account) return null;
    const limit = account.trafficLimitBytes ?? 0;
    const used = account.usedTrafficBytes ?? 0;
    const remaining = Math.max(limit - used, 0);
    const usagePercentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    return { limit, used, remaining, usagePercentage };
  }, [account]);

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const formatExpireDate = (isoDate: string) => {
    if (!isoDate) return 'Belirsiz';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const statusConfig = (status: AccountResponse['status']) => {
    const normalized = status?.toLowerCase();
    switch (normalized) {
      case 'active':
        return { color: 'teal' as const, label: 'Aktif', icon: <IconCircleCheck size={16} /> };
      case 'disabled':
        return { color: 'red' as const, label: 'Devre Dışı', icon: <IconBan size={16} /> };
      case 'inactive':
        return { color: 'gray' as const, label: 'Pasif', icon: <IconClock size={16} /> };
      case 'expired':
        return { color: 'red' as const, label: 'Süresi Dolmuş', icon: <IconBan size={16} /> };
      case 'suspended':
        return { color: 'orange' as const, label: 'Askıya Alındı', icon: <IconAlertTriangle size={16} /> };
      default:
        return { color: 'blue' as const, label: status ?? 'Bilinmiyor', icon: <IconHelp size={16} /> };
    }
  };

  const openExternalLink = async (rawUrl: string | undefined, fallbackUrl?: string) => {
    try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'); } catch {}
    if (!rawUrl) { console.warn('Açılacak URL bulunamadı.'); return; }
    const url = encodeURI(rawUrl);
    const isHttp = /^https?:\/\//i.test(url);
    const isCustomScheme = /^[a-z][a-z0-9+.-]*:/i.test(url) && !isHttp;
    const ua = navigator.userAgent;
    const isAndroid = /Android/.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    if (!isCustomScheme) {
      if ((window as any).Telegram?.WebApp?.openLink) {
        (window as any).Telegram.WebApp.openLink(url);
      } else {
        window.open(url, '_blank', 'noopener');
      }
      return;
    }
    if (isAndroid) {
      const noScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
      const intent = `intent://${noScheme}#Intent;scheme=happ;package=com.happproxy;S.browser_fallback_url=${encodeURIComponent(fallbackUrl || 'https://play.google.com/store/apps/details?id=com.happproxy')};end`;
      try { window.location.href = intent; } catch { window.open(intent, '_self'); }
      return;
    }
    if (isIOS) {
      try { await navigator.clipboard?.writeText(rawUrl); } catch {}
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.showPopup) {
          tg.showPopup({
            title: 'Happ bağlantısı',
            message: 'iOS Telegram mini app kısıtlaması nedeniyle bağlantı kopyalandı. Safari’de açıp adres çubuğuna yapıştırın.',
            buttons: [ { id: 'store', type: 'default', text: 'App Store' }, { id: 'ok', type: 'ok', text: 'Tamam' } ],
          }, (btnId: string) => {
            if (btnId === 'store') tg.openLink?.('https://apps.apple.com/us/app/happ-proxy-utility/id6504287215');
          });
        } else {
          alert('Bağlantı kopyalandı. Safari’de açıp adres çubuğuna yapıştırın.');
        }
      } catch {}
      return;
    }
    try { window.open(url, '_self'); } catch {}
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', width: '100%' }}>
      <div style={{ display: 'flex', width: '100%', backgroundColor: '#0006', overflow: 'auto', zIndex: 2, position: 'relative', padding: 30, flexDirection: 'column', borderRadius: '1rem', maxHeight: '90%', boxShadow: 'none', border: 'none' }}>
        <Stack>
          {user ? (
            <div>
              <Stack gap="md">
                <Title order={4} style={{ color: '#fff' }}>Hoş Geldin, {user.first_name}!</Title>
                <Group gap="xs" align="center">
                  <Text size="sm" c="dimmed">ID: {user.id}</Text>
                  <ThemeIcon color="gray" variant="subtle" radius="xl" size="sm" style={{ cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(String(user.id)); try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success'); } catch {} }}>
                    <IconCopy size={14} />
                  </ThemeIcon>
                </Group>

                {loading ? (
                  <Group justify="center" my="lg"><Loader color="blue" /></Group>
                ) : error ? (
                  <Alert color="red" icon={<IconAlertTriangle />} title="Bir sorun oluştu">{error}</Alert>
                ) : account ? (
                  <Stack gap="sm">
                    <Group gap="xs" align="center" wrap="wrap">
                      <ThemeIcon color={statusConfig(account.status).color} variant="light" radius="xl">{statusConfig(account.status).icon}</ThemeIcon>
                      <Badge color={statusConfig(account.status).color} size="lg" radius="sm">{statusConfig(account.status).label}</Badge>
                      {account.tag && (<Badge color="violet" size="lg" radius="sm" variant="dot">{account.tag}</Badge>)}
                    </Group>

                    <Group gap="xs" align="center" wrap="nowrap">
                      <ThemeIcon color="gray" variant="light" radius="xl" size="sm"><IconCalendar size={14} /></ThemeIcon>
                      <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bitiş: {formatExpireDate(account.expireAt)}</Text>
                    </Group>

                    {account.lastConnectedNode && (
                      <Group gap="xs" align="center" wrap="nowrap">
                        <ThemeIcon color="blue" variant="light" radius="xl" size="sm"><IconGauge size={14} /></ThemeIcon>
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Node: {account.lastConnectedNode.nodeName || 'Bilinmiyor'}
                          {account.lastConnectedNode.countryCode && ` (${account.lastConnectedNode.countryCode})`}
                        </Text>
                      </Group>
                    )}

                    {account.hwid && account.hwid.total > 0 && (
                      <div style={{ backgroundColor: '#0009', border: '1px solid #8b5cf6', borderRadius: '0.5rem', padding: '0.75rem' }}>
                        <Group gap="xs" align="center" mb="xs">
                          <ThemeIcon color="violet" variant="light" radius="xl" size="sm"><IconGauge size={14} /></ThemeIcon>
                          <Text size="sm" style={{ color: '#8b5cf6' }}>HWID Cihazları: {account.hwid.total}{account.hwidDeviceLimit ? ` / ${account.hwidDeviceLimit}` : ''}</Text>
                        </Group>
                        <Stack gap={6}>
                          {account.hwid.devices.map((device, idx) => (
                            <Text key={idx} size="sm" style={{ color: '#a78bfa', paddingLeft: '0.5rem' }}>
                              • {device.deviceModel || device.platform || 'Bilinmeyen Cihaz'}
                            </Text>
                          ))}
                        </Stack>
                      </div>
                    )}

                    {accountStats && (
                      <Stack gap={4}>
                        <Group gap="xs" align="center"><ThemeIcon color="teal" variant="light" radius="xl"><IconGauge size={16} /></ThemeIcon><Text size="sm" style={{ color: '#14b8a6' }}>Kota Kullanımı:</Text></Group>
                        <Progress value={accountStats.usagePercentage} size="lg" radius="xl" color="teal" />
                        <Text size="sm" c="dimmed" mt={4}>{`${accountStats.usagePercentage.toFixed(0)}% kullanıldı`}</Text>
                        <Code block style={{ backgroundColor: '#0009', color: '#14b8a6', border: '1px solid #14b8a6' }}>{`${formatBytes(accountStats.used)} / ${formatBytes(accountStats.limit)} (${formatBytes(accountStats.remaining)} kaldı)`}</Code>
                      </Stack>
                    )}

                    {account.subscriptionUrl && (
                      <Button variant="light" color="blue" onClick={() => openExternalLink(account.subscriptionUrl)} fullWidth>
                        Abonelik Linkini Aç
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Alert color="yellow" icon={<IconAlertTriangle />} title="Bilgi">Hesap bilgileri bulunamadı.</Alert>
                )}

                <Group grow mt="md">
                  <Button variant="light" color="blue" onClick={() => openExternalLink(account?.subscriptionUrl ?? account?.manageUrl ?? 'https://t.me/')} disabled={!account && !error}>Abonelik Linkini Aç</Button>
                  <Button variant="filled" color="teal" onClick={() => openExternalLink(account?.subscriptionUrl ?? 'https://t.me/')}>Abonelik Satın Al</Button>
                </Group>
              </Stack>
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#0009', borderRadius: '0.5rem' }}>
              <Text style={{ color: '#fff' }}>Kullanıcı bilgileri yüklenemedi. Lütfen uygulamanın Telegram üzerinden açıldığından emin olun.</Text>
            </div>
          )}
        </Stack>
      </div>
    </div>
  );
}

export default AccountPage;
