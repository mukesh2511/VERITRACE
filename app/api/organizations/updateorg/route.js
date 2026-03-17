import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { org_name, org_type, country } = body;

    const [rows] = await pool.execute(
      "SELECT * FROM organizations WHERE org_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    await pool.execute(
      "UPDATE organizations SET org_name=?, org_type=?, country=? WHERE org_id=?",
      [org_name, org_type, country, id],
    );

    return NextResponse.json({
      message: "Organization updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
