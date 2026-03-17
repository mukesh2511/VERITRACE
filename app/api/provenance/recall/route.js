import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      component_serial_number,
      batch_number,
      catalog_id,
      manufacturer_org_id,
      date_range,
    } = body;

    // Build WHERE conditions based on provided criteria
    let whereConditions = [];
    let params = [];

    if (component_serial_number) {
      whereConditions.push("pu.serial_number LIKE ?");
      params.push(`%${component_serial_number}%`);
    }

    if (batch_number) {
      whereConditions.push("pu.batch_number = ?");
      params.push(batch_number);
    }

    if (catalog_id) {
      whereConditions.push("pu.catalog_id = ?");
      params.push(catalog_id);
    }

    if (manufacturer_org_id) {
      whereConditions.push("pu.manufacturer_org_id = ?");
      params.push(manufacturer_org_id);
    }

    if (date_range) {
      if (date_range.start) {
        whereConditions.push("pu.manufacturing_date >= ?");
        params.push(date_range.start);
      }
      if (date_range.end) {
        whereConditions.push("pu.manufacturing_date <= ?");
        params.push(date_range.end);
      }
    }

    if (whereConditions.length === 0) {
      return NextResponse.json(
        { error: "At least one search criteria must be provided" },
        { status: 400 },
      );
    }

    const whereClause = whereConditions.join(" AND ");

    // Find affected product units
    const [affectedUnits] = await pool.execute(
      `
      SELECT pu.unit_id, pu.serial_number, pu.status, pu.manufacturing_date,
             pu.batch_number,
             pc.product_name, pc.product_type,
             org.org_name as manufacturer_name, org.country as manufacturer_country
      FROM product_unit pu
      LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
      LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
      WHERE ${whereClause}
      ORDER BY pu.manufacturing_date DESC
      `,
      params,
    );

    if (affectedUnits.length === 0) {
      return NextResponse.json(
        { message: "No affected products found for the given criteria" },
        { status: 404 },
      );
    }

    // For each affected unit, find all parent assemblies
    const unitIds = affectedUnits.map((u) => u.unit_id);

    const [parentAssemblies] = await pool.execute(
      `
      WITH RECURSIVE affected_assemblies AS (
        -- Base case: direct parents of affected units
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          1 as level,
          pu.serial_number as parent_serial_number,
          pc.product_name as parent_product_name,
          pc.product_type as parent_product_type,
          org.org_name as parent_manufacturer_name,
          org.country as parent_manufacturer_country,
          pu.status as parent_status
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.parent_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        WHERE ar.child_unit_id IN (${unitIds.map(() => "?").join(",")})
        
        UNION ALL
        
        -- Recursive case: parents of parents
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          aa.level + 1,
          pu.serial_number as parent_serial_number,
          pc.product_name as parent_product_name,
          pc.product_type as parent_product_type,
          org.org_name as parent_manufacturer_name,
          org.country as parent_manufacturer_country,
          pu.status as parent_status
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.parent_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        JOIN affected_assemblies aa ON ar.child_unit_id = aa.parent_unit_id
        WHERE aa.level < 10
      )
      SELECT DISTINCT parent_unit_id, parent_serial_number, parent_product_name, 
             parent_product_type, parent_manufacturer_name, parent_manufacturer_country,
             parent_status, MIN(level) as min_level
      FROM affected_assemblies
      GROUP BY parent_unit_id, parent_serial_number, parent_product_name, 
               parent_product_type, parent_manufacturer_name, parent_manufacturer_country,
               parent_status
      ORDER BY min_level, parent_serial_number
      `,
      [...unitIds],
    );

    // Get current locations of affected units
    const [currentLocations] = await pool.execute(
      `
      SELECT pu.unit_id, pu.serial_number,
             org.org_name as current_org_name, org.country as current_org_country,
             l.location_name, l.country as location_country
      FROM product_unit pu
      LEFT JOIN organizations org ON pu.current_location_id = org.org_id
      LEFT JOIN locations l ON pu.current_location_id = l.location_id
      WHERE pu.unit_id IN (${unitIds.map(() => "?").join(",")})
      `,
      unitIds,
    );

    // Get recent transfer activity
    const [recentTransfers] = await pool.execute(
      `
      SELECT pu.unit_id, pu.serial_number,
             tl.transfer_time, tl.status as transfer_status,
             from_org.org_name as from_org_name,
             to_org.org_name as to_org_name,
             tl.tracking_number
      FROM transfer_log tl
      JOIN product_unit pu ON tl.unit_id = pu.unit_id
      LEFT JOIN organizations from_org ON tl.from_org_id = from_org.org_id
      LEFT JOIN organizations to_org ON tl.to_org_id = to_org.org_id
      WHERE tl.unit_id IN (${unitIds.map(() => "?").join(",")})
        AND tl.transfer_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY tl.transfer_time DESC
      `,
      unitIds,
    );

    // Build recall report
    const unitMap = new Map(affectedUnits.map((u) => [u.unit_id, u]));
    const locationMap = new Map(currentLocations.map((l) => [l.unit_id, l]));

    const affectedUnitsWithLocations = affectedUnits.map((unit) => ({
      ...unit,
      current_location: locationMap.get(unit.unit_id) || null,
      recent_transfers: recentTransfers.filter(
        (t) => t.unit_id === unit.unit_id,
      ),
    }));

    // Group by manufacturer for reporting
    const affectedByManufacturer = {};
    affectedUnits.forEach((unit) => {
      const key = `${unit.manufacturer_name || "Unknown"} (${unit.manufacturer_country || "Unknown"})`;
      if (!affectedByManufacturer[key]) {
        affectedByManufacturer[key] = [];
      }
      affectedByManufacturer[key].push(unit);
    });

    // Group by product type
    const affectedByProductType = {};
    affectedUnits.forEach((unit) => {
      if (!affectedByProductType[unit.product_type]) {
        affectedByProductType[unit.product_type] = [];
      }
      affectedByProductType[unit.product_type].push(unit);
    });

    const recallReport = {
      search_criteria: {
        component_serial_number,
        batch_number,
        catalog_id,
        manufacturer_org_id,
        date_range,
      },
      summary: {
        total_affected_units: affectedUnits.length,
        total_affected_assemblies: parentAssemblies.length,
        affected_manufacturers: Object.keys(affectedByManufacturer).length,
        affected_product_types: Object.keys(affectedByProductType).length,
        units_in_transit: affectedUnits.filter((u) => u.status === "in_transit")
          .length,
        units_delivered: affectedUnits.filter((u) => u.status === "delivered")
          .length,
      },
      affected_units: affectedUnitsWithLocations,
      affected_assemblies: parentAssemblies.map((assembly) => ({
        unit_id: assembly.parent_unit_id,
        serial_number: assembly.parent_serial_number,
        product_name: assembly.parent_product_name,
        product_type: assembly.parent_product_type,
        manufacturer: {
          name: assembly.parent_manufacturer_name,
          country: assembly.parent_manufacturer_country,
        },
        current_status: assembly.parent_status,
        assembly_level: assembly.min_level,
      })),
      breakdown: {
        by_manufacturer: Object.entries(affectedByManufacturer).map(
          ([manufacturer, units]) => ({
            manufacturer,
            count: units.length,
            units: units.map((u) => ({
              unit_id: u.unit_id,
              serial_number: u.serial_number,
              product_name: u.product_name,
              status: u.status,
            })),
          }),
        ),
        by_product_type: Object.entries(affectedByProductType).map(
          ([productType, units]) => ({
            product_type: productType,
            count: units.length,
            units: units.map((u) => ({
              unit_id: u.unit_id,
              serial_number: u.serial_number,
              manufacturer: u.manufacturer_name,
              status: u.status,
            })),
          }),
        ),
      },
      recommendations: {
        immediate_actions: [
          "Quarantine all affected units in current inventory",
          "Notify all downstream recipients of affected assemblies",
          "Issue public recall notice if products have reached consumers",
          "Document all recall activities for regulatory compliance",
        ],
        investigation_steps: [
          "Review manufacturing records for root cause analysis",
          "Check quality control logs for the affected batch/period",
          "Identify other potentially affected batches",
          "Assess impact on supply chain operations",
        ],
      },
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(recallReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
