import pool from "../../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const [rows] = await pool.execute(
      `SELECT pc.*, o.org_name, o.org_type
       FROM product_catalog pc
       LEFT JOIN organizations o ON pc.org_id = o.org_id
       WHERE pc.catalog_id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Product not found" },
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
      product_name,
      product_type,
      description,
      sku,
      weight,
      dimensions,
      org_id,
    } = body;

    // Check if product exists
    const [productCheck] = await pool.execute(
      "SELECT catalog_id FROM product_catalog WHERE catalog_id = ?",
      [id],
    );

    if (productCheck.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (product_name !== undefined) {
      if (product_name.length > 255) {
        return NextResponse.json(
          { error: "Product name must be less than 255 characters" },
          { status: 400 },
        );
      }
      updateFields.push("product_name = ?");
      params.push(product_name);
    }

    if (product_type !== undefined) {
      if (
        !["raw_material", "component", "finished_product"].includes(
          product_type,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid product_type. Must be raw_material, component, or finished_product",
          },
          { status: 400 },
        );
      }
      updateFields.push("product_type = ?");
      params.push(product_type);
    }

    if (description !== undefined) {
      updateFields.push("description = ?");
      params.push(description);
    }

    if (sku !== undefined) {
      if (sku && sku.length > 100) {
        return NextResponse.json(
          { error: "SKU must be less than 100 characters" },
          { status: 400 },
        );
      }
      // Check if SKU already exists for another product
      if (sku) {
        const [skuCheck] = await pool.execute(
          "SELECT catalog_id FROM product_catalog WHERE sku = ? AND catalog_id != ?",
          [sku, id],
        );
        if (skuCheck.length > 0) {
          return NextResponse.json(
            { error: "SKU already exists" },
            { status: 409 },
          );
        }
      }
      updateFields.push("sku = ?");
      params.push(sku);
    }

    if (weight !== undefined) {
      if (weight < 0 || weight > 999999.999) {
        return NextResponse.json(
          { error: "Weight must be between 0 and 999999.999" },
          { status: 400 },
        );
      }
      updateFields.push("weight = ?");
      params.push(weight);
    }

    if (dimensions !== undefined) {
      updateFields.push("dimensions = ?");
      params.push(dimensions);
    }

    if (org_id !== undefined) {
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
      updateFields.push("org_id = ?");
      params.push(org_id);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    params.push(id);

    const query = `UPDATE product_catalog SET ${updateFields.join(", ")} WHERE catalog_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "Product updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Check if product exists
    const [productCheck] = await pool.execute(
      "SELECT catalog_id FROM product_catalog WHERE catalog_id = ?",
      [id],
    );

    if (productCheck.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Start transaction for cascade delete
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get all product units for this product to delete their related data
      const [productUnits] = await connection.execute(
        "SELECT unit_id FROM product_unit WHERE catalog_id = ?",
        [id],
      );

      const unitIds = productUnits.map((unit) => unit.unit_id);

      // Delete transfer logs for all units of this product
      if (unitIds.length > 0) {
        const placeholders = unitIds.map(() => "?").join(",");
        await connection.execute(
          `DELETE FROM transfer_log WHERE unit_id IN (${placeholders})`,
          unitIds,
        );

        // Delete assembly relationships where these units are parents or children
        await connection.execute(
          `DELETE FROM assembly_relationship WHERE parent_unit_id IN (${placeholders}) OR child_unit_id IN (${placeholders})`,
          [...unitIds, ...unitIds],
        );

        // Delete status history for all units
        await connection.execute(
          `DELETE FROM product_status_history WHERE unit_id IN (${placeholders})`,
          unitIds,
        );

        // Delete the product units
        await connection.execute(
          `DELETE FROM product_unit WHERE unit_id IN (${placeholders})`,
          unitIds,
        );
      }

      // Finally delete the product catalog entry
      await connection.execute(
        "DELETE FROM product_catalog WHERE catalog_id = ?",
        [id],
      );

      await connection.commit();

      return NextResponse.json({
        message: "Product and all related data deleted successfully",
        deleted_units_count: unitIds.length,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
