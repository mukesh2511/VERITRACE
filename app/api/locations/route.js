import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const search = searchParams.get("search");

    let query = `
      SELECT l.*,
             COUNT(DISTINCT tl.transfer_id) as transfer_count,
             COUNT(DISTINCT pu.unit_id) as current_units_count
      FROM locations l
      LEFT JOIN transfer_log tl ON l.location_id = tl.location_id
      LEFT JOIN product_unit pu ON l.location_id = pu.current_location_id
      WHERE 1=1
    `;
    const params = [];

    if (country) {
      query += " AND l.country = ?";
      params.push(country);
    }

    if (search) {
      query += " AND (l.location_name LIKE ? OR l.country LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += " GROUP BY l.location_id ORDER BY l.location_name";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No locations found" },
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
    const { location_name, country, latitude, longitude } = body;

    // Validation checks
    if (!location_name || !country) {
      return NextResponse.json(
        { error: "Missing required fields: location_name, country" },
        { status: 400 },
      );
    }

    if (location_name.length > 255) {
      return NextResponse.json(
        { error: "Location name must be less than 255 characters" },
        { status: 400 },
      );
    }

    if (country.length > 100) {
      return NextResponse.json(
        { error: "Country name must be less than 100 characters" },
        { status: 400 },
      );
    }

    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { error: "Latitude must be between -90 and 90" },
          { status: 400 },
        );
      }
    }

    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: "Longitude must be between -180 and 180" },
          { status: 400 },
        );
      }
    }

    // Check if location name already exists in the same country
    const [existingCheck] = await pool.execute(
      "SELECT location_id FROM locations WHERE location_name = ? AND country = ?",
      [location_name, country],
    );

    if (existingCheck.length > 0) {
      return NextResponse.json(
        {
          error:
            "Location with this name already exists in the specified country",
        },
        { status: 409 },
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO locations (location_name, country, latitude, longitude) 
       VALUES (?, ?, ?, ?)`,
      [location_name, country, latitude || null, longitude || null],
    );

    return NextResponse.json(
      {
        message: "Location created successfully",
        location_id: result.insertId,
        location_name: location_name,
        country: country,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
