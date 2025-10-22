import { useEffect, useMemo, useState } from 'react';
import {
  MantineProvider,
  AppShell,
  Text,
  Button,
  Group,
  Title,
  Stack,
  Badge,
  Code,
  Loader,
  Alert,
  ThemeIcon,
  Progress,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import {
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
import InstallSetup from './InstallSetup';
import InstallOnThisDevice from './InstallOnThisDevice';
import AddSubscription from './AddSubscription';
import Congratulations from './Congratulations';

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
  onlineAt?: string | null;
  lastConnectedNode?: {
    connectedAt?: string | null;
    nodeName?: string;
    countryCode?: string;
  } | null;
  happ?: {
    cryptoLink: string;
  };
}

// AccountPage bileşeni, hesap detaylarını gösterecek
function AccountPage({}: { onBack?: () => void }) {
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
      case 'disabled':
        return {
          color: 'red',
          label: 'Devre Dışı',
          icon: <IconBan size={16} />,
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

  const openExternalLink = async (rawUrl: string | undefined, fallbackUrl?: string) => {
    // Haptic feedback
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}

    if (!rawUrl) {
      console.warn('Açılacak URL bulunamadı.');
      return;
    }

    const url = encodeURI(rawUrl);
    const isHttp = /^https?:\/\//i.test(url);
    const isCustomScheme = /^[a-z][a-z0-9+.-]*:/i.test(url) && !isHttp;
    const ua = navigator.userAgent;
    const isAndroid = /Android/.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);

    if (!isCustomScheme) {
      if (window.Telegram?.WebApp && typeof window.Telegram.WebApp.openLink === 'function') {
        window.Telegram.WebApp.openLink(url);
      } else {
        window.open(url, '_blank', 'noopener');
      }
      return;
    }

    // Android: intent:// ile açmayı dene
    if (isAndroid) {
      const noScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
      const intent = `intent://${noScheme}#Intent;scheme=happ;package=com.happproxy;S.browser_fallback_url=${encodeURIComponent(fallbackUrl || 'https://play.google.com/store/apps/details?id=com.happproxy')};end`;
      try {
        window.location.href = intent;
      } catch {
        window.open(intent, '_self');
      }
      return;
    }
  
  // iOS: Telegram WebView özel şemayı engelleyebilir; kullanıcıya kopyalama ve App Store fallback göster
  if (isIOS) {
    try {
      await navigator.clipboard?.writeText(rawUrl);
    } catch {}
    try {
      if (window.Telegram?.WebApp?.showPopup) {
        window.Telegram.WebApp.showPopup({
          title: 'Happ bağlantısı',
          message: 'iOS Telegram mini app kısıtlaması nedeniyle bağlantı kopyalandı. Safari’de açıp adres çubuğuna yapıştırın.',
          buttons: [
            { id: 'store', type: 'default', text: 'App Store' },
            { id: 'ok', type: 'ok', text: 'Tamam' },
          ],
        }, (btnId: string) => {
          if (btnId === 'store') {
            const store = 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215';
            window.Telegram?.WebApp?.openLink?.(store);
          }
        });
      } else {
        alert('Bağlantı kopyalandı. Safari’de açıp adres çubuğuna yapıştırın.');
      }
    } catch {}
    return;
  } else {
    // masaüstü ya da bilinmeyen ortam: şansını dene
    try { window.open(url, '_self'); } catch {}
  }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px', width: '100%' }}>
      {/* İç çerçeve */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: '#0006',
          overflow: 'auto',
          zIndex: 2,
          position: 'relative',
          padding: 30,
          flexDirection: 'column',
          borderRadius: '1rem',
          maxHeight: '90%',
          boxShadow: 'none',
          border: 'none',
        }}
      >
      <Stack>
        {user ? (
          <div>
            <Stack gap="md">
              <Title order={4} style={{ color: '#fff' }}>Hoş Geldin, {user.first_name}!</Title>
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
                  <Group gap="xs" align="center" wrap="wrap">
                    <ThemeIcon color={statusConfig(account.status).color} variant="light" radius="xl">
                      {statusConfig(account.status).icon}
                    </ThemeIcon>
                    <Badge color={statusConfig(account.status).color} size="lg" radius="sm">
                      {statusConfig(account.status).label}
                    </Badge>
                    {account.tag && (
                      <Badge color="violet" size="lg" radius="sm" variant="dot">
                        {account.tag}
                      </Badge>
                    )}
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
                        <ThemeIcon color="teal" variant="light" radius="xl">
                          <IconGauge size={16} />
                        </ThemeIcon>
                        <Text size="sm" style={{ color: '#14b8a6' }}>Kota Kullanımı:</Text>
                      </Group>
                      <Progress
                        value={accountStats.usagePercentage}
                        size="lg"
                        radius="xl"
                        color="teal"
                      />
                      <Text size="sm" c="dimmed" mt={4}>
                        {`${accountStats.usagePercentage.toFixed(0)}% kullanıldı`}
                      </Text>
                      <Code block style={{ backgroundColor: '#0009', color: '#14b8a6', border: '1px solid #14b8a6' }}>
                        {`${formatBytes(accountStats.used)} / ${formatBytes(accountStats.limit)} (${formatBytes(accountStats.remaining)} kaldı)`}
                      </Code>
                    </Stack>
                  )}

              {account.subscriptionUrl && (
                <Button
                  variant="light"
                  color="blue"
                  onClick={() => openExternalLink(account.subscriptionUrl)}
                  fullWidth
                >
                  Abonelik Linkini Aç
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
                  onClick={() => openExternalLink(account?.subscriptionUrl ?? account?.manageUrl ?? 'https://t.me/')}
                  disabled={!account && !error}
                >
                  Abonelik Linkini Aç
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

function App() {
  const preferredColorScheme = useColorScheme();
  const webApp = window.Telegram.WebApp;

  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'account' | 'buySubscription' | 'installSetup' | 'installOnThisDevice' | 'addSubscription' | 'congratulations'>(() => {
    // localStorage'dan kaydedilmiş ekranı al
    const saved = localStorage.getItem('currentScreen');
    return (saved as any) || 'welcome';
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [screenHistory, setScreenHistory] = useState<Array<'welcome' | 'account' | 'buySubscription' | 'installSetup' | 'installOnThisDevice' | 'addSubscription' | 'congratulations'>>(['welcome']);
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'offline' | null>(null);
  const [accountData, setAccountData] = useState<Partial<AccountResponse> | null>(null);

  // currentScreen değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
    // Debug: history length
    console.log('Screen history length:', screenHistory.length);
  }, [currentScreen, screenHistory]);

  useEffect(() => {
    webApp.ready();
    
    // Üst barı yeşil yap
    webApp.setHeaderColor('#004f39');
    webApp.setBackgroundColor('#00150f');
    
    // BackButton kontrolü
    const backButton = webApp.BackButton;
    
    if (currentScreen === 'welcome') {
      // Ana sayfada BackButton'u gizle
      backButton?.hide();
    } else {
      // Alt sayfalarda BackButton'u göster
      backButton?.show();
      
      // BackButton tıklandığında bir önceki sayfaya dön
      const handleBackClick = () => {
        try {
          webApp?.HapticFeedback?.impactOccurred?.('light');
        } catch {}
        
        setScreenHistory(prev => {
          if (prev.length > 1) {
            const newHistory = [...prev];
            newHistory.pop(); // Mevcut sayfayı çıkar
            const previousScreen = newHistory[newHistory.length - 1];
            setCurrentScreen(previousScreen);
            return newHistory;
          }
          return prev;
        });
      };
      
      backButton?.onClick(handleBackClick);
      
      // Cleanup: event listener'ı kaldır
      return () => {
        backButton?.offClick(handleBackClick);
      };
    }
  }, [webApp, currentScreen]);

  // App açılışında tek seferlik çevrimiçi kontrolü
  useEffect(() => {
    let cancelled = false;

    const getAccount = async () => {
      try {
        const res = await fetch('/api/account', {
          headers: { 'x-telegram-init-data': webApp.initData ?? '' },
        });
        if (!res.ok) return null;
        return (await res.json()) as Partial<AccountResponse> | null;
      } catch {
        return null;
      }
    };

    const measureOnce = async () => {
      const acc = (await getAccount()) as Partial<AccountResponse> | null;
      if (cancelled) return;
      setAccountData(acc); // Hesap bilgilerini kaydet
      const status = String(acc?.status ?? '').toLowerCase();
      const onlineAtMs = acc?.onlineAt ? Date.parse(acc.onlineAt) : 0;
      const connectedAtMs = acc?.lastConnectedNode?.connectedAt ? Date.parse(acc.lastConnectedNode.connectedAt) : 0;
      const freshest = Math.max(onlineAtMs || 0, connectedAtMs || 0);
      const now = Date.now();
      const ONLINE_STALE_MS = 2 * 60 * 1000; // 2 dakika içinde bağlantı varsa online kabul et

      const isFresh = Number.isFinite(freshest) && freshest > 0 && now - freshest <= ONLINE_STALE_MS;
      setOnlineStatus(status === 'active' && isFresh ? 'online' : 'offline');
    };

    measureOnce();
    return () => { cancelled = true; };
  }, [webApp.initData]);

  const handleViewAccount = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    setScreenHistory(prev => [...prev, 'account']);
    setCurrentScreen('account');
  };

  const handleBuySubscription = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    setScreenHistory(prev => [...prev, 'buySubscription']);
    setCurrentScreen('buySubscription'); // buySubscription ekranına geçiş
  };

  const handleInstallSetup = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    setScreenHistory(prev => [...prev, 'installSetup']);
    setCurrentScreen('installSetup');
  };

  const handleSupport = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    console.log('Destek');
  };

  const handleInstallOnThisDevice = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    setScreenHistory(prev => [...prev, 'installOnThisDevice']);
    setCurrentScreen('installOnThisDevice');
  };

  const handleInstallOnThisDeviceNext = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    // Abonelik sayfasına geç
    setScreenHistory(prev => [...prev, 'addSubscription']);
    setCurrentScreen('addSubscription');
  };

  const handleAddSubscriptionNext = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    // Tebrikler sayfasına geç
    setScreenHistory(prev => [...prev, 'congratulations']);
    setCurrentScreen('congratulations');
  };

  const handleCongratulationsFinish = () => {
    try {
      webApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
    // Ana sayfaya dön ve geçmişi sıfırla
    setScreenHistory(['welcome']);
    setCurrentScreen('welcome');
  };

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppShell padding="md">
        <AppShell.Main>
          <Group justify="center" align="center" style={{ width: '100%', minHeight: '100dvh' }}>
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onViewAccount={handleViewAccount}
                onBuySubscription={handleBuySubscription}
                onInstallSetup={handleInstallSetup}
                onSupport={handleSupport}
                onlineStatus={onlineStatus}
                expireAt={accountData?.expireAt}
              />
            )}
            {currentScreen === 'account' && (
              <AccountPage />
            )}
            {currentScreen === 'buySubscription' && (
              <BuySubscription />
            )}
            {currentScreen === 'installSetup' && (
              <InstallSetup onInstallOnThisDevice={handleInstallOnThisDevice} />
            )}
            {currentScreen === 'installOnThisDevice' && (
              <InstallOnThisDevice onNext={handleInstallOnThisDeviceNext} />
            )}
            {currentScreen === 'addSubscription' && (
              <AddSubscription 
                onNext={handleAddSubscriptionNext}
                subscriptionUrl={accountData?.happ?.cryptoLink}
              />
            )}
            {currentScreen === 'congratulations' && (
              <Congratulations onFinish={handleCongratulationsFinish} />
            )}
          </Group>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
