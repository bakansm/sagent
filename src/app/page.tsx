import { HydrateClient } from "@/trpc/server";
import Temp from "./temp";

export default async function Home() {
  return (
    <HydrateClient>
      <Temp />
    </HydrateClient>
  );
}
