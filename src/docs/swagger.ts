import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const yaml = require("js-yaml") as {
  load: (source: string) => unknown;
};

const openapiDefinition = yaml.load(
  fs.readFileSync(path.join(process.cwd(), "src/docs/openapi.yaml"), "utf8"),
) as Record<string, unknown>;

const swaggerSpec = swaggerJSDoc({
  apis: [path.join(process.cwd(), "src/docs/paths/**/*.yaml")],
  definition: openapiDefinition,
});

export const setupSwagger = (app: Express) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.status(200).json(swaggerSpec);
  });
};
