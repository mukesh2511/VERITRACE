import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const parent_unit_id = searchParams.get("parent_unit_id");
    const child_unit_id = searchParams.get("child_unit_id");

    let query = `
      SELECT ar.*,
             parent.serial_number as parent_serial_number,
             parent.status as parent_status,
             pc_parent.product_name as parent_product_name,
             child.serial_number as child_serial_number,
             child.status as child_status,
             pc_child.product_name as child_product_name
      FROM assembly_relationship ar
      LEFT JOIN product_unit parent ON ar.parent_unit_id = parent.unit_id
      LEFT JOIN product_catalog pc_parent ON parent.catalog_id = pc_parent.catalog_id
      LEFT JOIN product_unit child ON ar.child_unit_id = child.unit_id
      LEFT JOIN product_catalog pc_child ON child.catalog_id = pc_child.catalog_id
      WHERE 1=1
    `;
    const params = [];

    if (parent_unit_id) {
      query += " AND ar.parent_unit_id = ?";
      params.push(parent_unit_id);
    }

    if (child_unit_id) {
      query += " AND ar.child_unit_id = ?";
      params.push(child_unit_id);
    }

    query += " ORDER BY ar.assembled_at DESC";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No assembly relationships found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { parent_unit_id, child_unit_id, quantity } = body;

    // Validation checks
    if (!parent_unit_id || !child_unit_id) {
      return NextResponse.json(
        { error: "Missing required fields: parent_unit_id, child_unit_id" },
        { status: 400 },
      );
    }

    if (parent_unit_id === child_unit_id) {
      return NextResponse.json(
        { error: "Parent and child unit cannot be the same" },
        { status: 400 },
      );
    }

    if (quantity && (quantity < 1 || quantity > 999999)) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 999999" },
        { status: 400 },
      );
    }

    // Check if parent unit exists
    const [parentCheck] = await pool.execute(
      "SELECT unit_id, status FROM product_unit WHERE unit_id = ?",
      [parent_unit_id],
    );

    if (parentCheck.length === 0) {
      return NextResponse.json(
        { error: "Parent unit not found" },
        { status: 404 },
      );
    }

    // Check if child unit exists
    const [childCheck] = await pool.execute(
      "SELECT unit_id, status FROM product_unit WHERE unit_id = ?",
      [child_unit_id],
    );

    if (childCheck.length === 0) {
      return NextResponse.json(
        { error: "Child unit not found" },
        { status: 404 },
      );
    }

    // Check if assembly relationship already exists
    const [existingCheck] = await pool.execute(
      "SELECT assembly_id FROM assembly_relationship WHERE parent_unit_id = ? AND child_unit_id = ?",
      [parent_unit_id, child_unit_id],
    );

    if (existingCheck.length > 0) {
      return NextResponse.json(
        { error: "Assembly relationship already exists" },
        { status: 409 },
      );
    }

    // Check for circular dependencies (prevent infinite loops)
    const [circularCheck] = await pool.execute(
      `
      WITH RECURSIVE assembly_tree AS (
        SELECT child_unit_id, parent_unit_id
        FROM assembly_relationship
        WHERE parent_unit_id = ?
        
        UNION ALL
        
        SELECT ar.child_unit_id, ar.parent_unit_id
        FROM assembly_relationship ar
        JOIN assembly_tree at ON ar.parent_unit_id = at.child_unit_id
      )
      SELECT COUNT(*) as count FROM assembly_tree WHERE child_unit_id = ?
      `,
      [child_unit_id, parent_unit_id],
    );

    if (circularCheck[0].count > 0) {
      return NextResponse.json(
        {
          error:
            "Circular dependency detected - this would create an infinite loop",
        },
        { status: 400 },
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO assembly_relationship (parent_unit_id, child_unit_id, quantity) 
       VALUES (?, ?, ?)`,
      [parent_unit_id, child_unit_id, quantity || 1],
    );

    // Update parent unit status to 'assembled'
    await pool.execute(
      "UPDATE product_unit SET status = 'assembled' WHERE unit_id = ?",
      [parent_unit_id],
    );

    return NextResponse.json(
      {
        message: "Assembly relationship created successfully",
        assembly_id: result.insertId,
        parent_unit_id: parent_unit_id,
        child_unit_id: child_unit_id,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
