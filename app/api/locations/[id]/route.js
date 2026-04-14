import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await pool.execute(
      `SELECT l.*,
              COUNT(DISTINCT tl.transfer_id) as transfer_count,
              COUNT(DISTINCT pu.unit_id) as current_units_count,
              GROUP_CONCAT(DISTINCT pu.serial_number) as current_units
       FROM locations l
       LEFT JOIN transfer_log tl ON l.location_id = tl.location_id
       LEFT JOIN product_unit pu ON l.location_id = pu.current_location_id
       WHERE l.location_id = ?
       GROUP BY l.location_id`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Location not found" },
        { status: 404 },
      );
    }

    const location = rows[0];

    // Get recent transfers through this location
    const [recentTransfers] = await pool.execute(
      `SELECT tl.transfer_time, tl.status, tl.tracking_number,
              pu.serial_number,
              pc.product_name,
              from_org.org_name as from_org_name,
              to_org.org_name as to_org_name
       FROM transfer_log tl
       JOIN product_unit pu ON tl.unit_id = pu.unit_id
       JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations from_org ON tl.from_org_id = from_org.org_id
       LEFT JOIN organizations to_org ON tl.to_org_id = to_org.org_id
       WHERE tl.location_id = ?
       ORDER BY tl.transfer_time DESC
       LIMIT 10`,
      [id],
    );

    // Get current units at this location
    const [currentUnits] = await pool.execute(
      `SELECT pu.unit_id, pu.serial_number, pu.status, pu.manufacturing_date,
              pc.product_name, pc.product_type,
              org.org_name as manufacturer_name
       FROM product_unit pu
       JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
       WHERE pu.current_location_id = ?
       ORDER BY pu.created_at DESC`,
      [id],
    );

    location.recent_transfers = recentTransfers;
    location.current_units = currentUnits;

    return NextResponse.json(location);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { location_name, country, latitude, longitude } = body;

    // Check if location exists
    const [locationCheck] = await pool.execute(
      "SELECT location_id FROM locations WHERE location_id = ?",
      [id],
    );

    if (locationCheck.length === 0) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (location_name !== undefined) {
      if (location_name.length > 255) {
        return NextResponse.json(
          { error: "Location name must be less than 255 characters" },
          { status: 400 },
        );
      }
      // Check if location name already exists for another location in the same country
      const [nameCheck] = await pool.execute(
        "SELECT location_id FROM locations WHERE location_name = ? AND location_id != ?",
        [location_name, id],
      );
      if (nameCheck.length > 0) {
        return NextResponse.json(
          { error: "Location name already exists" },
          { status: 409 },
        );
      }
      updateFields.push("location_name = ?");
      params.push(location_name);
    }

    if (country !== undefined) {
      if (country.length > 100) {
        return NextResponse.json(
          { error: "Country name must be less than 100 characters" },
          { status: 400 },
        );
      }
      updateFields.push("country = ?");
      params.push(country);
    }

    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { error: "Latitude must be between -90 and 90" },
          { status: 400 },
        );
      }
      updateFields.push("latitude = ?");
      params.push(latitude);
    }

    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Longitude must be between -180 and 180" },
          { status: 400 },
        );
      }
      updateFields.push("longitude = ?");
      params.push(longitude);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE locations SET ${updateFields.join(", ")} WHERE location_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "Location updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if location exists
    const [locationCheck] = await pool.execute(
      "SELECT location_id FROM locations WHERE location_id = ?",
      [id],
    );

    if (locationCheck.length === 0) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Check if location has associated transfers
    const [transferCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM transfer_log WHERE location_id = ?",
      [id],
    );

    if (transferCheck[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete location with existing transfer logs" },
        { status: 400 },
      );
    }

    // Check if location has current product units
    const [unitsCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM product_unit WHERE current_location_id = ?",
      [id],
    );

    if (unitsCheck[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete location with current product units" },
        { status: 400 },
      );
    }

    await pool.execute("DELETE FROM locations WHERE location_id = ?", [id]);

    return NextResponse.json({
      message: "Location deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
