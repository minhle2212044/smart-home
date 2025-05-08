module.exports = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Smart Home API",
        version: "1.0.0",
        description: "Tài liệu Swagger cho hệ thống nhà thông minh",
      },
      servers: [
        {
          url: "http://localhost:3003",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ["./src/routes/*.js"],
  };
  