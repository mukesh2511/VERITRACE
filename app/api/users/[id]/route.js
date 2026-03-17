import pool from "../../../../config/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.execute(
      `SELECT u.user_id, u.org_id, u.name, u.email, u.role, 
              u.created_at, u.last_login, u.is_active, u.phone,
              o.org_name, o.org_type
       FROM users u
       LEFT JOIN organizations o ON u.org_id = o.org_id
       WHERE u.user_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { org_id, name, email, role, phone, is_active, password } = body;

    // Check if user exists
    const [userCheck] = await pool.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (org_id !== undefined) {
      // Check if organization exists
      const [orgCheck] = await pool.execute(
        "SELECT org_id FROM organizations WHERE org_id = ?",
        [org_id]
      );
      if (orgCheck.length === 0) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        );
      }
      updateFields.push("org_id = ?");
      params.push(org_id);
    }

    if (name !== undefined) {
      if (name.length > 255) {
        return NextResponse.json(
          { error: "Name must be less than 255 characters" },
          { status: 400 }
        );
      }
      updateFields.push("name = ?");
      params.push(name);
    }

    if (email !== undefined) {
      if (email.length > 255) {
        return NextResponse.json(
          { error: "Email must be less than 255 characters" },
          { status: 400 }
        );
      }
      // Check if email already exists for another user
      const [emailCheck] = await pool.execute(
        "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
        [email, id]
      );
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
      updateFields.push("email = ?");
      params.push(email);
    }

    if (role !== undefined) {
      if (!['admin', 'manager', 'operator'].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be admin, manager, or operator" },
          { status: 400 }
        );
      }
      updateFields.push("role = ?");
      params.push(role);
    }

    if (phone !== undefined) {
      updateFields.push("phone = ?");
      params.push(phone);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      params.push(is_active);
    }

    if (password !== undefined) {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      updateFields.push("password_hash = ?");
      params.push(password_hash);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    params.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "User updated successfully"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const [userCheck] = await pool.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    await pool.execute("DELETE FROM users WHERE user_id = ?", [id]);

    return NextResponse.json({
      message: "User deleted successfully"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
