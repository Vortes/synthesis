import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { analyzeCapture, generateEmbedding, uploadDescription } from "../lib/analyze";

export const captureRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { clerkId: ctx.userId },
    });
    if (!user) return [];

    return ctx.db.capture.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!user) return null;

      return ctx.db.capture.findFirst({
        where: { id: input.id, userId: user.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        sourceUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { clerkId: ctx.userId },
      });

      return ctx.db.capture.create({
        data: {
          userId: user.id,
          imageUrl: input.imageUrl,
          sourceUrl: input.sourceUrl,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!user) return { success: false };

      await ctx.db.capture.deleteMany({
        where: { id: input.id, userId: user.id },
      });
      return { success: true };
    }),

  analyze: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!user) return { success: false };

      const capture = await ctx.db.capture.findFirst({
        where: { id: input.id, userId: user.id },
      });
      if (!capture) return { success: false };

      const description = await analyzeCapture(capture.imageUrl);
      if (!description) return { success: false };

      const descriptionUrl = await uploadDescription(description, capture.id);

      const embedding = await generateEmbedding(description);
      if (!embedding) {
        // Save descriptionUrl even if embedding fails
        await ctx.db.capture.update({
          where: { id: capture.id },
          data: { descriptionUrl, analyzedAt: new Date() },
        });
        return { success: true };
      }

      // Use raw SQL for the vector column
      const vectorStr = `[${embedding.join(",")}]`;
      await ctx.db.$executeRawUnsafe(
        `UPDATE "Capture" SET "descriptionUrl" = $1, "embedding" = $2::vector, "analyzedAt" = NOW() WHERE "id" = $3`,
        descriptionUrl,
        vectorStr,
        capture.id
      );

      return { success: true };
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!user) return [];

      const queryEmbedding = await generateEmbedding(input.query);
      if (!queryEmbedding) return [];

      const vectorStr = `[${queryEmbedding.join(",")}]`;
      const results = await ctx.db.$queryRawUnsafe<
        Array<{
          id: string;
          imageUrl: string;
          descriptionUrl: string | null;
          analyzedAt: Date | null;
          sourceUrl: string | null;
          createdAt: Date;
          updatedAt: Date;
          userId: string;
          similarity: number;
        }>
      >(
        `SELECT "id", "imageUrl", "descriptionUrl", "analyzedAt", "sourceUrl", "createdAt", "updatedAt", "userId",
                1 - ("embedding" <=> $1::vector) as similarity
         FROM "Capture"
         WHERE "userId" = $2 AND "embedding" IS NOT NULL
           AND 1 - ("embedding" <=> $1::vector) > 0.3
         ORDER BY "embedding" <=> $1::vector
         LIMIT 20`,
        vectorStr,
        user.id
      );

      return results;
    }),
});
