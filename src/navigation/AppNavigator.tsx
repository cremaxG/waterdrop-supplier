import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { AuthScreen } from '../screens/auth/AuthScreen';
import {
  AppLaunchRequest,
  parseLaunchRequest,
} from './launchActions';
import { MainTabNavigator } from './MainTabNavigator';
import { getStorage } from '../utils/Storage';

export function AppNavigator() {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    getStorage().getString('authToken') ?? null,
  );
  const [launchRequest, setLaunchRequest] = useState<AppLaunchRequest | null>(null);
  const isSignedIn = Boolean(authToken);

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
        onSignIn={token => {
          setAuthToken(token);
        }}
      />
    );
  }

  return (
    <MainTabNavigator
      launchRequest={launchRequest}
      onLogout={() => {
        getStorage().remove('authToken');
        setAuthToken(null);
      }}
    />
  );
}
