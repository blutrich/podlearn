import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePayments } from "@/hooks/usePayments";
import { toast } from "sonner";

export function TestPurchase() {
  const { user } = useAuth();
  const { loading, purchaseCredits, startSubscription } = usePayments();

  // Direct test mode checkout using LemonSqueezy official params
  const openTestCheckout = () => {
    if (!user) {
      toast.error('Please log in to test checkout');
      return;
    }
    
    // Create URL with explicit test_mode=1 parameter at the front
    const checkoutUrl = new URL('https://blutrich.lemonsqueezy.com/checkout/buy/19a83e7a-7d3a-4821-b690-f68b0d7f2d8c');
    
    // Set test mode as first parameter for highest priority
    checkoutUrl.searchParams.append('test_mode', '1');
    
    // Add additional parameters
    checkoutUrl.searchParams.append('checkout[custom][user_id]', user.id);
    checkoutUrl.searchParams.append('checkout[custom][credits]', '5');
    checkoutUrl.searchParams.append('checkout[email]', 'test@example.com'); // Pre-fill test email
    checkoutUrl.searchParams.append('checkout[success_url]', `${window.location.origin}/payment-success?type=credits&test=true`);
    checkoutUrl.searchParams.append('checkout[cancel_url]', `${window.location.origin}/test-payment`);
    
    // Log the full URL for debugging
    console.log('TEST MODE URL:', checkoutUrl.toString());
    
    // Open in a new tab to preserve current state
    window.open(checkoutUrl.toString(), '_blank');
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <div className="text-sm text-muted-foreground">
        User ID: {user?.id || 'Not logged in'}
      </div>
      
      {/* Add special test mode button */}
      <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Direct Test Mode Checkout</h3>
        <p className="text-sm text-yellow-700 mb-3">
          Use this button for testing with test cards. It will open a new window with test mode explicitly enabled.
        </p>
        <Button
          onClick={openTestCheckout}
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Open Test Checkout (5 Credits)
        </Button>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Test Credit Packages</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => purchaseCredits(5)}
            disabled={loading}
          >
            Buy 5 Credits ($10)
          </Button>
          <Button 
            variant="outline"
            onClick={() => purchaseCredits(15)}
            disabled={loading}
          >
            Buy 15 Credits ($25)
          </Button>
          <Button 
            variant="outline"
            onClick={() => purchaseCredits(30)}
            disabled={loading}
          >
            Buy 30 Credits ($45)
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Test Subscriptions</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => startSubscription('monthly')}
            disabled={loading}
          >
            Monthly ($9)
          </Button>
          <Button 
            variant="outline"
            onClick={() => startSubscription('annual')}
            disabled={loading}
          >
            Annual ($85)
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">
          Creating checkout session...
        </div>
      )}
      
      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
        <h4 className="font-semibold">Test Card Details:</h4>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Card Number: 4242 4242 4242 4242</li>
          <li>Expiry: Any future date (e.g., 12/25)</li>
          <li>CVC: Any 3 digits (e.g., 123)</li>
          <li>Name/Address: Any values</li>
        </ul>
      </div>
    </div>
  );
} 