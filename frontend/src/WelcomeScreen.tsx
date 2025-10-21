import { Button, Group, Stack, Text, Title, ThemeIcon, Card, Container, Loader, Badge } from '@mantine/core';
import { IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
}

function WelcomeScreen({ onViewAccount, onBuySubscription, onInstallSetup, onSupport }: WelcomeScreenProps) {
  // Telegram WebApp ve kullanıcıyı al
  const webApp = (window as any)?.Telegram?.WebApp;
  const user = webApp?.initDataUnsafe?.user;

  // Hesap durumu için basit state
  const [loading, setLoading] = useState<boolean>(true);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      webApp?.ready?.();
    } catch {}
  }, [webApp]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAccount = async () => {
      if (!user) {
        setLoading(false);
        setAccountStatus(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/account', {
          headers: {
            'x-telegram-init-data': webApp?.initData ?? '',
          },
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setAccountStatus(String(data?.status ?? ''));
        } else {
          setAccountStatus(null);
        }
      } catch {
        if (!isMounted) return;
        setAccountStatus(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAccount();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user, webApp?.initData]);

  const isOnline = useMemo(() => {
    const normalized = (accountStatus || '').toLowerCase();
    return normalized === 'active';
  }, [accountStatus]);

  return (
    <Container size={560} px="md" py="xl" mx="auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" mx="auto">
        <Stack align="center" gap="xl">
          <div
            className="shield-ripple"
            style={{
              // CSS custom property ile sinyal rengi (online/çevrimdışı)
              ['--signal-color' as any]: isOnline ? 'rgba(20, 184, 166, 0.55)' : 'rgba(240, 62, 62, 0.55)',
            }}
          >
            <div className="ripple ripple-1" />
            <div className="ripple ripple-2" />
            <div className="ripple ripple-3" />
            <ThemeIcon variant="filled" size={120} radius="xl" color={isOnline ? 'teal' : 'red'} className="shield-core">
              <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
            </ThemeIcon>
          </div>

          {/* Online / Çevrimdışı Durumu */}
          {loading ? (
            <Group gap="xs" align="center">
              <Loader size="sm" color="gray" />
              <Text size="sm" c="dimmed">Durum alınıyor…</Text>
            </Group>
          ) : (
            <Badge size="lg" radius="sm" color={isOnline ? 'teal' : 'red'} variant="light">
              {isOnline ? 'Online' : 'Çevrimdışı'}
            </Badge>
          )}

          <Stack align="center" gap="xs">
            <Title order={2}>Hoş Geldiniz!</Title>
            <Text c="dimmed">Botunuz kullanıma hazır.</Text>
          </Stack>

          <Stack w="100%" gap="md">
            <Button
              leftSection={<IconShoppingCart size={20} />}
              color="green"
              size="lg"
              radius="md"
              fullWidth
              onClick={onBuySubscription}
            >
              Abonelik Satın Al
            </Button>

            <Button
              leftSection={<IconSettings size={20} />}
              variant="light"
              color="blue"
              radius="md"
              fullWidth
              onClick={onInstallSetup}
            >
              Kurulum ve Ayarlar (iOS)
            </Button>

            <Group grow>
              <Button
                leftSection={<IconUser size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={onViewAccount}
              >
                Hesabım
              </Button>
              <Button
                leftSection={<IconHeadset size={20} />}
                variant="light"
                color="gray"
                radius="md"
                onClick={onSupport}
              >
                Destek
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}

export default WelcomeScreen;
