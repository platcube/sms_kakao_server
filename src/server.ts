import dotenv from "dotenv";

import { createApp } from "@/app";
import { notFoundHandler } from "@/libs/error/not-found";
import { errorHandler } from "@/libs/error/error-handler";

dotenv.config();

const app = createApp();

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Server ready at http://localhost:${port}`);
});
