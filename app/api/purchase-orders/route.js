import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const buyer_org_id = searchParams.get('buyer_org_id');
    const supplier_org_id = searchParams.get('supplier_org_id');
    const order_status = searchParams.get('order_status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = `
      SELECT po.*,
             buyer.org_name as buyer_org_name,
             buyer.org_type as buyer_org_type,
             supplier.org_name as supplier_org_name,
             supplier.org_type as supplier_org_type,
             COUNT(poi.item_id) as item_count,
             SUM(poi.quantity) as total_quantity
      FROM purchase_orders po
      LEFT JOIN organizations buyer ON po.buyer_org_id = buyer.org_id
      LEFT JOIN organizations supplier ON po.supplier_org_id = supplier.org_id
      LEFT JOIN purchase_order_items poi ON po.order_id = poi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (buyer_org_id) {
      query += " AND po.buyer_org_id = ?";
      params.push(buyer_org_id);
    }

    if (supplier_org_id) {
      query += " AND po.supplier_org_id = ?";
      params.push(supplier_org_id);
    }

    if (order_status) {
      query += " AND po.order_status = ?";
      params.push(order_status);
    }

    if (start_date) {
      query += " AND po.created_at >= ?";
      params.push(start_date);
    }

    if (end_date) {
      query += " AND po.created_at <= ?";
      params.push(end_date);
    }

    query += " GROUP BY po.order_id ORDER BY po.created_at DESC";

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No purchase orders found" },
        { status: 404 }
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
    const { 
      buyer_org_id, 
      supplier_org_id, 
      order_status = 'pending',
      items 
    } = body;

    // Validation checks
    if (!buyer_org_id || !supplier_org_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: buyer_org_id, supplier_org_id, items (array)" },
        { status: 400 }
      );
    }

    if (buyer_org_id === supplier_org_id) {
      return NextResponse.json(
        { error: "Buyer and supplier cannot be the same organization" },
        { status: 400 }
      );
    }

    if (!['pending', 'accepted', 'completed', 'cancelled'].includes(order_status)) {
      return NextResponse.json(
        { error: "Invalid order_status. Must be pending, accepted, completed, or cancelled" },
        { status: 400 }
      );
    }

    // Validate items array
    for (const item of items) {
      if (!item.catalog_id || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Each item must have catalog_id and quantity (>= 1)" },
          { status: 400 }
        );
      }
    }

    // Check if buyer organization exists
    const [buyerCheck] = await pool.execute(
      "SELECT org_id FROM organizations WHERE org_id = ?",
      [buyer_org_id]
    );

    if (buyerCheck.length === 0) {
      return NextResponse.json(
        { error: "Buyer organization not found" },
        { status: 404 }
      );
    }

    // Check if supplier organization exists
    const [supplierCheck] = await pool.execute(
      "SELECT org_id FROM organizations WHERE org_id = ?",
      [supplier_org_id]
    );

    if (supplierCheck.length === 0) {
      return NextResponse.json(
        { error: "Supplier organization not found" },
        { status: 404 }
      );
    }

    // Validate all catalog IDs
    const catalogIds = items.map(item => item.catalog_id);
    const [catalogCheck] = await pool.execute(
      `SELECT catalog_id, product_name FROM product_catalog 
       WHERE catalog_id IN (${catalogIds.map(() => '?').join(',')})`,
      catalogIds
    );

    if (catalogCheck.length !== catalogIds.length) {
      return NextResponse.json(
        { error: "One or more product catalogs not found" },
        { status: 404 }
      );
    }

    // Create purchase order
    const [orderResult] = await pool.execute(
      `INSERT INTO purchase_orders (buyer_org_id, supplier_org_id, order_status) 
       VALUES (?, ?, ?)`,
      [buyer_org_id, supplier_org_id, order_status]
    );

    const order_id = orderResult.insertId;

    // Create purchase order items
    const itemValues = items.map(item => [order_id, item.catalog_id, item.quantity]);
    
    for (const [order_id, catalog_id, quantity] of itemValues) {
      await pool.execute(
        "INSERT INTO purchase_order_items (order_id, catalog_id, quantity) VALUES (?, ?, ?)",
        [order_id, catalog_id, quantity]
      );
    }

    return NextResponse.json({
      message: "Purchase order created successfully",
      order_id: order_id,
      buyer_org_id: buyer_org_id,
      supplier_org_id: supplier_org_id,
      order_status: order_status,
      items_count: items.length
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
