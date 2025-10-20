import { useState } from 'react';
import {
  Button,
  Group,
  Stack,
  Text,
  Title,
  Card,
  Container,
  Slider,
  Badge,
} from '@mantine/core';
import { IconDeviceLaptop, IconShoppingCart } from '@tabler/icons-react';

interface BuySubscriptionProps {
  onBack: () => void;
}

interface SubscriptionOption {
  duration: string;
  price: number;
  monthlyPrice?: number;
  isPopular?: boolean;
}

function BuySubscription({ onBack }: BuySubscriptionProps) {
  const [deviceCount, setDeviceCount] = useState(3); // Varsayılan olarak 3 cihaz seçili
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0); // Seçilen abonelik süresi indeksi

  // Cihaz sayısına göre abonelik seçeneklerini dinamik olarak oluştur
  const getSubscriptionOptions = (count: number): SubscriptionOption[] => {
    // Ekran görüntüsündeki fiyatlara yakın değerler ve cihaz sayısına göre ayarlama
    const pricesPerMonth = {
      1: { '1': 310, '3': 790, '6': 1470, '12': 2700 }, // 1 cihaz için
      2: { '1': 450, '3': 1100, '6': 2000, '12': 3600 }, // 2 cihaz için (örnek)
      3: { '1': 550, '3': 1400, '6': 2600, '12': 4800 }, // 3 cihaz için (örnek)
      4: { '1': 600, '3': 1600, '6': 3000, '12': 5500 }, // 4 cihaz için (örnek)
      5: { '1': 650, '3': 1750, '6': 3300, '12': 6000 }, // 5 cihaz için (örnek)
    };

    const currentDevicePrices = pricesPerMonth[count as keyof typeof pricesPerMonth];

    return [
      { duration: '1 Ay', price: currentDevicePrices['1'], isPopular: false },
      { duration: '3 Ay', price: currentDevicePrices['3'], isPopular: false },
      { duration: '6 Ay', price: currentDevicePrices['6'], isPopular: true },
      { duration: '1 Yıl', price: currentDevicePrices['12'], isPopular: false },
    ].map(option => {
      const durationInMonths = parseInt(option.duration.split(' ')[0]) || 12;
      return {
        ...option,
        monthlyPrice: option.price / durationInMonths,
      };
    });
  };

  const subscriptionOptions = getSubscriptionOptions(deviceCount);
  const selectedOption = subscriptionOptions[selectedDurationIndex];

  return (
    <Container size="sm" py="xl" mx="auto">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={2}>Abonelik Satın Al</Title>
            <Text c="dimmed">İlgilendiğiniz tarifeyi ve cihaz sayısını seçin</Text>
          </Stack>

          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Title order={5}>Cihaz Sayısı:</Title>
              <Badge size="lg" variant="filled" color="blue">
                {deviceCount}
              </Badge>
            </Group>
            <Slider
              value={deviceCount}
              onChange={setDeviceCount}
              min={1}
              max={5}
              step={1}
              label={(value) => `${value} Cihaz`}
              thumbChildren={<IconDeviceLaptop size={16} />}
              color="green"
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
              ]}
            />
          </Stack>

          <Stack gap="md">
            <Group grow>
              {subscriptionOptions.map((option, index) => (
                <Card
                  key={index}
                  shadow="xs"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedDurationIndex === index ? 'var(--mantine-color-green-6)' : undefined,
                    borderWidth: selectedDurationIndex === index ? 2 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    aspectRatio: '1 / 1', // Kare olmasını sağlar
                    minWidth: '120px', // Minimum genişlik
                  }}
                  onClick={() => setSelectedDurationIndex(index)}
                >
                  <Stack align="center" gap={4}> {/* gap azaltıldı */}
                    {option.isPopular && (
                      <Badge color="red" variant="filled" size="sm" mb={4}>
                        POPÜLER
                      </Badge>
                    )}
                    <Text size="md" fw={700}> {/* Yazı boyutu küçültüldü */}
                      {option.duration}
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      {option.price.toFixed(0)} TL {/* Kuruşsuz fiyat */}
                    </Text>
                    {option.monthlyPrice && option.duration !== '1 Ay' && (
                      <Text size="sm" c="dimmed">
                        {(option.monthlyPrice).toFixed(0)} TL / ay {/* Kuruşsuz aylık fiyat */}
                      </Text>
                    )}
                  </Stack>
                </Card>
              ))}
            </Group>
          </Stack>

          <Button
            leftSection={<IconShoppingCart size={20} />}
            color="green"
            size="lg"
            radius="md"
            fullWidth
            mt="xl"
            onClick={() => console.log(`Ödeme Yap: ${selectedOption.price.toFixed(0)} TL`)}
          >
            Ödeme Yap {selectedOption.price.toFixed(0)} TL
          </Button>
        </Stack>
      </Card>
      <Group justify="center" mt="md">
        <Button variant="light" onClick={onBack}>Geri</Button>
      </Group>
    </Container>
  );
}

export default BuySubscription;
