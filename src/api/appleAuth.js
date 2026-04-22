import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

/**
 * Native Sign in with Apple, then Supabase session via ID token.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ session?: import('@supabase/supabase-js').Session; error?: Error; cancelled?: boolean }>}
 */
export async function signInWithApple(supabase) {
  if (Platform.OS !== 'ios') {
    return { error: new Error('Sign in with Apple is only available on iOS.') };
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return { error: new Error('Sign in with Apple is not available on this device.') };
  }

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') {
      return { cancelled: true };
    }
    return { error: e instanceof Error ? e : new Error(String(e?.message || e)) };
  }

  if (!credential?.identityToken) {
    return { error: new Error('No identity token from Apple.') };
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  let session = data?.session;
  if (!session) {
    const { data: sessionData } = await supabase.auth.getSession();
    session = sessionData?.session ?? undefined;
  }

  if (credential.fullName) {
    const nameParts = [];
    if (credential.fullName.givenName) nameParts.push(credential.fullName.givenName);
    if (credential.fullName.middleName) nameParts.push(credential.fullName.middleName);
    if (credential.fullName.familyName) nameParts.push(credential.fullName.familyName);
    const fullName = nameParts.join(' ');
    if (fullName) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: credential.fullName.givenName,
          family_name: credential.fullName.familyName,
        },
      });
      if (metaError) {
        console.warn('Apple sign-in: could not save name to user metadata', metaError.message);
      }
    }
  }

  return { session, error: null };
}
