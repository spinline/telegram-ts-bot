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
  Container,
  Progress,
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
  IconGauge,
  IconCalendar,
} from '@tabler/icons-react';
import '@mantine/core/styles.css';
import WelcomeScreen from './WelcomeScreen';
import BuySubscription from './BuySubscription'; // BuySubscription bileşenini içe aktar

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

// AccountPage bileşeni, hesap detaylarını gösterecek
function AccountPage() {
  const webApp = window.Telegram.WebApp;
  const user = webApp.initDataUnsafe?.user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountResponse | null>(null);

  useEffect(() => {
    webApp.ready();
  }, [webApp.colorScheme, webApp]);

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
    if (!url) {
      console.warn('Açılacak URL bulunamadı.');
      return;
    }

    if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openLink === 'function') {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <Container size="sm" py="xl" mx="auto">
      <Stack>
        {user ? (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Title order={4}>Hoş Geldin, {user.first_name}!</Title>
              <Text size="sm" c="dimmed">
                Hesap bilgilerin aşağıda görüntüleniyor.
              </Text>

              {user.username && (
                <Badge color="blue" variant="light" size="lg">
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

                  <Group gap="xs" align="center">
                    <ThemeIcon color="gray" variant="light" radius="xl">
                      <IconCalendar size={16} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">
                      Son Kullanma Tarihi: {formatExpireDate(account.expireAt)}
                    </Text>
                  </Group>

                  {accountStats && (
                    <Stack gap={4}>
                      <Group gap="xs" align="center">
                        <ThemeIcon color="grape" variant="light" radius="xl">
                          <IconGauge size={16} />
                        </ThemeIcon>
                        <Text size="sm">Kota Kullanımı:</Text>
                      </Group>
                      <Progress
                        value={accountStats.usagePercentage}
                        size="lg"
                        radius="xl"
                        color="grape"
                      />
                      <Text size="sm" c="dimmed" mt={4}>
                        {`${accountStats.usagePercentage.toFixed(0)}% kullanıldı`}
                      </Text>
                      <Code block>
                        {`${formatBytes(accountStats.used)} / ${formatBytes(accountStats.limit)} (${formatBytes(accountStats.remaining)} kaldı)`}
                      </Code>
                    </Stack>
                  )}

                  {account.happ?.cryptoLink && (
                    <Button
                      variant="light"
                      color="blue"
                      onClick={() => openExternalLink(account.manageUrl ?? 'https://t.me/')}
                      fullWidth
                    >
                      Hesabımı Yönet
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
    </Container>
  );
}

function App() {
  const preferredColorScheme = useColorScheme();
  const { setColorScheme } = useMantineColorScheme();
  const webApp = window.Telegram.WebApp;

  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'account' | 'buySubscription'>('welcome'); // buySubscription eklendi

  useEffect(() => {
    setColorScheme(webApp.colorScheme);
    webApp.ready();
  }, [setColorScheme, webApp.colorScheme, webApp]);

  const handleViewAccount = () => {
    setCurrentScreen('account');
  };

  const handleBuySubscription = () => {
    setCurrentScreen('buySubscription'); // buySubscription ekranına geçiş
  };

  const handleInstallSetup = () => {
    console.log('Kurulum ve ayarlar');
  };

  const handleSupport = () => {
    console.log('Destek');
  };

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
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppShell
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Title order={3}>AuronVPN</Title>
            <ColorSchemeToggle />
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Group justify="center" style={{ width: '100%', height: '100%' }}>
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onViewAccount={handleViewAccount}
                onBuySubscription={handleBuySubscription}
                onInstallSetup={handleInstallSetup}
                onSupport={handleSupport}
              />
            )}
            {currentScreen === 'account' && (
              <AccountPage />
            )}
            {currentScreen === 'buySubscription' && (
              <BuySubscription onBack={() => setCurrentScreen('welcome')} />
            )}
          </Group>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
