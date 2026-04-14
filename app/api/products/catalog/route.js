import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const org_id = searchParams.get("org_id");
    const product_type = searchParams.get("product_type");
    const search = searchParams.get("search");

    let query = `
      SELECT pc.*, o.org_name 
      FROM product_catalog pc
      LEFT JOIN organizations o ON pc.org_id = o.org_id
      WHERE 1=1
    `;
    const params = [];

    if (org_id) {
      query += " AND pc.org_id = ?";
      params.push(org_id);
    }

    if (product_type) {
      query += " AND pc.product_type = ?";
      params.push(product_type);
    }

    if (search) {
      query +=
        " AND (pc.product_name LIKE ? OR pc.description LIKE ? OR pc.sku LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += " ORDER BY pc.created_at DESC";

    const [rows] = await pool.execute(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Products catalog API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      product_name,
      product_type,
      description,
      sku,
      weight,
      dimensions,
      org_id,
    } = body;

    // Validation checks
    if (!product_name || !product_type || !org_id) {
      return NextResponse.json(
        {
          error: "Missing required fields: product_name, product_type, org_id",
        },
        { status: 400 },
      );
    }

    if (
      !["raw_material", "component", "finished_product"].includes(product_type)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product_type. Must be raw_material, component, or finished_product",
        },
        { status: 400 },
      );
    }

    if (product_name.length > 255) {
      return NextResponse.json(
        { error: "Product name must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (sku && sku.length > 100) {
      return NextResponse.json(
        { error: "SKU must be less than 100 characters" },
        { status: 400 },
      );
    }

    if (weight && (weight < 0 || weight > 999999.999)) {
      return NextResponse.json(
        { error: "Weight must be between 0 and 999999.999" },
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

    // Check if SKU already exists (if provided)
    if (sku) {
      const [skuCheck] = await pool.execute(
        "SELECT catalog_id FROM product_catalog WHERE sku = ?",
        [sku],
      );

      if (skuCheck.length > 0) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 409 },
        );
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO product_catalog 
       (product_name, product_type, description, sku, weight, dimensions, org_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product_name,
        product_type,
        description || null,
        sku || null,
        weight || null,
        dimensions || null,
        org_id,
      ],
    );

    return NextResponse.json(
      {
        message: "Product created successfully",
        catalog_id: result.insertId,
        product_name: product_name,
        sku: sku,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
