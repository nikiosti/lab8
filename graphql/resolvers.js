import { PubSub } from "graphql-subscriptions";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         role:
 *           type: string
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         boardState:
 *           type: string
 *         players:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         currentPlayerId:
 *           type: integer
 *         status:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User management
 *   - name: Game
 *     description: Game management
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [User ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     tags: [User ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */

/**
 * @swagger
 * /games:
 *   get:
 *     summary: Get all games
 *     tags: [Game]
 *     responses:
 *       200:
 *         description: A list of games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Game'
 */

/**
 * @swagger
 * /createGame:
 *   post:
 *     summary: Create a new game
 *     tags: [Game]
 *     responses:
 *       200:
 *         description: Game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */

/**
 * @swagger
 * /makeMove:
 *   post:
 *     summary: Make a move in a game
 *     tags: [Game]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameId:
 *                 type: integer
 *               newBoardState:
 *                 type: string
 *     responses:
 *       200:
 *         description: Move made successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */

/**
 * @swagger
 * /gameUpdated:
 *   get:
 *     summary: Subscribe to game updates
 *     tags: [Game]
 *     responses:
 *       200:
 *         description: Subscription to game updates
 */
const pubsub = new PubSub();
const JWT_SECRET = "123";

const resolvers = {
  Query: {
    me: (_, __, { user, prisma }) =>
      user ? prisma.user.findUnique({ where: { id: user.id } }) : null,
    games: (_, __, { prisma }) =>
      prisma.game.findMany({
        include: {
          players: true,
        },
      }),
  },
  Mutation: {
    register: async (_, { username, password }, { prisma }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, password: hashedPassword },
      });
      return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET
      );
    },
    login: async (_, { username, password }, { prisma }) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.password)))
        throw new Error("Invalid credentials");
      return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET
      );
    },
    createGame: async (_, __, { user, prisma }) => {
      if (!user) throw new Error("Authentication required");
      console.log(11, user);
      return prisma.game.create({
        data: {
          boardState: "test board",
          players: { connect: { id: user.id } },
          currentPlayerId: user.id,
        },
        include: {
          players: true,
        },
      });
    },
    makeMove: async (_, { gameId, newBoardState }, { user, prisma }) => {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game || game.currentPlayerId !== user.id)
        throw new Error("Not your turn");
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: { boardState: newBoardState },
      });
      pubsub.publish("GAME_UPDATED", { gameUpdated: updatedGame });
      return updatedGame;
    },
  },
  Subscription: {
    gameUpdated: {
      subscribe: (_, { gameId }) => {
        if (!gameId) throw new Error("gameId is required for subscription");
        return pubsub.asyncIterator(`GAME_UPDATED_${gameId}`);
      },
    },
  },
};

export default resolvers;
