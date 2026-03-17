import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const catalog_id = searchParams.get("catalog_id");
    const version = searchParams.get("version");
    const include_items = searchParams.get("include_items") === "true";

    let query = `
      SELECT b.*,
             pc.product_name, pc.product_type, pc.sku,
             org.org_name as organization_name
      FROM bom b
      LEFT JOIN product_catalog pc ON b.catalog_id = pc.catalog_id
      LEFT JOIN organizations org ON pc.org_id = org.org_id
      WHERE 1=1
    `;
    const params = [];

    if (catalog_id) {
      query += " AND b.catalog_id = ?";
      params.push(catalog_id);
    }

    if (version) {
      query += " AND b.version = ?";
      params.push(version);
    }

    query += " ORDER BY b.catalog_id, b.version DESC";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json({ message: "No BOMs found" }, { status: 404 });
    }

    // If include_items is true, fetch BOM items for each BOM
    if (include_items) {
      for (const bom of rows) {
        const [itemRows] = await pool.execute(
          `SELECT bi.*,
                  pc.product_name as component_name,
                  pc.product_type as component_type,
                  pc.sku as component_sku,
                  pc.weight as component_weight,
                  pc.dimensions as component_dimensions
           FROM bom_items bi
           LEFT JOIN product_catalog pc ON bi.component_catalog_id = pc.catalog_id
           WHERE bi.bom_id = ?
           ORDER BY bi.bom_item_id`,
          [bom.bom_id],
        );
        bom.items = itemRows;
      }
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { catalog_id, version, items } = body;

    // Validation checks
    if (
      !catalog_id ||
      !version ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: catalog_id, version, items (array)",
        },
        { status: 400 },
      );
    }

    if (version < 1) {
      return NextResponse.json(
        { error: "Version must be a positive integer" },
        { status: 400 },
      );
    }

    // Validate items array
    for (const item of items) {
      if (!item.component_catalog_id || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          {
            error:
              "Each item must have component_catalog_id and quantity (>= 1)",
          },
          { status: 400 },
        );
      }
    }

    // Check if product catalog exists
    const [catalogCheck] = await pool.execute(
      "SELECT catalog_id, product_name FROM product_catalog WHERE catalog_id = ?",
      [catalog_id],
    );

    if (catalogCheck.length === 0) {
      return NextResponse.json(
        { error: "Product catalog not found" },
        { status: 404 },
      );
    }

    // Check if BOM with same catalog_id and version already exists
    const [existingCheck] = await pool.execute(
      "SELECT bom_id FROM bom WHERE catalog_id = ? AND version = ?",
      [catalog_id, version],
    );

    if (existingCheck.length > 0) {
      return NextResponse.json(
        { error: "BOM with this version already exists for this product" },
        { status: 409 },
      );
    }

    // Validate all component catalog IDs
    const componentCatalogIds = items.map((item) => item.component_catalog_id);
    const [componentCatalogCheck] = await pool.execute(
      `SELECT catalog_id, product_name FROM product_catalog 
       WHERE catalog_id IN (${componentCatalogIds.map(() => "?").join(",")})`,
      componentCatalogIds,
    );

    if (componentCatalogCheck.length !== componentCatalogIds.length) {
      return NextResponse.json(
        { error: "One or more component catalogs not found" },
        { status: 404 },
      );
    }

    // Check for self-reference (product cannot contain itself as component)
    if (componentCatalogIds.includes(catalog_id)) {
      return NextResponse.json(
        { error: "Product cannot contain itself as a component" },
        { status: 400 },
      );
    }

    // Create BOM
    const [bomResult] = await pool.execute(
      "INSERT INTO bom (catalog_id, version) VALUES (?, ?)",
      [catalog_id, version],
    );

    const bom_id = bomResult.insertId;

    // Create BOM items
    for (const item of items) {
      await pool.execute(
        "INSERT INTO bom_items (bom_id, component_catalog_id, quantity) VALUES (?, ?, ?)",
        [bom_id, item.component_catalog_id, item.quantity],
      );
    }

    return NextResponse.json(
      {
        message: "BOM created successfully",
        bom_id: bom_id,
        catalog_id: catalog_id,
        product_name: catalogCheck[0].product_name,
        version: version,
        items_count: items.length,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
