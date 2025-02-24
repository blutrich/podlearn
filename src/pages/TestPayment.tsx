import { TestPurchase } from "@/components/payments/TestPurchase";

export default function TestPayment() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Test Payment Integration</h1>
      <TestPurchase />
    </div>
  );
} 