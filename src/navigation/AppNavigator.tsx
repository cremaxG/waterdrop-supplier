import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { AuthScreen } from '../screens/auth/AuthScreen';
import {
  AppLaunchRequest,
  parseLaunchRequest,
} from './launchActions';
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
  const [launchRequest, setLaunchRequest] = useState<AppLaunchRequest | null>(null);
  const isSignedIn = Boolean(tempToken);

  useEffect(() => {
    const applyLaunchUrl = (url: string | null) => {
      if (!url) {
        return;
      }

      const parsedRequest = parseLaunchRequest(url);
      if (parsedRequest) {
        setLaunchRequest(parsedRequest);
      }
    };

    Linking.getInitialURL()
      .then(applyLaunchUrl)
      .catch(error => {
        console.warn('Unable to read initial launch URL', error);
      });

    const subscription = Linking.addEventListener('url', event => {
      applyLaunchUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      launchRequest={launchRequest}
      onLogout={() => {
        clearTempToken();
        setSessionToken(null);
      }}
    />
  );
}
