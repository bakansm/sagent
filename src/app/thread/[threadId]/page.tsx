import ProjectView from "@/app/_components/views/threadId/project-view";
import { api, HydrateClient } from "@/trpc/server";

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { threadId } = params;

  void api.message.getMessages.prefetch({ threadId });
  void api.thread.getThread.prefetch({ threadId });

  return (
    <HydrateClient>
      <ProjectView threadId={threadId} />
    </HydrateClient>
  );
}
