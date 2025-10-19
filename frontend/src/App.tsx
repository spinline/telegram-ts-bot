import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Progress,
  Divider,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { IconSun, IconMoon, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import '@mantine/core/styles.css';

type AccountStatus = 'ACTIVE' | 'DISABLED' | 'LIMITED' | 'EXPIRED' | string;

interface AccountResponse {
  username: string;
  tag?: string | null;
  status: AccountStatus;
  expireAt?: string;
  trafficLimitBytes?: number;
  usedTrafficBytes?: number;
  happ?: {
    cryptoLink?: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const STATUS_META: Record<string, { color: string; label: string; message: string }> = {
  ACTIVE: {
    color: 'teal',
    label: 'Aktif',
    message: 'Hesabınız aktif ve kullanıma hazır.',
  },
  LIMITED: {
    color: 'yellow',
    label: 'Limitli',
    message: 'Trafik limitiniz dolmak üzere. Aboneliğinizi yenilemeyi düşünün.',
  },
  EXPIRED: {
    color: 'red',
    label: 'Süresi Doldu',
    message: 'Aboneliğiniz sona ermiş görünüyor. Bot üzerinden yenileyebilirsiniz.',
  },
  DISABLED: {
    color: 'gray',
    label: 'Pasif',
    message: 'Hesabınız pasif durumda. Destek ekibimizle iletişime geçebilirsiniz.',
  },
};

function getStatusInfo(status: AccountStatus) {
  return (
    STATUS_META[status] ?? {
      color: 'gray',
      label: status || 'Bilinmiyor',
      message: 'Hesap durumu doğrulanamadı. Lütfen daha sonra tekrar deneyin.',
    }
  );
}

function formatDate(value?: string) {
  if (!value) {
    return 'Bilinmiyor';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatBytesToGB(bytes?: number) {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return '0.00 GB';
  }

  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

function calculateUsagePercent(limit?: number, used?: number) {
  if (!limit || limit <= 0) {
    return 0;
  }

  const percent = ((used ?? 0) / limit) * 100;
  return Math.min(100, Math.max(0, percent));
}

function AppContent() {
  const webApp = window.Telegram?.WebApp;
  const telegramUser = webApp?.initDataUnsafe?.user;
  const { setColorScheme } = useMantineColorScheme();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Telegram'ın renk şemasına (koyu/açık mod) uyum sağla
  useEffect(() => {
    if (!webApp) {
      setError('Telegram Web App ortamı bulunamadı. Lütfen bot üzerinden açın.');
      setLoading(false);
      return;
    }

    setColorScheme(webApp.colorScheme ?? 'light');
    webApp.ready?.(); // Uygulamanın yüklendiğini Telegram'a bildir
    webApp.expand?.();

    const handleThemeChange = () => setColorScheme(webApp.colorScheme ?? 'light');
    webApp.onEvent?.('themeChanged', handleThemeChange);

    return () => {
      webApp.offEvent?.('themeChanged', handleThemeChange);
    };
  }, [setColorScheme, webApp]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    if (!webApp.initData || !telegramUser) {
      setError('Kullanıcı bilgileri alınamadı. Uygulamayı Telegram botu üzerinden açmayı deneyin.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchAccount = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': webApp.initData,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const message =
            data?.error ||
            data?.message ||
            (response.status === 404
              ? 'Sistemde kayıtlı bir hesabınız bulunamadı.'
              : 'Hesap bilgileri alınamadı.');
          throw new Error(message);
        }

        const data: AccountResponse = await response.json();
        setAccount(data);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setAccount(null);
        const message = error instanceof Error ? error.message : 'Hesap bilgileri alınamadı.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();

    return () => {
      controller.abort();
    };
  }, [webApp, telegramUser, refreshIndex]);

  const handleRefresh = () => setRefreshIndex((index) => index + 1);

  const statusInfo = useMemo(() => getStatusInfo(account?.status ?? ''), [account?.status]);
  const trafficLimit = account?.trafficLimitBytes ?? 0;
  const trafficUsed = account?.usedTrafficBytes ?? 0;
  const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
  const usagePercent = calculateUsagePercent(trafficLimit, trafficUsed);

  const usageColor = usagePercent > 90 ? 'red' : usagePercent > 70 ? 'yellow' : 'teal';

  const isNotFoundError = error ? /hesabınız bulunamadı/i.test(error) : false;

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

  // Manuel tema değiştirme butonu (isteğe bağlı)
  let mainContent: ReactNode;

  if (loading) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group gap="sm">
          <Loader color="teal" />
          <Text size="sm">Hesap bilgilerin yükleniyor...</Text>
        </Group>
      </Card>
    );
  } else if (error) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack>
          <Alert
            icon={<IconAlertCircle size={18} />}
            color={isNotFoundError ? 'yellow' : 'red'}
            title={isNotFoundError ? 'Hesap bulunamadı' : 'Bir sorun oluştu'}
            variant="light"
          >
            <Text>{error}</Text>
            {isNotFoundError && (
              <Text size="sm" c="dimmed" mt="xs">
                Telegram bot içerisindeki "Try for Free" veya "Hesabım" seçeneklerini kullanarak kayıt oluşturabilirsiniz.
              </Text>
            )}
          </Alert>
          <Group justify="flex-end">
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              color="blue"
              onClick={handleRefresh}
            >
              Tekrar dene
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  } else if (account) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={4}>
                Hoş geldin{telegramUser?.first_name ? `, ${telegramUser.first_name}` : ''}!
              </Title>
              <Text size="sm" c="dimmed">
                Hesabınla ilgili güncel bilgiler aşağıda listeleniyor.
              </Text>
            </div>
            <Stack gap={6} align="flex-end">
              {account.tag && (
                <Badge color="violet" variant="light">
                  {account.tag}
                </Badge>
              )}
              {telegramUser?.username && (
                <Badge variant="outline" color="gray">
                  @{telegramUser.username}
                </Badge>
              )}
            </Stack>
          </Group>

          <Divider label="Abonelik durumu" labelPosition="left" />

          <Stack gap="xs">
            <Group gap="xs">
              <Badge color={statusInfo.color} size="lg" radius="sm">
                {statusInfo.label}
              </Badge>
              <Text size="sm">{statusInfo.message}</Text>
            </Group>

            <Text size="sm" c="dimmed">
              VPN kullanıcı adın
            </Text>
            <Code radius="sm" fw={600}>
              {account.username}
            </Code>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Abonelik bitiş tarihi
            </Text>
            <Text fw={600}>{formatDate(account.expireAt)}</Text>
          </Stack>

          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              Trafik kullanımı
            </Text>
            <Progress value={usagePercent} color={usageColor} radius="xl" size="lg" />
            <Group justify="space-between">
              <Text size="sm">Kalan: {formatBytesToGB(trafficRemaining)}</Text>
              <Text size="sm" c="dimmed">
                {formatBytesToGB(trafficUsed)} / {formatBytesToGB(trafficLimit)}
              </Text>
            </Group>
          </Stack>

          {account.happ?.cryptoLink && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Happ CryptoLink
              </Text>
              <Code block>{account.happ.cryptoLink}</Code>
            </Stack>
          )}

          <Group justify="space-between">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
            >
              Bilgileri yenile
            </Button>
            <Button color="teal" onClick={() => webApp?.close?.()}>
              Bot&apos;a dön
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  } else {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text>Kullanıcı bilgileri yüklenemedi. Lütfen uygulamayı Telegram üzerinden açtığınızdan emin olun.</Text>
      </Card>
    );
  }

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
        <Stack>{mainContent}</Stack>
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
