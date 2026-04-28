import React, { useState } from 'react';
import { AuthScreen } from '../screens/auth/AuthScreen';
import {
  clearTempToken,
  getTempToken,
  setTempToken,
} from '../storage/session';
import { MainTabNavigator } from './MainTabNavigator';

export function AppNavigator() {
  const [tempToken, setSessionToken] = useState<string | null>(() =>
    getTempToken(),
  );
  const isSignedIn = Boolean(tempToken);

  if (!isSignedIn) {
    return (
      <AuthScreen
        onSignIn={(phoneNumber, country) => {
          const nextTempToken = `temp_${country.code}_${phoneNumber}_${Date.now()}`;
          console.log(
            `Signing in with ${country.dialCode}${phoneNumber} using temp token ${nextTempToken}`,
          );
          setTempToken(nextTempToken);
          setSessionToken(nextTempToken);
        }}
      />
    );
  }

  return (
    <MainTabNavigator
      onLogout={() => {
        clearTempToken();
        setSessionToken(null);
      }}
    />
  );
}
