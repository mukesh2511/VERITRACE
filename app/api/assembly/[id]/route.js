import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const [rows] = await pool.execute(
      `SELECT ar.*,
              parent.serial_number as parent_serial_number,
              parent.status as parent_status,
              pc_parent.product_name as parent_product_name,
              pc_parent.product_type as parent_product_type,
              child.serial_number as child_serial_number,
              child.status as child_status,
              pc_child.product_name as child_product_name,
              pc_child.product_type as child_product_type
       FROM assembly_relationship ar
       LEFT JOIN product_unit parent ON ar.parent_unit_id = parent.unit_id
       LEFT JOIN product_catalog pc_parent ON parent.catalog_id = pc_parent.catalog_id
       LEFT JOIN product_unit child ON ar.child_unit_id = child.unit_id
       LEFT JOIN product_catalog pc_child ON child.catalog_id = pc_child.catalog_id
       WHERE ar.assembly_id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Assembly relationship not found" },
        { status: 404 },
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
    const { quantity } = body;

    // Check if assembly relationship exists
    const [assemblyCheck] = await pool.execute(
      "SELECT assembly_id FROM assembly_relationship WHERE assembly_id = ?",
      [id],
    );

    if (assemblyCheck.length === 0) {
      return NextResponse.json(
        { error: "Assembly relationship not found" },
        { status: 404 },
      );
    }

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (quantity !== undefined) {
      if (quantity < 1 || quantity > 999999) {
        return NextResponse.json(
          { error: "Quantity must be between 1 and 999999" },
          { status: 400 },
        );
      }
      updateFields.push("quantity = ?");
      params.push(quantity);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE assembly_relationship SET ${updateFields.join(", ")} WHERE assembly_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "Assembly relationship updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if assembly relationship exists and get parent unit
    const [assemblyCheck] = await pool.execute(
      "SELECT assembly_id, parent_unit_id FROM assembly_relationship WHERE assembly_id = ?",
      [id],
    );

    if (assemblyCheck.length === 0) {
      return NextResponse.json(
        { error: "Assembly relationship not found" },
        { status: 404 },
      );
    }

    const parent_unit_id = assemblyCheck[0].parent_unit_id;

    await pool.execute(
      "DELETE FROM assembly_relationship WHERE assembly_id = ?",
      [id],
    );

    // Check if parent unit still has other children
    const [remainingChildren] = await pool.execute(
      "SELECT COUNT(*) as count FROM assembly_relationship WHERE parent_unit_id = ?",
      [parent_unit_id],
    );

    // If no more children, update parent status back to 'created'
    if (remainingChildren[0].count === 0) {
      await pool.execute(
        "UPDATE product_unit SET status = 'created' WHERE unit_id = ?",
        [parent_unit_id],
      );
    }

    return NextResponse.json({
      message: "Assembly relationship deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
