import bcrypt from "bcrypt";
import { pool } from "../../db/index";
import type { TUser } from "./user.interface";

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

  // return full data except password
  return result.rows[0];
};

export const UserServices = {
  createUserIntoDB,
};
