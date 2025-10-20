import { Button, Group, Stack, Text, Title, ThemeIcon, Card, Container } from '@mantine/core';
import { IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset } from '@tabler/icons-react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
}

function WelcomeScreen({ onViewAccount, onBuySubscription, onInstallSetup, onSupport }: WelcomeScreenProps) {
  return (
    <Container py="xl" mx="auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <ThemeIcon variant="light" size={120} radius="xl" color="green">
            <IconShield style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ThemeIcon>

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
                Profil
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
