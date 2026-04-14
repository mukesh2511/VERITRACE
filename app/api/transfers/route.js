import pool from "../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const unit_id = searchParams.get("unit_id");
    const from_org_id = searchParams.get("from_org_id");
    const to_org_id = searchParams.get("to_org_id");
    const status = searchParams.get("status");
    const tracking_number = searchParams.get("tracking_number");

    let query = `
      SELECT tl.*,
             pu.serial_number,
             pc.product_name,
             from_org.org_name as from_org_name,
             to_org.org_name as to_org_name,
             l.location_name, l.country as location_country
      FROM transfer_log tl
      LEFT JOIN product_unit pu ON tl.unit_id = pu.unit_id
      LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
      LEFT JOIN organizations from_org ON tl.from_org_id = from_org.org_id
      LEFT JOIN organizations to_org ON tl.to_org_id = to_org.org_id
      LEFT JOIN locations l ON tl.location_id = l.location_id
      WHERE 1=1
    `;
    const params = [];

    if (unit_id) {
      query += " AND tl.unit_id = ?";
      params.push(unit_id);
    }

    if (from_org_id) {
      query += " AND tl.from_org_id = ?";
      params.push(from_org_id);
    }

    if (to_org_id) {
      query += " AND tl.to_org_id = ?";
      params.push(to_org_id);
    }

    if (status) {
      query += " AND tl.status = ?";
      params.push(status);
    }

    if (tracking_number) {
      query += " AND tl.tracking_number LIKE ?";
      params.push(`%${tracking_number}%`);
    }

    query += " ORDER BY tl.transfer_time DESC";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No transfer logs found" },
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
    const {
      unit_id,
      from_org_id,
      to_org_id,
      location_id,
      status,
      tracking_number,
      estimated_arrival,
      notes,
    } = body;

    // Validation checks
    if (!unit_id || !to_org_id) {
      return NextResponse.json(
        { error: "Missing required fields: unit_id, to_org_id" },
        { status: 400 },
      );
    }

    if (status && !["shipped", "in_transit", "received"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be shipped, in_transit, or received" },
        { status: 400 },
      );
    }

    if (tracking_number && tracking_number.length > 255) {
      return NextResponse.json(
        { error: "Tracking number must be less than 255 characters" },
        { status: 400 },
      );
    }

    // Check if product unit exists
    const [unitCheck] = await pool.execute(
      "SELECT unit_id, status FROM product_unit WHERE unit_id = ?",
      [unit_id],
    );

    if (unitCheck.length === 0) {
      return NextResponse.json(
        { error: "Product unit not found" },
        { status: 404 },
      );
    }

    // Check if to organization exists
    const [toOrgCheck] = await pool.execute(
      "SELECT org_id FROM organizations WHERE org_id = ?",
      [to_org_id],
    );

    if (toOrgCheck.length === 0) {
      return NextResponse.json(
        { error: "Destination organization not found" },
        { status: 404 },
      );
    }

    // Check if from organization exists (if provided)
    if (from_org_id) {
      const [fromOrgCheck] = await pool.execute(
        "SELECT org_id FROM organizations WHERE org_id = ?",
        [from_org_id],
      );
      if (fromOrgCheck.length === 0) {
        return NextResponse.json(
          { error: "Source organization not found" },
          { status: 404 },
        );
      }
    }

    // Check if location exists (if provided)
    if (location_id) {
      const [locationCheck] = await pool.execute(
        "SELECT location_id FROM locations WHERE location_id = ?",
        [location_id],
      );
      if (locationCheck.length === 0) {
        return NextResponse.json(
          { error: "Location not found" },
          { status: 404 },
        );
      }
    }

    // Check if tracking number already exists (if provided)
    if (tracking_number) {
      const [trackingCheck] = await pool.execute(
        "SELECT transfer_id FROM transfer_log WHERE tracking_number = ?",
        [tracking_number],
      );
      if (trackingCheck.length > 0) {
        return NextResponse.json(
          { error: "Tracking number already exists" },
          { status: 409 },
        );
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO transfer_log 
       (unit_id, from_org_id, to_org_id, location_id, status, 
        tracking_number, estimated_arrival, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unit_id,
        from_org_id || null,
        to_org_id,
        location_id || null,
        status || "shipped",
        tracking_number || null,
        estimated_arrival || null,
        notes || null,
      ],
    );

    // Update product unit status based on transfer status
    const newStatus = status === "received" ? "delivered" : "in_transit";
    await pool.execute("UPDATE product_unit SET status = ? WHERE unit_id = ?", [
      newStatus,
      unit_id,
    ]);

    // Log status change
    await pool.execute(
      `INSERT INTO product_status_history (unit_id, old_status, new_status, changed_by) 
       VALUES (?, ?, ?, ?)`,
      [unit_id, unitCheck[0].status, newStatus, null], // TODO: Add user_id from auth token
    );

    return NextResponse.json(
      {
        message: "Transfer log created successfully",
        transfer_id: result.insertId,
        unit_id: unit_id,
        tracking_number: tracking_number,
      },
      { status: 201 },
    );
  } catch (error) {
    console.log({ error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
