import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePayments } from "@/hooks/usePayments";
import { toast } from "sonner";
import { AlertCircle, CreditCard } from "lucide-react";

export function TestPurchase() {
  const { user } = useAuth();
  const { loading, testMode, purchaseCredits, startSubscription } = usePayments();

  // Direct test mode checkout using LemonSqueezy official params
  const openTestCheckout = () => {
    if (!user) {
      toast.error('Please log in to test checkout');
      return;
    }
    
    // Create URL with explicit test_mode parameter at the front
    const checkoutUrl = new URL('https://blutrich.lemonsqueezy.com/checkout/buy/19a83e7a-7d3a-4821-b690-f68b0d7f2d8c');
    
    // Set test mode parameter based on current mode
    checkoutUrl.searchParams.append('test_mode', testMode ? '1' : '0');
    
    // Add additional parameters
    checkoutUrl.searchParams.append('checkout[custom][user_id]', user.id);
    checkoutUrl.searchParams.append('checkout[custom][credits]', '5');
    checkoutUrl.searchParams.append('checkout[success_url]', `${window.location.origin}/payment-success?type=credits`);
    checkoutUrl.searchParams.append('checkout[cancel_url]', `${window.location.origin}/test-payment`);
    
    // Log the full URL for debugging
    console.log('Checkout URL:', checkoutUrl.toString());
    
    // Open in a new tab to preserve current state
    window.open(checkoutUrl.toString(), '_blank');
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <div className="text-sm flex items-center gap-2 mb-4">
        <strong>User ID:</strong> {user?.id || 'Not logged in'}
      </div>
      
      {/* Payment Mode Status */}
      <div className={`p-3 rounded-lg flex items-center gap-2 ${testMode ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <AlertCircle className="h-5 w-5" />
        <div>
          <span className="font-semibold">Payment Mode:</span> {testMode ? 'TEST MODE' : 'PRODUCTION MODE'}
          {!testMode && (
            <p className="text-sm mt-1 font-bold">WARNING: Real payments will be processed!</p>
          )}
        </div>
      </div>
      
      {/* Production warning */}
      {!testMode && (
        <div className="bg-red-100 p-4 rounded-lg border border-red-300">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Live Payment Warning
          </h3>
          <p className="text-sm text-red-700 mb-3">
            The app is running in PRODUCTION MODE. Any payment you make will process a real charge to your credit card.
          </p>
        </div>
      )}
      
      {/* Checkout button */}
      <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">
          {testMode ? "Test Checkout" : "Live Checkout"}
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          {testMode 
            ? "Use this button for testing with test cards. No real charges will be made."
            : "This will initiate a real payment. Your card will be charged."}
        </p>
        <Button
          onClick={openTestCheckout}
          className={testMode ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
        >
          {testMode ? "Open Test Checkout (5 Credits)" : "Purchase 5 Credits ($10)"}
        </Button>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Test Credit Packages</h3>
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
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
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-200">
        <h4 className="font-semibold">Webhook Configuration</h4>
        <p className="mt-1">
          Ensure that your LemonSqueezy webhook is pointed to: 
          <code className="block mt-1 p-2 bg-blue-100 rounded">
            https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1/lemon-webhook
          </code>
        </p>
      </div>
    </div>
  );
} 