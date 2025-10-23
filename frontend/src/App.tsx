import { useEffect, useState } from 'react';
import { MantineProvider, AppShell, Group } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
// tabler icons are not used in this file (used inside AccountPage)
import '@mantine/core/styles.css';
import WelcomeScreen from './WelcomeScreen';
import BuySubscription from './BuySubscription'; // BuySubscription bileşenini içe aktar
import InstallSetup from './InstallSetup';
import InstallOnThisDevice from './InstallOnThisDevice';
import AddSubscription from './AddSubscription';
import Congratulations from './Congratulations';
import AccountPage from './AccountPage';
import type { AccountResponse } from './AccountPage';

// Telegram Web App script'inin eklediği global nesneyi tanımla
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

// AccountPage artık ayrı dosyada

function App() {
  const preferredColorScheme = useColorScheme();
  const webApp = window.Telegram.WebApp;

  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'account' | 'buySubscription' | 'installSetup' | 'installOnThisDevice' | 'addSubscription' | 'congratulations'>('welcome');
  const [screenHistory, setScreenHistory] = useState<Array<'welcome' | 'account' | 'buySubscription' | 'installSetup' | 'installOnThisDevice' | 'addSubscription' | 'congratulations'>>(['welcome']);
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'offline' | null>(null);
  const [accountData, setAccountData] = useState<AccountResponse | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);

  // localStorage'ı temizle (eski verileri kaldır)
  useEffect(() => {
    try {
      localStorage.removeItem('currentScreen');
      localStorage.removeItem('screenHistory');
    } catch {}
  }, []);

  // Debug için screenHistory'yi konsola yazdır
  useEffect(() => {
    console.log('Screen history:', screenHistory);
    console.log('Current screen:', currentScreen);
  }, [screenHistory, currentScreen]);

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
    }
  }, [webApp, currentScreen]);

  // BackButton click handler'ını ayrı bir useEffect'te tanımla
  useEffect(() => {
    const backButton = webApp.BackButton;
    
    const handleBackClick = () => {
      try {
        webApp?.HapticFeedback?.impactOccurred?.('light');
      } catch {}
      
      setScreenHistory(prev => {
        if (prev.length > 1) {
          const newHistory = [...prev];
          newHistory.pop(); // Mevcut sayfayı çıkar
          const previousScreen = newHistory[newHistory.length - 1];
          
          // currentScreen'i hemen güncelle
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
  }, [webApp]);

  // App açılışında hesap bilgilerini yükle
  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      const user = webApp.initDataUnsafe?.user;
      
      if (!user) {
        setAccountLoading(false);
        return;
      }

      setAccountLoading(true);
      setAccountError(null);

      try {
        const res = await fetch('/api/account', {
          headers: { 'x-telegram-init-data': webApp.initData ?? '' },
        });
        
        if (!res.ok) {
          throw new Error(`Hesap bilgileri alınamadı: ${res.status}`);
        }
        
        const data = await res.json() as AccountResponse;
        
        if (cancelled) return;
        
        setAccountData(data);
        
        // Online status kontrolü
        const status = String(data?.status ?? '').toLowerCase();
        const onlineAtMs = data?.onlineAt ? Date.parse(data.onlineAt) : 0;
        const connectedAtMs = data?.lastConnectedNode?.connectedAt ? Date.parse(data.lastConnectedNode.connectedAt) : 0;
        const freshest = Math.max(onlineAtMs || 0, connectedAtMs || 0);
        const now = Date.now();
        const ONLINE_STALE_MS = 2 * 60 * 1000; // 2 dakika içinde bağlantı varsa online kabul et

        const isFresh = Number.isFinite(freshest) && freshest > 0 && now - freshest <= ONLINE_STALE_MS;
        setOnlineStatus(status === 'active' && isFresh ? 'online' : 'offline');
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
        setAccountError(message);
        setAccountData(null);
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    };

    loadAccount();
    return () => { cancelled = true; };
  }, [webApp.initData, webApp]);

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
              <AccountPage 
                loading={accountLoading}
                error={accountError}
                account={accountData}
              />
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
