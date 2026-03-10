import path from "path";
import type { Express, Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerSpec = swaggerJSDoc({
  apis: [path.join(process.cwd(), "src/docs/openapi.yaml"), path.join(process.cwd(), "src/docs/paths/**/*.yaml")],
  definition: {
    openapi: "3.0.3",
    info: {
      title: "sms_kakao_server API",
      version: "1.0.0",
      description: "플랫큐브 문자/카카오 발송 API 문서",
    },
  },
});

export const setupSwagger = (app: Express) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.status(200).json(swaggerSpec);
  });
};
