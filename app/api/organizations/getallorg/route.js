import pool from "../../../../config/db.tsx";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rows] = await pool.execute("SELECT * FROM organizations");
    if (rows.length == 0) {
      return NextResponse.json(
        { message: "No organizations found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
