import { useState } from 'react';
import {
  Button,
  Stack,
  Text,
  Title,
} from '@mantine/core';

interface BuySubscriptionProps {
}

interface SubscriptionOption {
  duration: string;
  price: number;
  monthlyPrice?: number;
  isPopular?: boolean;
  months: number;
}

function BuySubscription({}: BuySubscriptionProps) {
  const [deviceCount, setDeviceCount] = useState(1);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(2); // 6 месяцев по умолчанию

  // Cihaz sayısına göre abonelik seçenekleri
  const getSubscriptionOptions = (count: number): SubscriptionOption[] => {
    const baseOptions = [
      { duration: '1 Ay', months: 1, price: 150 * count, isPopular: false },
      { duration: '3 Ay', months: 3, price: 390 * count, isPopular: false },
      { duration: '6 Ay', months: 6, price: 720 * count, isPopular: true },
      { duration: '1 Yıl', months: 12, price: 1320 * count, isPopular: false },
    ];

    return baseOptions.map(option => ({
      ...option,
      monthlyPrice: option.price / option.months,
    }));
  };

  const subscriptionOptions = getSubscriptionOptions(deviceCount);
  const selectedOption = subscriptionOptions[selectedDurationIndex];

  // Haptic helpers
  const haptic = window.Telegram?.WebApp?.HapticFeedback;
  const hapticSelect = () => {
    try { haptic?.selectionChanged?.(); } catch {}
  };
  const hapticImpact = () => {
    try { haptic?.impactOccurred?.('light'); } catch {}
  };

  const handlePayment = () => {
    hapticImpact();
    console.log(`Ödeme Yap: ${selectedOption.price.toFixed(0)} ₽`);
  };

  const handleSubscriptionSelect = (index: number) => {
    hapticSelect();
    setSelectedDurationIndex(index);
  };

  const handleSliderChange = (value: number) => {
    hapticSelect();
    setDeviceCount(value);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', width: '100%', paddingBottom: '30px' }}>
      {/* İç çerçeve */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          backgroundColor: '#0006',
          overflow: 'visible',
          zIndex: 2,
          position: 'relative',
          padding: 30,
          flexDirection: 'column',
          borderRadius: '1rem',
          boxShadow: 'none',
          border: 'none',
        }}
      >
        <Stack gap="lg">
          {/* Başlık */}
          <Stack gap="xs">
            <Title order={2} style={{ color: '#fff', fontSize: '28px', fontWeight: 600 }}>
              Abonelik Satın Al
            </Title>
            <Text size="md" style={{ color: '#9ca3af' }}>
              İlgilendiğiniz tarifeyi ve cihaz sayısını seçin
            </Text>
          </Stack>

          {/* Cihaz sayısı slider */}
          <div>
            <Text size="lg" style={{ color: '#fff', marginBottom: '16px', fontWeight: 500 }}>
              Cihaz Sayısı: {deviceCount}
            </Text>
            <div style={{ position: 'relative', paddingTop: '20px', paddingBottom: '20px' }}>
              <input
                type="range"
                min="1"
                max="5"
                value={deviceCount}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#1f2937',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
                className="custom-slider"
              />
              <div style={{ position: 'absolute', top: '17px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <div
                    key={num}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: deviceCount >= num ? '#14b8a6' : '#374151',
                      marginLeft: num === 1 ? '0' : '-5px',
                      marginRight: num === 5 ? '0' : '-5px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Abonelik kartları - Grid 2x2 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px',
            marginTop: '8px'
          }}>
            {subscriptionOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => handleSubscriptionSelect(index)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedDurationIndex === index ? '#14b8a620' : '#00000040',
                  border: selectedDurationIndex === index ? '2px solid #14b8a6' : '2px solid transparent',
                  borderRadius: '16px',
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                {option.isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    popüler
                  </div>
                )}
                
                <div style={{ marginTop: option.isPopular ? '28px' : '8px' }}>
                  <Text size="sm" style={{ color: '#9ca3af', marginBottom: '8px' }}>
                    {option.duration}
                  </Text>
                  
                  <Text size="28px" fw={700} style={{ color: '#fff', lineHeight: '1.2' }}>
                    {option.price.toFixed(0)} ₽
                  </Text>
                  
                  {option.months > 1 && (
                    <Text size="xs" style={{ color: '#6b7280', marginTop: '4px' }}>
                      {option.monthlyPrice?.toFixed(0)}₽ / ay
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Ödeme butonu */}
          <Button
            color="teal"
            size="lg"
            radius="md"
            fullWidth
            mt="md"
            onClick={handlePayment}
            style={{
              backgroundColor: '#14b8a6',
              height: '56px',
              fontSize: '17px',
              fontWeight: 600,
            }}
          >
            Ödeme Yap {selectedOption.price.toFixed(0)} ₽
          </Button>
        </Stack>
      </div>
    </div>
  );
}

export default BuySubscription;
