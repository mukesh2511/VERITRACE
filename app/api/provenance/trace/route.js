import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      component_serial_number,
      include_assemblies = true,
      max_depth = 10,
      include_transfers = true,
      include_status_history = true,
    } = body;

    if (!component_serial_number) {
      return NextResponse.json(
        { error: "Component serial number is required" },
        { status: 400 },
      );
    }

    // Find the component unit
    const [componentCheck] = await pool.execute(
      `SELECT pu.unit_id, pu.serial_number, pu.status, pu.manufacturing_date,
              pc.product_name, pc.product_type,
              org.org_name as manufacturer_name, org.country as manufacturer_country
       FROM product_unit pu
       LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
       WHERE pu.serial_number = ?`,
      [component_serial_number],
    );

    if (componentCheck.length === 0) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 },
      );
    }

    const component = componentCheck[0];
    const component_unit_id = component.unit_id;

    // Trace all assemblies that contain this component (reverse trace)
    const [assemblyTrace] = await pool.execute(
      `
      WITH RECURSIVE parent_tree AS (
        -- Base case: direct parents of this component
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          ar.quantity,
          1 as level,
          pu.serial_number as parent_serial_number,
          pc.product_name as parent_product_name,
          pc.product_type as parent_product_type,
          org.org_name as parent_manufacturer_name,
          org.country as parent_manufacturer_country,
          pu.manufacturing_date as parent_manufacturing_date,
          CAST(ar.parent_unit_id AS CHAR(1000)) as path
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.parent_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        WHERE ar.child_unit_id = ?
        
        UNION ALL
        
        -- Recursive case: parents of parents
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          ar.quantity,
          pt.level + 1,
          pu.serial_number as parent_serial_number,
          pc.product_name as parent_product_name,
          pc.product_type as parent_product_type,
          org.org_name as parent_manufacturer_name,
          org.country as parent_manufacturer_country,
          pu.manufacturing_date as parent_manufacturing_date,
          CONCAT(pt.path, '->', ar.parent_unit_id)
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.parent_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        JOIN parent_tree pt ON ar.child_unit_id = pt.parent_unit_id
        WHERE pt.level < ? AND FIND_IN_SET(CAST(ar.parent_unit_id AS CHAR), pt.path) = 0
      )
      SELECT * FROM parent_tree 
      ORDER BY level DESC, parent_unit_id
      `,
      [component_unit_id, max_depth],
    );

    // Get transfer history for this component
    let transferHistory = [];
    if (include_transfers) {
      const [transfers] = await pool.execute(
        `
        SELECT tl.transfer_time, tl.status, tl.tracking_number, tl.notes,
               from_org.org_name as from_org_name, from_org.country as from_country,
               to_org.org_name as to_org_name, to_org.country as to_country,
               l.location_name, l.country as location_country
        FROM transfer_log tl
        LEFT JOIN organizations from_org ON tl.from_org_id = from_org.org_id
        LEFT JOIN organizations to_org ON tl.to_org_id = to_org.org_id
        LEFT JOIN locations l ON tl.location_id = l.location_id
        WHERE tl.unit_id = ?
        ORDER BY tl.transfer_time ASC
        `,
        [component_unit_id],
      );
      transferHistory = transfers;
    }

    // Get status history for this component
    let statusHistory = [];
    if (include_status_history) {
      const [statusChanges] = await pool.execute(
        `
        SELECT psh.old_status, psh.new_status, psh.timestamp,
               u.name as changed_by_name
        FROM product_status_history psh
        LEFT JOIN users u ON psh.changed_by = u.user_id
        WHERE psh.unit_id = ?
        ORDER BY psh.timestamp ASC
        `,
        [component_unit_id],
      );
      statusHistory = statusChanges;
    }

    // Build the assembly tree structure
    const buildAssemblyTree = (assemblies, childId = null, startLevel = 1) => {
      const uniqueAssemblies = {};

      assemblies.forEach((assembly) => {
        if (!uniqueAssemblies[assembly.parent_unit_id]) {
          uniqueAssemblies[assembly.parent_unit_id] = assembly;
        }
      });

      const levelAssemblies = Object.values(uniqueAssemblies).filter(
        (a) => a.level === startLevel,
      );

      return levelAssemblies.map((assembly) => ({
        unit_id: assembly.parent_unit_id,
        serial_number: assembly.parent_serial_number,
        product_name: assembly.parent_product_name,
        product_type: assembly.parent_product_type,
        manufacturer: {
          name: assembly.parent_manufacturer_name,
          country: assembly.parent_manufacturer_country,
        },
        manufacturing_date: assembly.parent_manufacturing_date,
        quantity_used: assembly.quantity,
        parent_assemblies: buildAssemblyTree(
          assemblies,
          assembly.parent_unit_id,
          startLevel + 1,
        ),
      }));
    };

    const assemblyTree = include_assemblies
      ? buildAssemblyTree(assemblyTrace)
      : [];

    // Build trace response
    const traceData = {
      component: {
        unit_id: component.unit_id,
        serial_number: component.serial_number,
        product_name: component.product_name,
        product_type: component.product_type,
        status: component.status,
        manufacturing_date: component.manufacturing_date,
        manufacturer: {
          name: component.manufacturer_name,
          country: component.manufacturer_country,
        },
      },
      used_in_assemblies: assemblyTree,
      transfer_history: transferHistory.map((transfer) => ({
        timestamp: transfer.transfer_time,
        status: transfer.status,
        tracking_number: transfer.tracking_number,
        notes: transfer.notes,
        from: transfer.from_org_name
          ? {
              organization: transfer.from_org_name,
              country: transfer.from_country,
            }
          : null,
        to: {
          organization: transfer.to_org_name,
          country: transfer.to_country,
        },
        location: transfer.location_name
          ? {
              name: transfer.location_name,
              country: transfer.location_country,
            }
          : null,
      })),
      status_history: statusHistory.map((status) => ({
        timestamp: status.timestamp,
        from: status.old_status,
        to: status.new_status,
        changed_by: status.changed_by_name,
      })),
      summary: {
        total_assemblies: assemblyTrace.length,
        direct_assemblies: assemblyTrace.filter((a) => a.level === 1).length,
        max_assembly_level:
          assemblyTrace.length > 0
            ? Math.max(...assemblyTrace.map((a) => a.level))
            : 0,
        transfer_count: transferHistory.length,
        status_changes: statusHistory.length,
      },
    };

    return NextResponse.json(traceData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
