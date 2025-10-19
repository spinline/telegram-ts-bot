import { Button, Group, Stack, Text, Title, useMantineColorScheme, ActionIcon, ThemeIcon, Card, Container } from '@mantine/core';
import { IconSun, IconMoon, IconShield, IconShoppingCart, IconSettings, IconUser, IconHeadset } from '@tabler/icons-react';

interface WelcomeScreenProps {
  onViewAccount: () => void;
  onBuySubscription: () => void;
  onInstallSetup: () => void;
  onSupport: () => void;
}

function WelcomeScreen({ onViewAccount, onBuySubscription, onInstallSetup, onSupport }: WelcomeScreenProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const ColorSchemeToggle = () => {
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
    <Container size="md" py="xl">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="xl">
          <Group justify="space-between" w="100%">
            <Title order={3}>AuronVPN</Title>
            <ColorSchemeToggle />
          </Group>

          <ThemeIcon variant="light" size={120} radius="xl" color="green">
            <IconShield style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ThemeIcon>

          <Stack align="center" gap="xs">
            <Title order={2}>Auron</Title>
            <Text c="dimmed">offline</Text>
            <Text c="dimmed">20 Ekim 2025 tarihine kadar</Text>
            <Text c="dimmed">deneme süresi</Text>
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
