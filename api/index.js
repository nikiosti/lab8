import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import { ApolloServer } from "apollo-server-koa";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import typeDefs from "../graphql/schema.js";
import resolvers from "../graphql/resolvers.js";
import swaggerUi from "swagger-ui-koa";
import swaggerJsDoc from "swagger-jsdoc";

const app = new Koa();
const prisma = new PrismaClient();
const JWT_SECRET = "123";

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation for my application",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./graphql/*.js"], // Путь к вашим файлам с аннотациями
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(bodyParser());

// Middleware для аутентификации
const authMiddleware = async (ctx, next) => {
  const token = ctx.headers.authorization;
  if (token) {
    try {
      ctx.user = jwt.verify(token, JWT_SECRET);
    } catch {
      ctx.user = null;
    }
  }
  await next();
};
app.use(authMiddleware);

// Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ ctx }) => ({ prisma, user: ctx.user }),
});
await apolloServer.start();
apolloServer.applyMiddleware({ app });

// Swagger UI
app.use(swaggerUi.serve);
app.use(swaggerUi.setup(swaggerDocs));

// Создание HTTP-сервера
const httpServer = app.listen(3001, () => {
  console.log("Сервер запущен на http://localhost:3001/graphql");
});

// WebSocket Server
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

// Используйте схему из Apollo Server
useServer({ schema: apolloServer.schema, context: { prisma } }, wsServer);
