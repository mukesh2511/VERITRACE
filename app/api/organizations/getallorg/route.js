import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    let query = "SELECT * FROM organizations WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (org_name LIKE ? OR country LIKE ? OR org_type LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (status) {
      if (status === "active") {
        query += " AND is_active = 1";
      } else if (status === "inactive") {
        query += " AND is_active = 0";
      } else if (status === "suspended") {
        query += " AND is_active = 0";
      }
    }

    query += " ORDER BY org_name";

    const [rows] = await pool.execute(query, params);

    if (rows.length == 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Organizations API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
