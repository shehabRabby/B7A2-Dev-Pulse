import { pool } from "../../db/index";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  const queryText = `
    INSERT INTO issues (title, description, type, priority, creator_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    payload.title,
    payload.description,
    payload.type,
    payload.priority,
    payload.creator_id,
  ];

  const result = await pool.query(queryText, values);
  return result.rows[0];
};

export const IssueServices = {
  createIssueIntoDB,
};
