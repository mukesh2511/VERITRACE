import pool from "../../../config/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get("org_id");
    const role = searchParams.get("role");

    let query = `
      SELECT u.user_id, u.org_id, u.name, u.email, u.role, 
             u.created_at, u.last_login, u.is_active, u.phone,
             o.org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.org_id
      WHERE 1=1
    `;
    const params = [];

    if (org_id) {
      query += " AND u.org_id = ?";
      params.push(org_id);
    }

    if (role) {
      query += " AND u.role = ?";
      params.push(role);
    }

    query += " ORDER BY u.created_at DESC";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json({ message: "No users found" }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { org_id, name, email, password, role, phone } = body;

    // Validation checks
    if (!org_id || !name || !email || !password || !role) {
      return NextResponse.json(
        {
          error: "Missing required fields: org_id, name, email, password, role",
        },
        { status: 400 },
      );
    }

    if (!["admin", "manager", "operator"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, manager, or operator" },
        { status: 400 },
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Name must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Email must be less than 255 characters" },
        { status: 400 },
      );
    }

    // Check if organization exists
    const [orgCheck] = await pool.execute(
      "SELECT org_id FROM organizations WHERE org_id = ?",
      [org_id],
    );

    if (orgCheck.length === 0) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Check if email already exists
    const [emailCheck] = await pool.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email],
    );

    if (emailCheck.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.execute(
      `INSERT INTO users (org_id, name, email, password_hash, role, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [org_id, name, email, password_hash, role, phone || null],
    );

    return NextResponse.json(
      {
        message: "User created successfully",
        user_id: result.insertId,
        email: email,
        name: name,
        role: role,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
