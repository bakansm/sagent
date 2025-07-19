import { abi } from "@/contract/abi";
import { address } from "@/contract/address";
import { sagentChain } from "@/contract/chain";
import { db } from "@/libs/db.lib";
import { createPublicClient, formatEther, http, type Hex } from "viem";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const publicClient = createPublicClient({
  chain: sagentChain,
  transport: http(),
});

export const subcriptionRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const depositeBalance = await publicClient.readContract({
        account: input.walletAddress as Hex,
        address: address.sagent as Hex,
        abi: abi,
        functionName: "getBalance",
      });

      // Update user subscription status based on deposited balance
      if (ctx.session?.userId) {
        const ethBalance = formatEther(depositeBalance);
        const isSubscribed = parseFloat(ethBalance) > 0;

        await db.user.upsert({
          where: { id: ctx.session.userId },
          update: { isSubscribed },
          create: {
            id: ctx.session.userId,
            isSubscribed,
          },
        });
      }

      return depositeBalance;
    }),
});
