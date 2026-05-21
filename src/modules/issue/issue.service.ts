import { pool } from "../../db/index";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  const queryText = `
    INSERT INTO issues (title, description, type, creator_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [
    payload.title,
    payload.description,
    payload.type,
    payload.creator_id,
  ];

  const result = await pool.query(queryText, values);
  return result.rows[0];
};

const getAllIssuesFromDB = async (query: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort, type, status } = query;

  let queryText = `SELECT * FROM issues WHERE 1=1`;
  const queryParams: any[] = [];
  let paramCounter = 1;

  if (type) {
    queryText += ` AND type = $${paramCounter}`;
    queryParams.push(type);
    paramCounter++;
  }

  if (status) {
    queryText += ` AND status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }

  if (sort === "oldest") {
    queryText += ` ORDER BY created_at ASC;`;
  } else {
    queryText += ` ORDER BY created_at DESC;`;
  }

  const issueResult = await pool.query(queryText, queryParams);
  const issues = issueResult.rows;

  if (issues.length === 0) {
    return [];
  }

  const creatorIds = [...new Set(issues.map((issue) => issue.creator_id))];
  const placeholders = creatorIds.map((_, index) => `$${index + 1}`).join(", ");
  const userQueryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;

  const userResult = await pool.query(userQueryText, creatorIds);
  const users = userResult.rows;

  const userMap: Record<number, any> = {};
  users.forEach((user) => {
    userMap[user.id] = user;
  });

  const finalIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap[issue.creator_id]
      ? {
          id: userMap[issue.creator_id].id,
          name: userMap[issue.creator_id].name,
          role: userMap[issue.creator_id].role,
        }
      : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return finalIssues;
};

const getSingleIssueFromDB = async (id: string) => {

  const queryText = `SELECT * FROM issues WHERE id = $1;`;
  const result = await pool.query(queryText, [id]);
  const issue = result.rows[0];

  if (!issue) {
    return null;
  }

  const userQueryText = `SELECT id, name, role FROM users WHERE id = $1;`;
  const userResult = await pool.query(userQueryText, [issue.creator_id]);
  const user = userResult.rows[0];

  const formattedIssue = {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user
      ? {
          id: user.id,
          name: user.name,
          role: user.role,
        }
      : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };

  return formattedIssue;
};

const updateIssueInDB = async (
  issueId: string,
  user: { id: number; role: string },
  payload: {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
  },
) => {
 
  const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [
    issueId,
  ]);

  if (issueCheck.rows.length === 0) {
    return { errorType: "ISSUE_NOT_FOUND", data: null };
  }

  const issue = issueCheck.rows[0];

  if (user.role === "contributor") {
    if (issue.creator_id === user.id) {
      if (issue.status !== "open") {
        return { errorType: "ISSUE_NOT_OPEN", data: null };
      }
      if (payload.status) {
        return { errorType: "UNAUTHORIZED_ACTION", data: null };
      }
    } else {
      return { errorType: "UNAUTHORIZED_ACTION", data: null };
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  if (payload.title) {
    fields.push(`title = $${paramCounter}`);
    values.push(payload.title);
    paramCounter++;
  }
  if (payload.description) {
    fields.push(`description = $${paramCounter}`);
    values.push(payload.description);
    paramCounter++;
  }
  if (payload.type) {
    fields.push(`type = $${paramCounter}`);
    values.push(payload.type);
    paramCounter++;
  }

  if (payload.status && user.role === "maintainer") {
    fields.push(`status = $${paramCounter}`);
    values.push(payload.status);
    paramCounter++;
  }

  if (fields.length === 0) {
    return { errorType: "NO_DATA_PROVIDED", data: null };
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const queryText = `
    UPDATE issues 
    SET ${fields.join(", ")}
    WHERE id = $${paramCounter}
    RETURNING *;
  `;
  values.push(issueId);

  const result = await pool.query(queryText, values);
  return { errorType: null, data: result.rows[0] };
};

const deleteIssueFromDB = async (issueId: string) => {
  const queryText = `
    DELETE FROM issues 
    WHERE id = $1 
    RETURNING id;
  `;

  const result = await pool.query(queryText, [issueId]);
  if (result.rows.length === 0) {
    return false;
  }

  return true;
};

export const IssueServices = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};
