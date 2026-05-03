import type { GraphqlContext } from "../../interfaces.js";
import { prisma } from "../../lib/db.js";
import type { Tweet } from "../../lib/generated/prisma/client.js";

export interface CreateTweetPayload {
    content: string
    imageUrl?: string
}

const queries = {
    getAllTweets: async () => prisma.tweet.findMany({ orderBy: { createdAt: 'desc' } }),
}

const mutations = {
    createTweet: async (parent: any, {payload}:{payload: CreateTweetPayload}, ctx: GraphqlContext) => {
        if (!ctx.user) {
            throw new Error('User not authenticated');
        }

        const tweet = await prisma.tweet.create({
            data: {
                content: payload.content,
                imageUrl: payload.imageUrl ?? null,
                author: { connect: { id: ctx.user.id } },
            }
        })
        
        return tweet;
    }
};

const extraResolvers = {
    Tweet: {
        author: async (parent: Tweet) => prisma.user.findUnique({ where: { id: parent.authorId }})
    }
};

export const resolvers = { queries, mutations, extraResolvers };