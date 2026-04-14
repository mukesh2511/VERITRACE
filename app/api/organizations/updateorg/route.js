import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, org_name, org_type, country, contact_email, phone, address } =
      body;
    console.log("Received data:", body);
    parseInt(id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid organization ID" },
        { status: 400 },
      );
    }

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
      "UPDATE organizations SET org_name=?, org_type=?, country=?, contact_email=?, phone=?, address=? WHERE org_id=?",
      [
        org_name || rows[0].org_name,
        org_type || rows[0].org_type,
        country || rows[0].country,
        contact_email || rows[0].contact_email,
        phone || rows[0].phone,
        address || rows[0].address,
        id,
      ],
    );

    return NextResponse.json({
      message: "Organization updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
