import { HydrateClient } from "@/trpc/server";
import HomeView from "../_components/views/home";

export default async function Home() {
  return (
    <HydrateClient>
      <HomeView />
    </HydrateClient>
  );
}
