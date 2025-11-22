/**
 * App.tsx - Refactored with Modern Hooks
 * Uses custom hooks for clean separation of concerns
 */

import { useEffect } from 'react';
import { MantineProvider, AppShell } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import '@mantine/core/styles.css';

// Screens
import WelcomeScreen from './components/screens/WelcomeScreen';
import BuySubscription from './components/screens/BuySubscription';
import InstallSetup from './components/screens/InstallSetup';
import InstallOnThisDevice from './components/screens/InstallOnThisDevice';
import AddSubscription from './components/screens/AddSubscription';
import Congratulations from './components/screens/Congratulations';
import AccountPage from './components/screens/AccountPage';

// Custom Hooks - Using barrel exports
import { useTelegram, useAccount, useNavigation } from './hooks';

// Constants - Using barrel exports
import { COLORS } from './utils';

function App() {
  const preferredColorScheme = useColorScheme();

  // 🎯 Modern Hooks
  const { setHeaderColor, setBackgroundColor } = useTelegram();
  const { account, loading, error, onlineStatus, isRegistered } = useAccount();
  const { currentScreen, navigateTo, resetNavigation } = useNavigation();

  // Set Telegram theme colors
  useEffect(() => {
    setHeaderColor(COLORS.headerBg);
    setBackgroundColor(COLORS.background);
  }, [setHeaderColor, setBackgroundColor]);

  // Clear localStorage on mount
  useEffect(() => {
    try {
      localStorage.removeItem('currentScreen');
      localStorage.removeItem('screenHistory');
    } catch {}
  }, []);

  // Navigation handlers
  const handleViewAccount = () => navigateTo('account');
  const handleBuySubscription = () => navigateTo('buySubscription');
  const handleInstallSetup = () => navigateTo('installSetup');
  const handleInstallOnThisDevice = () => navigateTo('installOnThisDevice');
  const handleInstallOnThisDeviceNext = () => navigateTo('addSubscription');
  const handleAddSubscriptionNext = () => navigateTo('congratulations');
  const handleCongratulationsFinish = () => resetNavigation();
  const handleSupport = () => {
    console.log('Destek');
  };

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <AppShell padding="md">
        <AppShell.Main style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100dvh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '0'
        }}>
          <div style={{ width: '100%', maxWidth: '800px', padding: '16px' }}>
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onViewAccount={handleViewAccount}
                onBuySubscription={handleBuySubscription}
                onInstallSetup={handleInstallSetup}
                onSupport={handleSupport}
                onlineStatus={onlineStatus}
                expireAt={account?.expireAt}
                isRegistered={isRegistered}
                loading={loading}
              />
            )}
            {currentScreen === 'account' && (
              <AccountPage
                loading={loading}
                error={error}
                account={account}
                onBuySubscription={handleBuySubscription}
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
                subscriptionUrl={account?.happ?.cryptoLink}
              />
            )}
            {currentScreen === 'congratulations' && (
              <Congratulations onFinish={handleCongratulationsFinish} />
            )}
          </div>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}

export default App;

