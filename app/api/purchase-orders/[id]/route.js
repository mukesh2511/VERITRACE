import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Get purchase order details
    const [orderRows] = await pool.execute(
      `SELECT po.*,
              buyer.org_name as buyer_org_name,
              buyer.org_type as buyer_org_type,
              buyer.country as buyer_country,
              supplier.org_name as supplier_org_name,
              supplier.org_type as supplier_org_type,
              supplier.country as supplier_country
       FROM purchase_orders po
       LEFT JOIN organizations buyer ON po.buyer_org_id = buyer.org_id
       LEFT JOIN organizations supplier ON po.supplier_org_id = supplier.org_id
       WHERE po.order_id = ?`,
      [id]
    );

    if (orderRows.length === 0) {
      return NextResponse.json(
        { message: "Purchase order not found" },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Get purchase order items
    const [itemRows] = await pool.execute(
      `SELECT poi.*,
              pc.product_name, pc.product_type, pc.sku,
              pc.weight, pc.dimensions
       FROM purchase_order_items poi
       LEFT JOIN product_catalog pc ON poi.catalog_id = pc.catalog_id
       WHERE poi.order_id = ?
       ORDER BY poi.item_id`,
      [id]
    );

    // Get related shipments
    const [shipmentRows] = await pool.execute(
      `SELECT s.*,
              from_org.org_name as from_org_name,
              to_org.org_name as to_org_name
       FROM shipments s
       LEFT JOIN organizations from_org ON s.shipped_from = from_org.org_id
       LEFT JOIN organizations to_org ON s.shipped_to = to_org.org_id
       WHERE s.order_id = ?
       ORDER BY s.shipment_date DESC`,
      [id]
    );

    order.items = itemRows;
    order.shipments = shipmentRows;

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { order_status } = body;

    // Check if purchase order exists
    const [orderCheck] = await pool.execute(
      "SELECT order_id, order_status FROM purchase_orders WHERE order_id = ?",
      [id]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const currentStatus = orderCheck[0].order_status;

    // Validate status transition
    if (order_status !== undefined) {
      if (!['pending', 'accepted', 'completed', 'cancelled'].includes(order_status)) {
        return NextResponse.json(
          { error: "Invalid order_status. Must be pending, accepted, completed, or cancelled" },
          { status: 400 }
        );
      }

      // Define allowed status transitions
      const allowedTransitions = {
        'pending': ['accepted', 'cancelled'],
        'accepted': ['completed', 'cancelled'],
        'completed': [], // Terminal state
        'cancelled': []  // Terminal state
      };

      if (!allowedTransitions[currentStatus].includes(order_status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentStatus} to ${order_status}` },
          { status: 400 }
        );
      }
    }

    // Build dynamic update query
    let updateFields = [];
    let params = [];

    if (order_status !== undefined) {
      updateFields.push("order_status = ?");
      params.push(order_status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    params.push(id);

    const query = `UPDATE purchase_orders SET ${updateFields.join(', ')} WHERE order_id = ?`;
    await pool.execute(query, params);

    return NextResponse.json({
      message: "Purchase order updated successfully",
      order_id: id,
      old_status: currentStatus,
      new_status: order_status
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if purchase order exists
    const [orderCheck] = await pool.execute(
      "SELECT order_id, order_status FROM purchase_orders WHERE order_id = ?",
      [id]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    const orderStatus = orderCheck[0].order_status;

    // Check if order can be deleted (only pending or cancelled orders)
    if (!['pending', 'cancelled'].includes(orderStatus)) {
      return NextResponse.json(
        { error: "Cannot delete purchase order with status: " + orderStatus },
        { status: 400 }
      );
    }

    // Check if order has related shipments
    const [shipmentCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM shipments WHERE order_id = ?",
      [id]
    );

    if (shipmentCheck[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete purchase order with existing shipments" },
        { status: 400 }
      );
    }

    // Delete purchase order items first (foreign key constraint)
    await pool.execute("DELETE FROM purchase_order_items WHERE order_id = ?", [id]);

    // Delete purchase order
    await pool.execute("DELETE FROM purchase_orders WHERE order_id = ?", [id]);

    return NextResponse.json({
      message: "Purchase order deleted successfully"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
