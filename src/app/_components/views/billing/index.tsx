import { SparklesIcon } from "lucide-react";
import Image from "next/image";
import SubscriptionCards from "./subscription-cards";
import SubscriptionStatusSection from "./subscription-status-section";

export default function BillingView() {
  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col overflow-hidden">
      <section className="relative space-y-8 px-4 py-[12vh] text-center sm:px-6 lg:px-8 2xl:py-32">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full bg-green-500/20 blur-xl"></div>
            <Image
              src="/logo.svg"
              alt="Sagent"
              width={64}
              height={64}
              className="relative z-10 mx-auto drop-shadow-lg"
            />
          </div>
        </div>

        {/* Enhanced title with gradient */}
        <div className="space-y-4">
          <h1 className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-6xl lg:text-7xl">
            Billing
            <SparklesIcon className="absolute -top-2 -right-8 h-6 w-6 animate-bounce text-yellow-400" />
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl">
            Manage your subscription and billing information
          </p>
        </div>
      </section>

      <SubscriptionStatusSection />

      <SubscriptionCards />
    </div>
  );
}
