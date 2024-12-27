import swaggerJsDoc from "swagger-jsdoc";

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

export default swaggerDocs;
