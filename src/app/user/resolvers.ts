import axios from "axios";
import { GraphQLError } from "graphql";
import { prisma } from "../../lib/db.js";
import JWTService from "../../services/jwt.js";
import type { GraphqlContext } from "../../interfaces.js";

interface GoogleTokenResult {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: 'true' | 'false' | boolean;
  nbf: string | number;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string | number;
  exp: string | number;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}

const queries = {
    verifyGoogleToken: async (parent: any, { token }:{ token: string }) => {
        if (!token) throw new GraphQLError('Token is required', { extensions: { code: 'BAD_USER_INPUT' } });
        const googleToken = token;
        const googleOauthURL = new URL('https://oauth2.googleapis.com/tokeninfo');
        googleOauthURL.searchParams.set('id_token', googleToken);

        try {
            const { data } = await axios.get<GoogleTokenResult>(googleOauthURL.toString(), {
                responseType: 'json',
            });

            const user = await prisma.user.findUnique({ where: { email: data.email }});

            if (!user) {
                await prisma.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageUrl: data.picture,
                    }
                });
            }
            
            const userInDb = await prisma.user.findUnique({ where: { email: data.email }})
            if (!userInDb) throw new Error('User with email not found');
            
            const userToken = JWTService.generateTokenForUser(userInDb);
            
            return userToken;
        } catch (error: any) {
            const status = error?.response?.status;
            const message = error?.message;
            throw new GraphQLError(message, {
                extensions: { code: status === 400 ? "BAD_USER_INPUT" : "INTERNAL_SERVER_ERROR" },
            });
        }

    },
    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
        const id = ctx.user?.id;
        if (!id) throw new GraphQLError('User not found', { extensions: { code: 'UNAUTHORIZED' } });
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new GraphQLError('User not found', { extensions: { code: 'UNAUTHORIZED' } });
        return user;
    }
}

export const resolvers = { queries };
