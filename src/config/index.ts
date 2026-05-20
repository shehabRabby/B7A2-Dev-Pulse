import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT || 5000,
  connection_string: process.env.CONNECTION_STRING as string,
  jwt_secret: (process.env.JWT_SECRET ||
    "super_secret_key_for_devpulse_2026") as string,
  jwt_expires_in: (process.env.JWT_EXPIRES_IN || "1d") as string,
};

export default config;
