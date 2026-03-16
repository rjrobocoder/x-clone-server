import express, { type Express } from 'express';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';

export async function initServer(): Promise<Express> {
    const app = express();
    app.use(bodyParser.json());
    
    const graphqlServer = new ApolloServer({
        typeDefs: `
            type Query {
                sayHello: String
            }
        `,
        resolvers: {
            Query: {
                sayHello: () => 'Hello World!',
            }
        },
    });

    await graphqlServer.start();

    app.use('/graphql', expressMiddleware(graphqlServer));

    return app;
}
