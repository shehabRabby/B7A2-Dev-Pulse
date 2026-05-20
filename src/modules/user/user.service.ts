import bcrypt from "bcrypt";
import { pool } from "../../db/index";
import type { TUser } from "./user.interface";

const createUserIntoDB = async (
  userData: TUser,
): Promise<Omit<TUser, "password">> => {
  const { name, email, password, role } = userData;

  // ১. পাসওয়ার্ড হ্যাশ করা (salt rounds 8-12 এর মধ্যে ১০ বেস্ট)
  const hashedPassword = await bcrypt.hash(password!, 10);

  // ২. Raw SQL কুয়েরি দিয়ে ডাটা ইনসার্ট করা
  const queryText = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at;
  `;

  const values = [name, email, hashedPassword, role || "contributor"];

  const result = await pool.query(queryText, values);

  // ৩. রিকোয়ারমেন্ট অনুযায়ী পাসওয়ার্ড ছাড়া শুধুমাত্র বাকি ডাটা রিটার্ন করা
  return result.rows[0];
};

export const UserServices = {
  createUserIntoDB,
};
