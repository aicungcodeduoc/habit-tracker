import Constants, { ExecutionEnvironment } from 'expo-constants';

/** Expo Go does not ship the native AppleAuthenticationButton view. */
export function isExpoGo() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}
