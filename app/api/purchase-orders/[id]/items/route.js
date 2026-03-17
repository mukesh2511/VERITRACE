import pool from "../../../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    // Check if purchase order exists
    const [orderCheck] = await pool.execute(
      "SELECT order_id FROM purchase_orders WHERE order_id = ?",
      [id]
    );

    if (orderCheck.length === 0) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    // Get purchase order items
    const [rows] = await pool.execute(
      `SELECT poi.*,
              pc.product_name, pc.product_type, pc.sku,
              pc.weight, pc.dimensions, pc.description
       FROM purchase_order_items poi
       LEFT JOIN product_catalog pc ON poi.catalog_id = pc.catalog_id
       WHERE poi.order_id = ?
       ORDER BY poi.item_id`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No items found for this purchase order" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { catalog_id, quantity } = body;

    // Validation checks
    if (!catalog_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Missing required fields: catalog_id, quantity (>= 1)" },
        { status: 400 }
      );
    }

    // Check if purchase order exists and is in a state that allows adding items
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
    if (!['pending', 'accepted'].includes(orderStatus)) {
      return NextResponse.json(
        { error: "Cannot add items to purchase order with status: " + orderStatus },
        { status: 400 }
      );
    }

    // Check if product catalog exists
    const [catalogCheck] = await pool.execute(
      "SELECT catalog_id, product_name FROM product_catalog WHERE catalog_id = ?",
      [catalog_id]
    );

    if (catalogCheck.length === 0) {
      return NextResponse.json(
        { error: "Product catalog not found" },
        { status: 404 }
      );
    }

    // Check if item already exists in this order
    const [existingCheck] = await pool.execute(
      "SELECT item_id FROM purchase_order_items WHERE order_id = ? AND catalog_id = ?",
      [id, catalog_id]
    );

    if (existingCheck.length > 0) {
      return NextResponse.json(
        { error: "Item already exists in this purchase order" },
        { status: 409 }
      );
    }

    // Add new item
    const [result] = await pool.execute(
      "INSERT INTO purchase_order_items (order_id, catalog_id, quantity) VALUES (?, ?, ?)",
      [id, catalog_id, quantity]
    );

    return NextResponse.json({
      message: "Item added to purchase order successfully",
      item_id: result.insertId,
      order_id: id,
      catalog_id: catalog_id,
      product_name: catalogCheck[0].product_name,
      quantity: quantity
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
