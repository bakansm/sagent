import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { messageRouter } from "./routers/message";
import { subcriptionRouter } from "./routers/subcription";
import { threadRouter } from "./routers/thread";
import { userRouter } from "./routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  message: messageRouter,
  thread: threadRouter,
  user: userRouter,
  subcription: subcriptionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
