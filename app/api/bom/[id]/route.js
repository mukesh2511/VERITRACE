import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Get BOM details
    const [bomRows] = await pool.execute(
      `SELECT b.*,
              pc.product_name, pc.product_type, pc.sku, pc.description,
              org.org_name as organization_name, org.country as organization_country
       FROM bom b
       LEFT JOIN product_catalog pc ON b.catalog_id = pc.catalog_id
       LEFT JOIN organizations org ON pc.org_id = org.org_id
       WHERE b.bom_id = ?`,
      [id],
    );

    if (bomRows.length === 0) {
      return NextResponse.json({ message: "BOM not found" }, { status: 404 });
    }

    const bom = bomRows[0];

    // Get BOM items
    const [itemRows] = await pool.execute(
      `SELECT bi.*,
              pc.product_name as component_name,
              pc.product_type as component_type,
              pc.sku as component_sku,
              pc.weight as component_weight,
              pc.dimensions as component_dimensions,
              pc.description as component_description,
              org.org_name as component_org_name,
              org.country as component_org_country
       FROM bom_items bi
       LEFT JOIN product_catalog pc ON bi.component_catalog_id = pc.catalog_id
       LEFT JOIN organizations org ON pc.org_id = org.org_id
       WHERE bi.bom_id = ?
       ORDER BY bi.bom_item_id`,
      [id],
    );

    bom.items = itemRows;

    // Get cost estimation (if we had cost data)
    const [costSummary] = await pool.execute(
      `SELECT COUNT(*) as total_components,
              SUM(bi.quantity) as total_quantity
       FROM bom_items bi
       WHERE bi.bom_id = ?`,
      [id],
    );

    bom.summary = {
      total_components: costSummary[0].total_components,
      total_quantity: costSummary[0].total_quantity,
    };

    return NextResponse.json(bom);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { version } = body;

    // Check if BOM exists
    const [bomCheck] = await pool.execute(
      "SELECT bom_id, catalog_id, version FROM bom WHERE bom_id = ?",
      [id],
    );

    if (bomCheck.length === 0) {
      return NextResponse.json({ error: "BOM not found" }, { status: 404 });
    }

    const currentBom = bomCheck[0];

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (version !== undefined) {
      if (version < 1) {
        return NextResponse.json(
          { error: "Version must be a positive integer" },
          { status: 400 },
        );
      }

      // Check if version already exists for this catalog (excluding current BOM)
      const [versionCheck] = await pool.execute(
        "SELECT bom_id FROM bom WHERE catalog_id = ? AND version = ? AND bom_id != ?",
        [currentBom.catalog_id, version, id],
      );

      if (versionCheck.length > 0) {
        return NextResponse.json(
          { error: "BOM with this version already exists for this product" },
          { status: 409 },
        );
      }

      updateFields.push("version = ?");
      params.push(version);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE bom SET ${updateFields.join(", ")} WHERE bom_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "BOM updated successfully",
      bom_id: id,
      old_version: currentBom.version,
      new_version: version,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if BOM exists
    const [bomCheck] = await pool.execute(
      "SELECT bom_id FROM bom WHERE bom_id = ?",
      [id],
    );

    if (bomCheck.length === 0) {
      return NextResponse.json({ error: "BOM not found" }, { status: 404 });
    }

    // Delete BOM items first (foreign key constraint)
    await pool.execute("DELETE FROM bom_items WHERE bom_id = ?", [id]);

    // Delete BOM
    await pool.execute("DELETE FROM bom WHERE bom_id = ?", [id]);

    return NextResponse.json({
      message: "BOM deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
