import { useEffect, useMemo, useState } from 'react';
import {
  MantineProvider,
  AppShell,
  Card,
  Text,
  Button,
  Group,
  Title,
  Stack,
  Badge,
  Code,
  useMantineColorScheme,
  ActionIcon,
  Loader,
  Alert,
  ThemeIcon,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import {
  IconSun,
  IconMoon,
  IconCircleCheck,
  IconClock,
  IconBan,
  IconHelp,
  IconAlertTriangle,
} from '@tabler/icons-react';
import '@mantine/core/styles.css';

// Telegram Web App script'inin eklediği global nesneyi tanımla
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

interface AccountResponse {
  status: 'ACTIVE' | 'DISABLED' | 'LIMITED' | 'EXPIRED' | string;
  trafficLimitBytes: number;
  usedTrafficBytes: number;
  expireAt: string;
  username: string;
  tag?: string;
  manageUrl?: string;
  subscriptionUrl?: string;
  happ?: {
    cryptoLink: string;
  };
}

function AppContent() {
  const webApp = window.Telegram.WebApp;
  const user = webApp.initDataUnsafe?.user;
  const { setColorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);

  // Telegram'ın renk şemasına (koyu/açık mod) uyum sağla
  useEffect(() => {
    setColorScheme(webApp.colorScheme);
    webApp.ready(); // Uygulamanın yüklendiğini Telegram'a bildir
  }, [setColorScheme, webApp.colorScheme, webApp]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadAccount = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/account', {
          method: 'POST', // Metodu GET yerine POST olarak değiştir
          headers: {
            'x-telegram-init-data': webApp.initData ?? '',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Hesap bilgileri alınamadı: ${response.status}`);
        }

        const data: AccountResponse = await response.json();
        if (!isMounted) return;
        setAccount(data);
      } catch (err) {
        if (!isMounted || (err instanceof DOMException && err.name === 'AbortError')) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
        setError(message);
        setAccount(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user, webApp.initData, webApp]);

  const accountStats = useMemo(() => {
    if (!account) {
      return null;
    }

    const limit = account.trafficLimitBytes ?? 0;
    const used = account.usedTrafficBytes ?? 0;
    const remaining = Math.max(limit - used, 0);
    const usagePercentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

    return {
      limit,
      used,
      remaining,
      usagePercentage,
    };
  }, [account]);

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) {
      return '0 B';
    }

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
    if (!isoDate) {
      return 'Belirsiz';
    }

    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return isoDate;
    }

    return date.toLocaleString('tr-TR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const statusConfig = (status: AccountResponse['status']) => {
    const normalized = status?.toLowerCase();

    switch (normalized) {
      case 'active':
        return {
          color: 'teal',
          label: 'Aktif',
          icon: <IconCircleCheck size={16} />,
        };
      case 'inactive':
        return {
          color: 'gray',
          label: 'Pasif',
          icon: <IconClock size={16} />,
        };
      case 'expired':
        return {
          color: 'red',
          label: 'Süresi Dolmuş',
          icon: <IconBan size={16} />,
        };
      case 'suspended':
        return {
          color: 'orange',
          label: 'Askıya Alındı',
          icon: <IconAlertTriangle size={16} />,
        };
      default:
        return {
          color: 'blue',
          label: status ?? 'Bilinmiyor',
          icon: <IconHelp size={16} />,
        };
    }
  };

  const openExternalLink = (url: string | undefined) => {
    if (!url) return;

    if (typeof webApp.openTelegramLink === 'function') {
      webApp.openTelegramLink(url);
    } else if (typeof webApp.openLink === 'function') {
      webApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
  };

  // Manuel tema değiştirme butonu (isteğe bağlı)
  const ColorSchemeToggle = () => {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    return (
      <ActionIcon
        onClick={() => toggleColorScheme()}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
      </ActionIcon>
    );
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>VPN Bot</Title>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack>
          {user ? (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack>
                <Title order={4}>Hoş Geldin, {user.first_name}!</Title>
                <Text size="sm" c="dimmed">
                  Hesap bilgilerin aşağıda görüntüleniyor.
                </Text>

                {user.username && (
                  <Badge color="blue" variant="light">
                    Kullanıcı Adı: @{user.username}
                  </Badge>
                )}

                {loading ? (
                  <Group justify="center" my="lg">
                    <Loader color="blue" />
                  </Group>
                ) : error ? (
                  <Alert color="red" icon={<IconAlertTriangle />} title="Bir sorun oluştu">
                    {error}
                  </Alert>
                ) : account ? (
                  <Stack gap="sm">
                    <Group gap="xs" align="center">
                      <ThemeIcon color={statusConfig(account.status).color} variant="light" radius="xl">
                        {statusConfig(account.status).icon}
                      </ThemeIcon>
                      <Badge color={statusConfig(account.status).color} size="lg" radius="sm">
                        {statusConfig(account.status).label}
                      </Badge>
                    </Group>

                    <Text size="sm" c="dimmed">
                      Son Kullanma Tarihi: {formatExpireDate(account.expireAt)}
                    </Text>

                    {accountStats && (
                      <Stack gap={4}>
                        <Text size="sm">Kota Kullanımı:</Text>
                        <Code block>
                          {`${formatBytes(accountStats.used)} / ${formatBytes(accountStats.limit)} (${accountStats.usagePercentage.toFixed(0)}% kullanıldı, ${formatBytes(accountStats.remaining)} kaldı)`}
                        </Code>
                      </Stack>
                    )}

                    {account.happ?.cryptoLink && (
                      <Button
                        variant="light"
                        color="blue"
                        onClick={() => openExternalLink(account.happ!.cryptoLink)}
                      >
                        Happ CryptoLink'i Aç
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Alert color="yellow" icon={<IconAlertTriangle />} title="Bilgi">
                    Hesap bilgileri bulunamadı.
                  </Alert>
                )}

                <Group grow mt="md">
                  <Button
                    variant="light"
                    color="blue"
                    onClick={() => openExternalLink(account?.manageUrl ?? 'https://t.me/')}
                    disabled={!account && !error}
                  >
                    Hesabımı Yönet
                  </Button>
                  <Button
                    variant="filled"
                    color="teal"
                    onClick={() => openExternalLink(account?.subscriptionUrl ?? 'https://t.me/')}
                  >
                    Abonelik Satın Al
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Text>Kullanıcı bilgileri yüklenemedi. Lütfen uygulamanın Telegram üzerinden açıldığından emin olun.</Text>
            </Card>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  // Tercih edilen renk şemasını al (sistem veya tarayıcı ayarı)
  const preferredColorScheme = useColorScheme();

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppContent />
    </MantineProvider>
  );
}

export default App;
