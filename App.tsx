/**
 * Water Supplier App
 * Global theme and language support.
 *
 * @format
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WaterDropSplash } from './src/components/WaterDropSplash';
import { AppProviders } from './src/providers/AppProviders';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);

  return (
    <SafeAreaProvider>
      <AppProviders>
        <View style={styles.root}>
          <AppNavigator />
          {isSplashVisible ? (
            <WaterDropSplash
              onFinish={() => {
                setSplashVisible(false);
              }}
            />
          ) : null}
        </View>
      </AppProviders>
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
