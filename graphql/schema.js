import { gql } from "apollo-server-koa";

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    role: String!
  }

  type Game {
    id: ID!
    boardState: String!
    players: [User!]!
    currentPlayerId: Int!
    status: String!
  }

  type Query {
    me: User
    games: [Game!]!
  }

  type Mutation {
    register(username: String!, password: String!): String
    login(username: String!, password: String!): String
    createGame: Game
    makeMove(gameId: Int!, newBoardState: String!): Game
  }

  type Subscription {
    gameUpdated(gameId: Int!): Game
  }
`;

export default typeDefs;
