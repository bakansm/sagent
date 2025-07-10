import { HydrateClient } from "@/trpc/server";
import HomeView from "../_components/views/home/home-view";

export default async function Home() {
  return (
    <HydrateClient>
      <HomeView />
    </HydrateClient>
  );
}
