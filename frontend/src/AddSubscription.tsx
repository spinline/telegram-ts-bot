import { Stack, Text, ThemeIcon, Group, Title } from '@mantine/core';
import { IconShield, IconPlus, IconArrowRight } from '@tabler/icons-react';

interface AddSubscriptionProps {
  onNext: () => void;
  subscriptionUrl?: string;
}

export default function AddSubscription({ onNext, subscriptionUrl }: AddSubscriptionProps) {
  // Haptic feedback
  const triggerHaptic = () => {
    try {
      (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {}
  };

  const handleAddSubscription = () => {
    triggerHaptic();
    // Sadece Happ crypto linki aç
    if (subscriptionUrl) {
      window.open(subscriptionUrl, '_blank');
    }
  };

  const handleNext = () => {
    triggerHaptic();
    if (subscriptionUrl) {
      window.open(subscriptionUrl, '_blank');
    }
    onNext();
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px', width: '100%' }}>
      {/* Kalkan iç çerçevenin dışında */}
      <div
        className="shield-ripple"
        style={{
          position: 'absolute',
          top: -140,
          zIndex: 3,
          ['--signal-color' as any]: 'rgba(20, 184, 166, 0.55)',
        }}
      >
        <div className="ripple ripple-1" />
        <div className="ripple ripple-2" />
        <div className="ripple ripple-3" />
        <ThemeIcon variant="filled" size={120} radius="xl" color="teal" className="shield-core">
          <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
        </ThemeIcon>
      </div>

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
          paddingTop: 100,
          flexDirection: 'column',
          borderRadius: '1rem',
          maxHeight: '90%',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <Stack align="center" gap="lg">
          <Stack align="center" gap="xs">
            <Title order={3} style={{ color: '#fff' }}>Abonelik</Title>
            <Text c="dimmed" ta="center" size="lg" mt="md">
              Aşağıdaki butonu kullanarak Happ uygulamasına bir abonelik ekleyin
            </Text>
          </Stack>

          {/* Butonlar */}
          <Group grow w="100%" mt="xl" gap="md">
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(20, 184, 166, 0.2)',
                transition: 'all .2s ease-in-out',
                cursor: 'pointer',
                border: '1px solid #14b8a6',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(20, 184, 166, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)';
              }}
              onClick={handleAddSubscription}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <IconPlus size={20} style={{ color: '#14b8a6' }} />
                <Text size="md" fw={600} style={{ color: '#14b8a6' }}>Ekle</Text>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.07)',
                transition: 'all .2s ease-in-out',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
              }}
              onClick={handleNext}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text size="md" fw={500} style={{ color: '#fff' }}>Sonraki</Text>
                <IconArrowRight size={20} style={{ color: '#fff' }} />
              </div>
            </div>
          </Group>
        </Stack>
      </div>
    </div>
  );
}
