import ProjectView from "@/app/_components/views/threadId/project-view";
import { HydrateClient } from "@/trpc/server";

interface ThreadPageProps {
  params: Promise<{
    threadId: string;
  }>;
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = await params;

  return (
    <HydrateClient>
      <ProjectView threadId={threadId} />
    </HydrateClient>
  );
}
