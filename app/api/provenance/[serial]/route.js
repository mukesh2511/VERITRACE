import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { serial } = params;

    // First, get the basic product unit information
    const [unitCheck] = await pool.execute(
      `SELECT pu.unit_id, pu.serial_number, pu.status, pu.manufacturing_date,
              pc.product_name, pc.product_type, pc.description,
              org.org_name as manufacturer_name, org.country as manufacturer_country
       FROM product_unit pu
       LEFT JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
       LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
       WHERE pu.serial_number = ?`,
      [serial],
    );

    if (unitCheck.length === 0) {
      return NextResponse.json(
        { error: "Product unit not found" },
        { status: 404 },
      );
    }

    const productUnit = unitCheck[0];
    const unit_id = productUnit.unit_id;

    // Get complete component hierarchy using recursive CTE
    const [componentHierarchy] = await pool.execute(
      `
      WITH RECURSIVE component_tree AS (
        -- Base case: direct children of the product
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          ar.quantity,
          1 as level,
          pu.serial_number,
          pc.product_name,
          pc.product_type,
          org.org_name as manufacturer_name,
          org.country as manufacturer_country,
          pu.manufacturing_date,
          CAST(ar.child_unit_id AS CHAR(1000)) as path
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.child_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        WHERE ar.parent_unit_id = ?
        
        UNION ALL
        
        -- Recursive case: children of children
        SELECT 
          ar.parent_unit_id,
          ar.child_unit_id,
          ar.quantity,
          ct.level + 1,
          pu.serial_number,
          pc.product_name,
          pc.product_type,
          org.org_name as manufacturer_name,
          org.country as manufacturer_country,
          pu.manufacturing_date,
          CONCAT(ct.path, '->', ar.child_unit_id)
        FROM assembly_relationship ar
        JOIN product_unit pu ON ar.child_unit_id = pu.unit_id
        JOIN product_catalog pc ON pu.catalog_id = pc.catalog_id
        LEFT JOIN organizations org ON pu.manufacturer_org_id = org.org_id
        JOIN component_tree ct ON ar.parent_unit_id = ct.child_unit_id
        WHERE FIND_IN_SET(CAST(ar.parent_unit_id AS CHAR), ct.path) = 0
      )
      SELECT * FROM component_tree 
      ORDER BY level, child_unit_id
      `,
      [unit_id],
    );

    // Get transfer history
    const [transferHistory] = await pool.execute(
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
      [unit_id],
    );

    // Get status change history
    const [statusHistory] = await pool.execute(
      `
      SELECT psh.old_status, psh.new_status, psh.timestamp,
             u.name as changed_by_name
      FROM product_status_history psh
      LEFT JOIN users u ON psh.changed_by = u.user_id
      WHERE psh.unit_id = ?
      ORDER BY psh.timestamp ASC
      `,
      [unit_id],
    );

    // Get batch information (if available)
    const [batchInfo] = await pool.execute(
      `
      SELECT batch_number, COUNT(*) as units_in_batch
      FROM product_unit
      WHERE catalog_id = (SELECT catalog_id FROM product_unit WHERE unit_id = ?)
        AND batch_number IS NOT NULL
        AND batch_number = (SELECT batch_number FROM product_unit WHERE unit_id = ?)
      GROUP BY batch_number
      `,
      [unit_id, unit_id],
    );

    // Build the provenance tree structure
    const buildComponentTree = (components, parentId = null, level = 0) => {
      const levelComponents = components.filter((c) => c.level === level + 1);

      return levelComponents.map((component) => ({
        unit_id: component.child_unit_id,
        serial_number: component.serial_number,
        product_name: component.product_name,
        product_type: component.product_type,
        manufacturer: {
          name: component.manufacturer_name,
          country: component.manufacturer_country,
        },
        manufacturing_date: component.manufacturing_date,
        quantity: component.quantity,
        components: buildComponentTree(
          components,
          component.child_unit_id,
          level + 1,
        ),
      }));
    };

    const componentTree = buildComponentTree(componentHierarchy);

    // Build complete provenance response
    const provenanceData = {
      product: {
        unit_id: productUnit.unit_id,
        serial_number: productUnit.serial_number,
        product_name: productUnit.product_name,
        product_type: productUnit.product_type,
        description: productUnit.description,
        status: productUnit.status,
        manufacturing_date: productUnit.manufacturing_date,
        manufacturer: {
          name: productUnit.manufacturer_name,
          country: productUnit.manufacturer_country,
        },
        batch_info:
          batchInfo.length > 0
            ? {
                batch_number: batchInfo[0].batch_number,
                units_in_batch: batchInfo[0].units_in_batch,
              }
            : null,
      },
      components: componentTree,
      supply_chain_journey: transferHistory.map((transfer) => ({
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
        total_components: componentHierarchy.length,
        direct_components: componentHierarchy.filter((c) => c.level === 1)
          .length,
        transfer_count: transferHistory.length,
        status_changes: statusHistory.length,
        deepest_component_level:
          componentHierarchy.length > 0
            ? Math.max(...componentHierarchy.map((c) => c.level))
            : 0,
      },
    };

    return NextResponse.json(provenanceData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
