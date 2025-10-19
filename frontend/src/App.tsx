import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Space,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import {
  IconSun,
  IconMoon,
  IconAlertCircle,
  IconRefresh,
  IconInfoCircle,
  IconCheck,
  IconSparkles,
} from '@tabler/icons-react';
import '@mantine/core/styles.css';

import {
  ApiError,
  createTrialAccount,
  fetchAccount,
  type AccountResponse,
} from './api/account';
import './App.css';

type AccountStatus = 'ACTIVE' | 'DISABLED' | 'LIMITED' | 'EXPIRED' | string;

type AccountError = {
  message: string;
  status?: number;
  data?: unknown;
};

type Feedback = {
  type: 'success' | 'info';
  message: string;
};

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

const getStatusInfo = (status: AccountStatus) =>
  STATUS_META[status] ?? {
    color: 'gray',
    label: status || 'Bilinmiyor',
    message: 'Hesap durumu doğrulanamadı. Lütfen daha sonra tekrar deneyin.',
  };

const formatDate = (value?: string) => {
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
};

const formatBytesToGB = (bytes?: number) => {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return '0.00 GB';
  }

  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};

const calculateUsagePercent = (limit?: number, used?: number) => {
  if (!limit || limit <= 0) {
    return 0;
  }

  const percent = ((used ?? 0) / limit) * 100;
  return Math.min(100, Math.max(0, percent));
};

const buildNotFoundMessage = () =>
  'Sistemde kayıtlı bir hesabınız bulunamadı. Aşağıdaki adımları izleyerek birkaç saniye içerisinde ücretsiz deneme hesabı oluşturabilirsiniz.';

const useTelegramThemeSync = (webApp: TelegramWebApp | undefined | null) => {
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (!webApp) {
      return;
    }

    setColorScheme(webApp.colorScheme ?? 'light');
    webApp.ready?.();
    webApp.expand?.();

    const handleThemeChange = () => setColorScheme(webApp.colorScheme ?? 'light');
    webApp.onEvent?.('themeChanged', handleThemeChange);

    return () => {
      webApp.offEvent?.('themeChanged', handleThemeChange);
    };
  }, [setColorScheme, webApp]);
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

function AppContent() {
  const webApp = window.Telegram?.WebApp;
  const telegramUser = webApp?.initDataUnsafe?.user;
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AccountError | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [trialLoading, setTrialLoading] = useState(false);

  useTelegramThemeSync(webApp);

  useEffect(() => {
    if (!webApp) {
      setError({
        message: 'Telegram Web App ortamı bulunamadı. Lütfen bot üzerinden açın.',
      });
      setLoading(false);
    }
  }, [webApp]);

  useEffect(() => {
    if (!webApp) {
      return;
    }

    const initData = webApp.initData;

    if (!initData || !telegramUser) {
      setAccount(null);
      setError({
        message:
          'Kullanıcı bilgileri alınamadı. Uygulamayı Telegram botu üzerinden açmayı deneyin.',
        status: 401,
      });
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadAccount = async () => {
      setLoading(true);
      setError(null);
      setFeedback(null);

      try {
        const data = await fetchAccount(initData, { signal: controller.signal });
        setAccount(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setAccount(null);

        if (err instanceof ApiError) {
          const isNotFound = err.status === 404;
          setError({
            message: isNotFound ? buildNotFoundMessage() : err.message,
            status: err.status,
            data: err.data,
          });
        } else if (err instanceof Error) {
          setError({ message: err.message });
        } else {
          setError({ message: 'Hesap bilgileri alınamadı.' });
        }
      } finally {
        setLoading(false);
      }
    };

    loadAccount();

    return () => {
      controller.abort();
    };
  }, [webApp, telegramUser, refreshIndex]);

  const handleRefresh = useCallback(() => {
    setRefreshIndex((index) => index + 1);
  }, []);

  const handleCreateTrial = useCallback(async () => {
    const initData = webApp?.initData;

    if (!initData) {
      setError({ message: 'Telegram doğrulama bilgisine erişilemiyor.' });
      return;
    }

    setTrialLoading(true);
    setFeedback(null);

    try {
      const response = await createTrialAccount(initData);
      setAccount(response.account);
      setError(null);
      setFeedback({
        type: 'success',
        message: 'Deneme hesabınız birkaç saniye içinde hazırlandı. Güle güle kullanın! 🎉',
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const existingAccount =
            err.data && typeof err.data === 'object' && 'account' in err.data
              ? (err.data as { account?: AccountResponse }).account
              : undefined;

          if (existingAccount) {
            setAccount(existingAccount);
            setError(null);
            setFeedback({
              type: 'info',
              message: 'Bu Telegram hesabı zaten kayıtlı. Bilgileriniz aşağıda güncellendi.',
            });
          } else {
            setFeedback({ type: 'info', message: err.message });
          }
        } else {
          setError({ message: err.message, status: err.status, data: err.data });
        }
      } else if (err instanceof Error) {
        setError({ message: err.message });
      } else {
        setError({ message: 'Deneme hesabı oluşturulamadı. Lütfen daha sonra tekrar deneyin.' });
      }
    } finally {
      setTrialLoading(false);
    }
  }, [webApp?.initData]);

  const statusInfo = useMemo(() => getStatusInfo(account?.status ?? ''), [account?.status]);
  const trafficLimit = account?.trafficLimitBytes ?? 0;
  const trafficUsed = account?.usedTrafficBytes ?? 0;
  const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
  const usagePercent = calculateUsagePercent(trafficLimit, trafficUsed);
  const usageColor = usagePercent > 90 ? 'red' : usagePercent > 70 ? 'yellow' : 'teal';

  const isNotFoundError = error?.status === 404;

  let mainContent: ReactNode;

  if (loading) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group gap="sm">
          <Loader color="teal" />
          <Text size="sm">Hesap bilgileriniz hazırlanıyor...</Text>
        </Group>
      </Card>
    );
  } else if (error && !isNotFoundError) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack>
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="red"
            title="Bir sorun oluştu"
            variant="light"
          >
            <Text>{error.message}</Text>
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
  } else if (isNotFoundError) {
    mainContent = (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={18} />} title="Hesap bulunamadı" color="yellow" variant="light">
            <Stack gap={4}>
              <Text size="sm">{error?.message}</Text>
              <Text size="sm" c="dimmed">
                Telegram hesabınızla deneme hesabı oluşturduğunuzda bilgileriniz otomatik olarak burada görüntülenecektir.
              </Text>
            </Stack>
          </Alert>
          <Button
            color="teal"
            size="md"
            leftSection={<IconSparkles size={16} />}
            onClick={handleCreateTrial}
            loading={trialLoading}
          >
            Ücretsiz deneme hesabı oluştur
          </Button>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            disabled={trialLoading}
          >
            Yeniden kontrol et
          </Button>
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
            <Code fw={600}>{account.username}</Code>
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
        <Text>
          Kullanıcı bilgileri yüklenemedi. Lütfen uygulamayı Telegram üzerinden açtığınızdan emin olun.
        </Text>
      </Card>
    );
  }

  const feedbackAlert = feedback ? (
    <Alert
      icon={feedback.type === 'success' ? <IconCheck size={18} /> : <IconInfoCircle size={18} />}
      color={feedback.type === 'success' ? 'teal' : 'blue'}
      variant="light"
      radius="md"
    >
      <Text size="sm">{feedback.message}</Text>
    </Alert>
  ) : null;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>VPN Bot</Title>
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack gap="md">
          {feedbackAlert}
          {mainContent}
          <Space h="md" />
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  const preferredColorScheme = useColorScheme();

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppContent />
    </MantineProvider>
  );
}

export default App;

