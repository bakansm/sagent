import Image from "next/image";
import BalanceSection from "./balance-section";
import SubscriptionCards from "./subscription-cards";

export default function BillingView() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <section className="space-y-8 pt-48 pb-[8vh]">
        <Image
          src="/logo.svg"
          alt="Sagent"
          width={50}
          height={50}
          className="mx-auto hidden md:block"
        />
        <h1 className="text-center text-2xl font-bold md:text-5xl">Billing</h1>
        <p className="text-muted-foreground text-center text-lg md:text-xl">
          Manage your billing information and subscription
        </p>
      </section>

      <BalanceSection />

      <SubscriptionCards />
    </div>
  );
}
