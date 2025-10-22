import { Button, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconArrowLeft, IconShield } from '@tabler/icons-react';

interface InstallSetupProps {
  onBack: () => void;
}

export default function InstallSetup({ onBack }: InstallSetupProps) {
  return (
    <Container size={560} px="md" py="xl" mx="auto" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '60px' }}>
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
        <Stack align="center" gap="lg">
          {/* Static rings around the shield */}
          <div className="shield-static" style={{ ['--ring-color' as any]: 'rgba(20, 184, 166, 0.45)' }}>
            <div className="ring ring-1" />
            <div className="ring ring-2" />
            <div className="ring ring-3" />
            <ThemeIcon variant="filled" size={120} radius="xl" color="teal" className="shield-core">
              <IconShield style={{ width: '70%', height: '70%' }} stroke={1.6} />
            </ThemeIcon>
          </div>

                    <Stack align="center" gap="xs">
            <Title order={3} style={{ color: '#fff' }}>Kurulum ve Ayarlar</Title>
            <Text c="dimmed" ta="center">Cihazınızda hızlıca bağlantı kurmak için aşağıdaki adımları izleyin.</Text>
          </Stack>

          <Stack gap="sm" w="100%">
            <Text fw={600} style={{ color: '#fff' }}>iOS</Text>
            <Text c="dimmed" size="sm">1) Uygulamayı App Store'dan indirin. 2) Hesabım sayfasından bağlantıyı açın. 3) Profili onaylayın.</Text>

            <Text fw={600} mt="sm" style={{ color: '#fff' }}>Android</Text>
            <Text c="dimmed" size="sm">1) Uygulamayı Play Store'dan indirin. 2) Hesabım sayfasından bağlantıyı açın. 3) Profili etkinleştirin.</Text>
          </Stack>

          <Group justify="center" mt="md">
            <Button leftSection={<IconArrowLeft size={18} />} variant="light" color="gray" onClick={onBack}>
              Geri Dön
            </Button>
          </Group>
        </Stack>
      </div>
    </Container>
  );
}
