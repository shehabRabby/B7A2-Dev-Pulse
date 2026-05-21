import bcrypt from "bcrypt";
import jwt, { type Secret } from "jsonwebtoken";
import { pool } from "../../db/index";
import type { TUser } from "./user.interface";
import config from "../../config/index";

const createUserIntoDB = async (
  userData: TUser,
): Promise<Omit<TUser, "password">> => {
  const { name, email, password, role } = userData;

  const hashedPassword = await bcrypt.hash(password!, 10);

  const queryText = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at;
  `;

  const values = [name, email, hashedPassword, role || "contributor"];

  const result = await pool.query(queryText, values);
  return result.rows[0];
};

const loginUserFromDB = async (loginData: any) => {
  const { email, password } = loginData;

  const result = await pool.query(
    `
    SELECT * FROM users WHERE email = $1;`,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate jwt token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret as Secret, {
    expiresIn: config.jwt_expires_in as any,
  });

  delete user.password;

  return {
    token,
    user,
  };
};

export const UserServices = {
  createUserIntoDB,
  loginUserFromDB,
};
