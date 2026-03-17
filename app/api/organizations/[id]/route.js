import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    console.log(params);
    const { id } = await params;
    //   id = parseInt(id);

    const [rows] = await pool.execute(
      "SELECT * FROM organizations WHERE org_id = ?",
      [id],
    );

    if (rows.length == 0) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
