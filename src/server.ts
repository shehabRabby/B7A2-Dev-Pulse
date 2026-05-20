import app from "./app";
import config from "./config/index";
import { initDB } from "./db/index";

const main = () => {
  // Connect to neonDB & create tables
  initDB();

  // App listener
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
};

main();
