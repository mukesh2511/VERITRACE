import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await pool.execute(
      `SELECT tl.*,
              pu.serial_number,
              pc.product_name,
              pc.product_type,
              from_org.org_name as from_org_name,
              from_org.org_type as from_org_type,
              to_org.org_name as to_org_name,
              to_org.org_type as to_org_type,
              l.location_name, l.country as location_country, l.latitude, l.longitude
       FROM transfer_log tl
       LEFT JOIN product_unit pu ON tl.unit_id = pu.unit_id
       LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations from_org ON tl.from_org_id = from_org.org_id
       LEFT JOIN organizations to_org ON tl.to_org_id = to_org.org_id
       LEFT JOIN locations l ON tl.location_id = l.location_id
       WHERE tl.transfer_id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Transfer log not found" },
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
      from_org_id,
      to_org_id,
      location_id,
      status,
      tracking_number,
      estimated_arrival,
      actual_arrival,
      notes,
    } = body;

    // Check if transfer log exists and get current status
    const [transferCheck] = await pool.execute(
      "SELECT transfer_id, unit_id, status FROM transfer_log WHERE transfer_id = ?",
      [id],
    );

    if (transferCheck.length === 0) {
      return NextResponse.json(
        { error: "Transfer log not found" },
        { status: 404 },
      );
    }

    const currentStatus = transferCheck[0].status;
    const unit_id = transferCheck[0].unit_id;

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (from_org_id !== undefined) {
      if (from_org_id) {
        const [orgCheck] = await pool.execute(
          "SELECT org_id FROM organizations WHERE org_id = ?",
          [from_org_id],
        );
        if (orgCheck.length === 0) {
          return NextResponse.json(
            { error: "Source organization not found" },
            { status: 404 },
          );
        }
      }
      updateFields.push("from_org_id = ?");
      params.push(from_org_id);
    }

    if (to_org_id !== undefined) {
      if (to_org_id) {
        const [orgCheck] = await pool.execute(
          "SELECT org_id FROM organizations WHERE org_id = ?",
          [to_org_id],
        );
        if (orgCheck.length === 0) {
          return NextResponse.json(
            { error: "Destination organization not found" },
            { status: 404 },
          );
        }
      }
      updateFields.push("to_org_id = ?");
      params.push(to_org_id);
    }

    if (location_id !== undefined) {
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
      updateFields.push("location_id = ?");
      params.push(location_id);
    }

    if (status !== undefined) {
      if (!["shipped", "in_transit", "received"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be shipped, in_transit, or received" },
          { status: 400 },
        );
      }
      updateFields.push("status = ?");
      params.push(status);
    }

    if (tracking_number !== undefined) {
      if (tracking_number && tracking_number.length > 255) {
        return NextResponse.json(
          { error: "Tracking number must be less than 255 characters" },
          { status: 400 },
        );
      }
      // Check if tracking number already exists for another transfer
      if (tracking_number) {
        const [trackingCheck] = await pool.execute(
          "SELECT transfer_id FROM transfer_log WHERE tracking_number = ? AND transfer_id != ?",
          [tracking_number, id],
        );
        if (trackingCheck.length > 0) {
          return NextResponse.json(
            { error: "Tracking number already exists" },
            { status: 409 },
          );
        }
      }
      updateFields.push("tracking_number = ?");
      params.push(tracking_number);
    }

    if (estimated_arrival !== undefined) {
      updateFields.push("estimated_arrival = ?");
      params.push(estimated_arrival);
    }

    if (actual_arrival !== undefined) {
      updateFields.push("actual_arrival = ?");
      params.push(actual_arrival);
    }

    if (notes !== undefined) {
      updateFields.push("notes = ?");
      params.push(notes);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE transfer_log SET ${updateFields.join(", ")} WHERE transfer_id = ?`;
    await pool.execute(query, params);

    // Update product unit status if transfer status changed
    if (status !== undefined && status !== currentStatus) {
      const newStatus = status === "received" ? "delivered" : "in_transit";

      // Get current product unit status
      const [unitStatusCheck] = await pool.execute(
        "SELECT status FROM product_unit WHERE unit_id = ?",
        [unit_id],
      );

      if (unitStatusCheck.length > 0) {
        const oldUnitStatus = unitStatusCheck[0].status;

        await pool.execute(
          "UPDATE product_unit SET status = ? WHERE unit_id = ?",
          [newStatus, unit_id],
        );

        // Log status change
        await pool.execute(
          `INSERT INTO product_status_history (unit_id, old_status, new_status, changed_by) 
           VALUES (?, ?, ?, ?)`,
          [unit_id, oldUnitStatus, newStatus, null], // TODO: Add user_id from auth token
        );
      }
    }

    return NextResponse.json({
      message: "Transfer log updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if transfer log exists
    const [transferCheck] = await pool.execute(
      "SELECT transfer_id, unit_id FROM transfer_log WHERE transfer_id = ?",
      [id],
    );

    if (transferCheck.length === 0) {
      return NextResponse.json(
        { error: "Transfer log not found" },
        { status: 404 },
      );
    }

    const unit_id = transferCheck[0].unit_id;

    await pool.execute("DELETE FROM transfer_log WHERE transfer_id = ?", [id]);

    // Check if there are other transfers for this unit
    const [otherTransfers] = await pool.execute(
      "SELECT COUNT(*) as count FROM transfer_log WHERE unit_id = ?",
      [unit_id],
    );

    // If no more transfers, update product unit status back to 'created' or 'assembled'
    if (otherTransfers[0].count === 0) {
      // Check if unit has assembly relationships
      const [assemblyCheck] = await pool.execute(
        "SELECT COUNT(*) as count FROM assembly_relationship WHERE parent_unit_id = ?",
        [unit_id],
      );

      const newStatus = assemblyCheck[0].count > 0 ? "assembled" : "created";

      await pool.execute(
        "UPDATE product_unit SET status = ? WHERE unit_id = ?",
        [newStatus, unit_id],
      );
    }

    return NextResponse.json({
      message: "Transfer log deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
