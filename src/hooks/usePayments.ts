import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";

export function usePayments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Set to false for production (live) mode
  const IS_TEST_MODE = false; // Changed to false for production

  // Store URLs
  const getStoreUrl = (productId: string) => {
    const baseUrl = `https://blutrich.lemonsqueezy.com/checkout/buy/${productId}`;
    // Always include test_mode for consistent URLs
    return `${baseUrl}?test_mode=${IS_TEST_MODE ? '1' : '0'}`;
  };

  const PRODUCT_IDS = {
    credits: '19a83e7a-7d3a-4821-b690-f68b0d7f2d8c',
    subscription: '1955bba6-c606-44a3-a397-038ac08728ba'
  };

  const purchaseCredits = async (amount: 5 | 15 | 30) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }

    setLoading(true);

    try {
      // Get base URL with test mode
      const url = new URL(getStoreUrl(PRODUCT_IDS.credits));
      
      // Ensure test mode is set explicitly (important)
      url.searchParams.set('test_mode', IS_TEST_MODE ? '1' : '0');
      
      // Add user and credit information
      url.searchParams.append('checkout[custom][user_id]', user.id);
      url.searchParams.append('checkout[custom][credits]', amount.toString());
      url.searchParams.append('checkout[success_url]', `${window.location.origin}/payment-success?type=credits`);
      url.searchParams.append('checkout[cancel_url]', `${window.location.origin}/pricing`);
      
      console.log('Redirecting to checkout URL (Test Mode:', IS_TEST_MODE, '):', url.toString());
      window.location.href = url.toString();
    } catch (error) {
      console.error('Error preparing checkout:', error);
      toast.error('Failed to initiate checkout');
      setLoading(false);
    }
  };

  const startSubscription = async (plan: 'monthly' | 'annual') => {
    if (!user) {
      toast.error('Please log in to start a subscription');
      return;
    }

    setLoading(true);

    try {
      // Get base URL with test mode
      const url = new URL(getStoreUrl(PRODUCT_IDS.subscription));
      
      // Ensure test mode is set explicitly
      url.searchParams.set('test_mode', IS_TEST_MODE ? '1' : '0');
      
      // Add user and plan information
      url.searchParams.append('checkout[custom][user_id]', user.id);
      url.searchParams.append('checkout[custom][plan]', plan);
      url.searchParams.append('checkout[success_url]', `${window.location.origin}/payment-success?type=subscription`);
      url.searchParams.append('checkout[cancel_url]', `${window.location.origin}/pricing`);
      
      console.log('Redirecting to subscription URL (Test Mode:', IS_TEST_MODE, '):', url.toString());
      window.location.href = url.toString();
    } catch (error) {
      console.error('Error preparing subscription checkout:', error);
      toast.error('Failed to initiate subscription checkout');
      setLoading(false);
    }
  };

  return {
    loading,
    testMode: IS_TEST_MODE,
    purchaseCredits,
    startSubscription,
  };
} 