import { Platform, Share } from 'react-native';

const APP_NAME = 'WaterSupplier';

// Replace these with your production listing URLs when they are available.
const IOS_APP_STORE_URL = 'https://apps.apple.com/us/app/tic-tac-toe-2-player-game/id1606703142';
const ANDROID_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.watersupplier';
const FALLBACK_APP_URL = '';

function getShareUrl() {
  const platformUrl =
    Platform.select({
      ios: IOS_APP_STORE_URL,
      android: ANDROID_PLAY_STORE_URL,
      default: FALLBACK_APP_URL,
    }) ?? '';

  return platformUrl.trim() || FALLBACK_APP_URL.trim();
}

function buildShareMessage(shareUrl: string) {
  const intro = `Run your water delivery business with ${APP_NAME}.`;

  if (!shareUrl) {
    return intro;
  }

  return `${intro}\n\nDownload the app: ${shareUrl}`;
}

export function shareApp() {
  const shareUrl = getShareUrl();

  return Share.share({
    title: `Share ${APP_NAME}`,
    message: buildShareMessage(shareUrl),
    url: shareUrl || undefined,
  });
}
