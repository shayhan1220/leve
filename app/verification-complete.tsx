import { Redirect } from 'expo-router';

export default function VerificationCompleteScreen() {
  return <Redirect href="/(auth)/verify" />;
}
