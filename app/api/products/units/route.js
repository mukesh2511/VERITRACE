import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const catalog_id = searchParams.get("catalog_id");
    const manufacturer_org_id = searchParams.get("manufacturer_org_id");
    const status = searchParams.get("status");
    const serial_number = searchParams.get("serial_number");
    const batch_number = searchParams.get("batch_number");
    const product_name = searchParams.get("product_name");

    let query = `
      SELECT pu.*, 
             pc.product_name, pc.product_type, pc.sku,
             mo.org_name as manufacturer_name,
             l.location_name as current_location_name
      FROM product_unit pu
      LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
      LEFT JOIN organizations mo ON pu.manufacturer_org_id = mo.org_id
      LEFT JOIN locations l ON pu.current_location_id = l.location_id
      WHERE 1=1
    `;
    const params = [];

    if (catalog_id) {
      query += " AND pu.catalog_id = ?";
      params.push(catalog_id);
    }

    if (manufacturer_org_id) {
      query += " AND pu.manufacturer_org_id = ?";
      params.push(manufacturer_org_id);
    }

    if (status) {
      query += " AND pu.status = ?";
      params.push(status);
    }

    if (serial_number) {
      query += " AND pu.serial_number LIKE ?";
      params.push(`%${serial_number}%`);
    }

    if (batch_number) {
      query += " AND pu.batch_number LIKE ?";
      params.push(`%${batch_number}%`);
    }

    if (product_name) {
      query += " AND pc.product_name LIKE ?";
      params.push(`%${product_name}%`);
    }

    query += " ORDER BY pu.created_at DESC";

    const [rows] = await pool.execute(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Products units API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      catalog_id,
      serial_number,
      manufacturer_org_id,
      manufacturing_date,
      batch_number,
      expiry_date,
      current_location_id,
    } = body;

    // Validation checks
    if (!catalog_id || !serial_number) {
      return NextResponse.json(
        { error: "Missing required fields: catalog_id, serial_number" },
        { status: 400 },
      );
    }

    if (serial_number.length > 255) {
      return NextResponse.json(
        { error: "Serial number must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (batch_number && batch_number.length > 100) {
      return NextResponse.json(
        { error: "Batch number must be less than 100 characters" },
        { status: 400 },
      );
    }

    // Check if product catalog exists
    const [catalogCheck] = await pool.execute(
      "SELECT catalog_id FROM product_catalog WHERE catalog_id = ?",
      [catalog_id],
    );

    if (catalogCheck.length === 0) {
      return NextResponse.json(
        { error: "Product catalog not found" },
        { status: 404 },
      );
    }

    // Check if manufacturer exists (if provided)
    if (manufacturer_org_id) {
      const [orgCheck] = await pool.execute(
        "SELECT org_id FROM organizations WHERE org_id = ?",
        [manufacturer_org_id],
      );
      if (orgCheck.length === 0) {
        return NextResponse.json(
          { error: "Manufacturer organization not found" },
          { status: 404 },
        );
      }
    }

    // Check if location exists (if provided)
    if (current_location_id) {
      const [locationCheck] = await pool.execute(
        "SELECT location_id FROM locations WHERE location_id = ?",
        [current_location_id],
      );
      if (locationCheck.length === 0) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 },
        );
      }
    }

    // Check if serial number already exists
    const [serialCheck] = await pool.execute(
      "SELECT unit_id FROM product_unit WHERE serial_number = ?",
      [serial_number],
    );

    if (serialCheck.length > 0) {
      return NextResponse.json(
        { error: "Serial number already exists" },
        { status: 409 },
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO product_unit 
       (catalog_id, serial_number, manufacturer_org_id, manufacturing_date, 
        batch_number, expiry_date, current_location_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        catalog_id,
        serial_number,
        manufacturer_org_id || null,
        manufacturing_date || null,
        batch_number || null,
        expiry_date || null,
        current_location_id || null,
      ],
    );

    return NextResponse.json(
      {
        message: "Product unit created successfully",
        unit_id: result.insertId,
        serial_number: serial_number,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
