import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type'); // 'credits' or 'subscription'

  useEffect(() => {
    // Show success toast
    toast.success(
      type === 'credits' 
        ? 'Credits added successfully!' 
        : 'Subscription activated successfully!'
    );

    // Automatically redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/browse');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, type]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md w-full">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-xl text-muted-foreground">
          {type === 'credits' 
            ? 'Your credits have been added to your account.'
            : 'Your subscription has been activated.'}
        </p>
        <p className="text-sm text-muted-foreground">
          You will be redirected back to the app in a few seconds...
        </p>
        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/browse')}
            className="min-w-[200px]"
          >
            Return to App Now
          </Button>
        </div>
      </div>
    </div>
  );
} 