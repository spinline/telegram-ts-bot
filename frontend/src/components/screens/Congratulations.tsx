import { Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconShield } from '@tabler/icons-react';

interface CongratulationsProps {
  onFinish: () => void;
}

export default function Congratulations({ onFinish }: CongratulationsProps) {
  // Haptic feedback
  const triggerHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // ignore
    }
  };

  const handleFinish = () => {
    triggerHaptic();
    onFinish();
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '180px', width: '100%' }}>
      {/* Kalkan iç çerçevenin dışında */}
      <div
        className="shield-ripple"
        style={{
          position: 'absolute',
          top: -170,
          zIndex: 3,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            <Title order={2} style={{ color: '#fff' }}>Tebrikler!</Title>
            <Text c="dimmed" ta="center" size="lg" mt="md">
              Happ uygulamasından VPN'i etkinleştirmek için yuvarlak butona basın
            </Text>
          </Stack>

          {/* İşlemi Sonlandır Butonu */}
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
              width: '100%',
              marginTop: '20px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(20, 184, 166, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(20, 184, 166, 0.2)';
            }}
            onClick={handleFinish}
          >
            <Text size="md" fw={600} style={{ color: '#14b8a6' }}>İşlemi Sonlandır</Text>
          </div>
        </Stack>
      </div>
    </div>
  );
}
