import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { env } from '@/lib/env';

let configuredUserId: string | null = null;

function getApiKey() {
  const key =
    Platform.OS === 'ios'
      ? env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!key) throw new Error('RevenueCat API 키가 설정되지 않았어요.');
  return key;
}

export function configurePurchases(userId: string) {
  if (Platform.OS === 'web') return;
  if (configuredUserId === userId) return;
  Purchases.configure({ apiKey: getApiKey(), appUserID: userId });
  configuredUserId = userId;
}

export async function getCurrentOffering() {
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) throw new Error('현재 구매 가능한 상품이 없어요.');
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}
