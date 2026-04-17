import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    console.log(params);
    const { id } = await params;
    //   id = parseInt(id);

    const [rows] = await pool.execute(
      "SELECT * FROM organizations WHERE org_id = ?",
      [id],
    );

    if (rows.length == 0) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { message: "Invalid organization ID" },
        { status: 400 },
      );
    }

    // Check if organization exists
    const [rows] = await pool.execute(
      "SELECT * FROM organizations WHERE org_id = ?",
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    // Start transaction for cascade delete
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get all products for this organization
      const [products] = await connection.execute(
        "SELECT catalog_id FROM product_catalog WHERE org_id = ?",
        [id],
      );

      const productIds = products.map((product) => product.catalog_id);

      // Get all product units for this organization's products
      const [productUnits] = await connection.execute(
        productIds.length > 0
          ? `SELECT unit_id FROM product_unit WHERE catalog_id IN (${productIds.map(() => "?").join(",")})`
          : "SELECT unit_id FROM product_unit WHERE 1=0",
        productIds,
      );

      const unitIds = productUnits.map((unit) => unit.unit_id);

      // Delete transfer logs for all units of this organization's products
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

        // Delete product units
        await connection.execute(
          `DELETE FROM product_unit WHERE unit_id IN (${placeholders})`,
          unitIds,
        );
      }

      // Delete all product catalog entries for this organization
      if (productIds.length > 0) {
        const productPlaceholders = productIds.map(() => "?").join(",");
        await connection.execute(
          `DELETE FROM product_catalog WHERE catalog_id IN (${productPlaceholders})`,
          productIds,
        );
      }

      // Delete all transfer logs where this organization is from_org or to_org
      await connection.execute(
        "DELETE FROM transfer_log WHERE from_org_id = ? OR to_org_id = ?",
        [id, id],
      );

      // Finally delete the organization
      await connection.execute("DELETE FROM organizations WHERE org_id = ?", [
        id,
      ]);

      await connection.commit();

      return NextResponse.json({
        message: "Organization and all related data deleted successfully",
        deleted_products_count: productIds.length,
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
