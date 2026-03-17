import pool from "../../../../config/db";
import { NextResponse } from "next/server";

/*
CREATE ORGANIZATION
POST /api/organizations
*/
export async function POST(req) {
  try {
    const body = await req.json();

    const { org_name, org_type, country } = body;

    if (!org_name || !org_type) {
      return NextResponse.json(
        { error: "Organization name and type are required" },
        { status: 400 },
      );
    }

    const query = `
      INSERT INTO organizations (org_name, org_type, country)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      org_name,
      org_type,
      country || null,
    ]);

    return NextResponse.json({
      message: "Organization created successfully",
      org_id: result.insertId,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/*
GET ALL ORGANIZATIONS
GET /api/organizations
*/
export async function GET() {
  try {
    const query = `
      SELECT * FROM organizations
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.execute(query);

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
