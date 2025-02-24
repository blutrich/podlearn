import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins, Check, Infinity, Zap } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";

export default function Pricing() {
  const { loading, purchaseCredits, startSubscription } = usePayments();
  const [selectedPlan, setSelectedPlan] = useState<'credits' | 'subscription'>('credits');

  const creditPackages = [
    { credits: 5, price: 10, variantId: '703348' },
    { credits: 15, price: 25, variantId: '703349', popular: true },
    { credits: 30, price: 45, variantId: '703350' }
  ];

  const subscriptionPlans = [
    {
      name: "Monthly",
      price: 9,
      variantId: '703354',
      interval: "month",
      features: [
        "Unlimited transcriptions",
        "Unlimited lesson generations",
        "Priority support",
        "Cancel anytime"
      ]
    },
    {
      name: "Annual",
      price: 85,
      variantId: '703352',
      interval: "year",
      savings: "Save $23",
      popular: true,
      features: [
        "All monthly features",
        "2 months free",
        "Priority support",
        "Cancel anytime"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with 2 free episodes. Then choose between pay-as-you-go credits or unlimited access.
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border p-1">
            <Button
              variant={selectedPlan === 'credits' ? 'default' : 'ghost'}
              onClick={() => setSelectedPlan('credits')}
              className="flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Pay As You Go
            </Button>
            <Button
              variant={selectedPlan === 'subscription' ? 'default' : 'ghost'}
              onClick={() => setSelectedPlan('subscription')}
              className="flex items-center gap-2"
            >
              <Infinity className="w-4 h-4" />
              Unlimited
            </Button>
          </div>
        </div>

        {/* Credit Packages */}
        {selectedPlan === 'credits' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.credits}
                className={`relative border rounded-xl p-6 ${
                  pkg.popular ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">{pkg.credits} Credits</span>
                </div>
                <div className="text-3xl font-bold mb-2">${pkg.price}</div>
                <div className="text-sm text-muted-foreground mb-6">
                  ${(pkg.price / pkg.credits).toFixed(2)} per episode
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => purchaseCredits(pkg.credits as 5 | 15 | 30)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Purchase Credits"}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Subscription Plans */}
        {selectedPlan === 'subscription' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative border rounded-xl p-6 ${
                  plan.popular ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">{plan.name} Plan</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
                {plan.savings && (
                  <div className="text-sm text-green-500 font-medium mb-4">
                    {plan.savings}
                  </div>
                )}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => startSubscription(plan.name.toLowerCase() as 'monthly' | 'annual')}
                  disabled={loading}
                >
                  {loading ? "Processing..." : `Start ${plan.name} Plan`}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What's included in each episode credit?</h3>
              <p className="text-muted-foreground">
                Each credit allows you to transcribe one episode and generate one AI-powered lesson from that episode.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How long do credits last?</h3>
              <p className="text-muted-foreground">
                Credits never expire. Use them whenever you're ready.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 