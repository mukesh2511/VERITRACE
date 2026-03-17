import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { org_name, org_type, country } = body;

    // Validation checks
    if (!org_name || org_name.trim() === "") {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    if (!org_type || org_type.trim() === "") {
      return NextResponse.json(
        { error: "Organization type is required" },
        { status: 400 },
      );
    }

    if (org_name.length > 255) {
      return NextResponse.json(
        { error: "Organization name must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (org_type.length > 100) {
      return NextResponse.json(
        { error: "Organization type must be less than 100 characters" },
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
      message: "Organization created",
      org_id: result.insertId,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
