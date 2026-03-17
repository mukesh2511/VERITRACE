import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
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

    // Get BOM items
    const [rows] = await pool.execute(
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

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No items found for this BOM" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { component_catalog_id, quantity } = body;

    // Validation checks
    if (!component_catalog_id || !quantity || quantity < 1) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: component_catalog_id, quantity (>= 1)",
        },
        { status: 400 },
      );
    }

    // Check if BOM exists
    const [bomCheck] = await pool.execute(
      "SELECT bom_id, catalog_id FROM bom WHERE bom_id = ?",
      [id],
    );

    if (bomCheck.length === 0) {
      return NextResponse.json({ error: "BOM not found" }, { status: 404 });
    }

    const bomCatalogId = bomCheck[0].catalog_id;

    // Check if component catalog exists
    const [catalogCheck] = await pool.execute(
      "SELECT catalog_id, product_name FROM product_catalog WHERE catalog_id = ?",
      [component_catalog_id],
    );

    if (catalogCheck.length === 0) {
      return NextResponse.json(
        { error: "Component catalog not found" },
        { status: 404 },
      );
    }

    // Check for self-reference
    if (component_catalog_id === bomCatalogId) {
      return NextResponse.json(
        { error: "Product cannot contain itself as a component" },
        { status: 400 },
      );
    }

    // Check if item already exists in this BOM
    const [existingCheck] = await pool.execute(
      "SELECT bom_item_id FROM bom_items WHERE bom_id = ? AND component_catalog_id = ?",
      [id, component_catalog_id],
    );

    if (existingCheck.length > 0) {
      return NextResponse.json(
        { error: "Component already exists in this BOM" },
        { status: 409 },
      );
    }

    // Add new item
    const [result] = await pool.execute(
      "INSERT INTO bom_items (bom_id, component_catalog_id, quantity) VALUES (?, ?, ?)",
      [id, component_catalog_id, quantity],
    );

    return NextResponse.json(
      {
        message: "Component added to BOM successfully",
        bom_item_id: result.insertId,
        bom_id: id,
        component_catalog_id: component_catalog_id,
        component_name: catalogCheck[0].product_name,
        quantity: quantity,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
