import pool from "../../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await pool.execute(
      `SELECT pu.*, 
              pc.product_name, pc.product_type, pc.sku, pc.description,
              mo.org_name as manufacturer_name, mo.org_type as manufacturer_type,
              l.location_name as current_location_name, l.country as location_country
       FROM product_unit pu
       LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations mo ON pu.manufacturer_org_id = mo.org_id
       LEFT JOIN locations l ON pu.current_location_id = l.location_id
       WHERE pu.unit_id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Product unit not found" },
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
    const { id } = await params;
    const body = await req.json();
    const {
      catalog_id,
      serial_number,
      manufacturer_org_id,
      manufacturing_date,
      status,
      batch_number,
      expiry_date,
      current_location_id,
    } = body;

    // Check if product unit exists
    const [unitCheck] = await pool.execute(
      "SELECT unit_id, status FROM product_unit WHERE unit_id = ?",
      [id],
    );

    if (unitCheck.length === 0) {
      return NextResponse.json(
        { error: "Product unit not found" },
        { status: 404 },
      );
    }

    const oldStatus = unitCheck[0].status;

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (catalog_id !== undefined) {
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
      updateFields.push("catalog_id = ?");
      params.push(catalog_id);
    }

    if (serial_number !== undefined) {
      if (serial_number.length > 255) {
        return NextResponse.json(
          { error: "Serial number must be less than 255 characters" },
          { status: 400 },
        );
      }
      // Check if serial number already exists for another unit
      const [serialCheck] = await pool.execute(
        "SELECT unit_id FROM product_unit WHERE serial_number = ? AND unit_id != ?",
        [serial_number, id],
      );
      if (serialCheck.length > 0) {
        return NextResponse.json(
          { error: "Serial number already exists" },
          { status: 409 },
        );
      }
      updateFields.push("serial_number = ?");
      params.push(serial_number);
    }

    if (manufacturer_org_id !== undefined) {
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
      updateFields.push("manufacturer_org_id = ?");
      params.push(manufacturer_org_id);
    }

    if (manufacturing_date !== undefined) {
      updateFields.push("manufacturing_date = ?");
      params.push(manufacturing_date);
    }

    if (status !== undefined) {
      if (
        ![
          "created",
          "assembled",
          "in_transit",
          "delivered",
          "retired",
        ].includes(status)
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Must be created, assembled, in_transit, delivered, or retired",
          },
          { status: 400 },
        );
      }
      updateFields.push("status = ?");
      params.push(status);
    }

    if (batch_number !== undefined) {
      if (batch_number && batch_number.length > 100) {
        return NextResponse.json(
          { error: "Batch number must be less than 100 characters" },
          { status: 400 },
        );
      }
      updateFields.push("batch_number = ?");
      params.push(batch_number);
    }

    if (expiry_date !== undefined) {
      updateFields.push("expiry_date = ?");
      params.push(expiry_date);
    }

    if (current_location_id !== undefined) {
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
      updateFields.push("current_location_id = ?");
      params.push(current_location_id);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE product_unit SET ${updateFields.join(", ")} WHERE unit_id = ?`;
    await pool.execute(query, params);

    // Log status change if status was updated
    if (status !== undefined && status !== oldStatus) {
      await pool.execute(
        `INSERT INTO product_status_history (unit_id, old_status, new_status, changed_by) 
         VALUES (?, ?, ?, ?)`,
        [id, oldStatus, status, null], // TODO: Add user_id from auth token
      );
    }

    return NextResponse.json({
      message: "Product unit updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if product unit exists
    const [unitCheck] = await pool.execute(
      "SELECT unit_id FROM product_unit WHERE unit_id = ?",
      [id],
    );

    if (unitCheck.length === 0) {
      return NextResponse.json(
        { error: "Product unit not found" },
        { status: 404 },
      );
    }

    // Check if unit has assembly relationships
    const [assemblyCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM assembly_relationship WHERE parent_unit_id = ? OR child_unit_id = ?",
      [id, id],
    );

    if (assemblyCheck[0].count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete product unit with existing assembly relationships",
        },
        { status: 400 },
      );
    }

    // Check if unit has transfer logs
    const [transferCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM transfer_log WHERE unit_id = ?",
      [id],
    );

    if (transferCheck[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete product unit with existing transfer logs" },
        { status: 400 },
      );
    }

    await pool.execute("DELETE FROM product_unit WHERE unit_id = ?", [id]);

    return NextResponse.json({
      message: "Product unit deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
