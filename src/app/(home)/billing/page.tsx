import BillingView from "@/app/_components/views/billing";
import { HydrateClient } from "@/trpc/server";

export default function BillingPage() {
  return (
    <HydrateClient>
      <BillingView />
    </HydrateClient>
  );
}
