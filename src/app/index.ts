import express, { type Express } from 'express';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { User } from './user/index.js';
import type { GraphqlContext } from '../interfaces.js';
import JWTService from '../services/jwt.js';
import cors from 'cors';

export async function initServer(): Promise<Express> {
    const app = express();
    app.use(bodyParser.json());
    app.use(cors());
    
    const graphqlServer = new ApolloServer<GraphqlContext>({
        typeDefs: `
            ${User.types}

            type Query {
                ${User.queries}
            }
        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
            }
        },
    });

    await graphqlServer.start();

    app.use('/graphql', expressMiddleware(graphqlServer, { context: async ({req, res}) => {
        return {
            user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split(' ')[1] || '') : undefined
        }
    }}));

    return app;
}
