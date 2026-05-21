import { pool } from "../../db/index";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue) => {
  // 🎯 priority বাদ দিয়ে ৪টি ফিল্ডের জন্য ক্লিন SQL কুয়েরি
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

  // ১. ডাইনামিক ফিল্টারিং (Type: bug or feature_request)
  if (type) {
    queryText += ` AND type = $${paramCounter}`;
    queryParams.push(type);
    paramCounter++;
  }

  // ২. ডাইনামিক ফিল্টারিং (Status: open, in_progress, resolved)
  if (status) {
    queryText += ` AND status = $${paramCounter}`;
    queryParams.push(status);
    paramCounter++;
  }

  // ৩. সর্টিং হ্যান্ডলার (Newest or Oldest)
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

  // 🎯 রিকোয়ারমেন্টের শর্ত অনুযায়ী JOIN ছাড়া ব্যাচ কুয়েরির মাধ্যমে রিপোর্টার ডাটা ফেচ করা
  const creatorIds = [...new Set(issues.map((issue) => issue.creator_id))];
  const placeholders = creatorIds.map((_, index) => `$${index + 1}`).join(", ");
  const userQueryText = `SELECT id, name, role FROM users WHERE id IN (${placeholders});`;

  const userResult = await pool.query(userQueryText, creatorIds);
  const users = userResult.rows;

  const userMap: Record<number, any> = {};
  users.forEach((user) => {
    userMap[user.id] = user;
  });

  // 🎯 ৪. ফাইনাল আউটপুট ফরম্যাটিং (হুবহু রিকোয়ারমেন্টের রেসপন্স অবজেক্টের স্ট্রাকচার)
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
  // ১. নির্দিষ্ট আইডি দিয়ে ইস্যুর ডাটা রিট্রিভ করা
  const queryText = `SELECT * FROM issues WHERE id = $1;`;
  const result = await pool.query(queryText, [id]);
  const issue = result.rows[0];

  if (!issue) {
    return null;
  }

  // ২. রিকোয়ারমেন্ট অনুযায়ী JOIN ছাড়া আলাদা কোয়েরি দিয়ে ইউজারের (Reporter) ডাটা রিট্রিভ করা
  const userQueryText = `SELECT id, name, role FROM users WHERE id = $1;`;
  const userResult = await pool.query(userQueryText, [issue.creator_id]);
  const user = userResult.rows[0];

  // ৩. ফাইনাল আউটপুট রেসপন্স অবজেক্ট (রিকোয়ারমেন্টের ৫ নম্বর এন্ডপয়েন্টের হুবহু ফরম্যাট)
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
  // ১. ডাটাবেজ থেকে ইস্যু খুঁজে বের করা
  const issueCheck = await pool.query(`SELECT * FROM issues WHERE id = $1;`, [
    issueId,
  ]);

  if (issueCheck.rows.length === 0) {
    return { errorType: "ISSUE_NOT_FOUND", data: null };
  }

  const issue = issueCheck.rows[0];

  // ২. রোল-বেসড পারমিশন ও ওয়ার্কফ্লো স্ট্যাটাস ভ্যালিডেশন
  if (user.role === "contributor") {
    // কন্ট্রিবিউটর শুধুমাত্র নিজের ইস্যু আপডেট করতে পারবে
    if (issue.creator_id === user.id) {
      // কন্ট্রিবিউটর শুধুমাত্র 'open' স্ট্যাটাসে থাকা ইস্যুই আপডেট করতে পারবে
      if (issue.status !== "open") {
        return { errorType: "ISSUE_NOT_OPEN", data: null };
      }
      // কন্ট্রিবিউটর নিজে ইস্যুর স্ট্যাটাস চেঞ্জ করতে পারবে না
      if (payload.status) {
        return { errorType: "UNAUTHORIZED_ACTION", data: null };
      }
    } else {
      return { errorType: "UNAUTHORIZED_ACTION", data: null };
    }
  }

  // ৩. ডাইনামিক কুয়েরি বিল্ডার (SQL injection নিরাপদ রাখতে)
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

  // 🎯 মেইনটেইনার স্বাধীনভাবে স্ট্যাটাস চেঞ্জ করতে পারবে (রিকোয়ারমেন্টের শর্ত)
  if (payload.status && user.role === "maintainer") {
    fields.push(`status = $${paramCounter}`);
    values.push(payload.status);
    paramCounter++;
  }

  // যদি বডিতে কোনো আপডেট করার মতো ডাটা না থাকে
  if (fields.length === 0) {
    return { errorType: "NO_DATA_PROVIDED", data: null };
  }

  // অটোমেটিক্যালি updated_at টাইমস্ট্যাম্প রিফ্রেশ করা
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
