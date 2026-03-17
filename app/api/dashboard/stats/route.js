import pool from "../../../../config/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get total organizations
    const [orgCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM organizations",
    );

    // Get total products
    const [productCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM product_catalog",
    );

    // Get total units
    const [unitCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM product_unit",
    );

    // Get active transfers (transfers in transit)
    const [activeTransfers] = await pool.execute(
      "SELECT COUNT(*) as count FROM transfer_log WHERE status = 'in_transit'",
    );

    // Get recent provenance queries (last 24 hours)
    // const [recentQueries] = await pool.execute(
    //   `SELECT COUNT(*) as count
    //    FROM provenance_query_log
    //    WHERE query_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    // );

    const stats = {
      totalOrganizations: orgCount[0]?.count || 0,
      totalProducts: productCount[0]?.count || 0,
      totalUnits: unitCount[0]?.count || 0,
      activeTransfers: activeTransfers[0]?.count || 0,
      recentProvenanceQueries: 0,
      // recentProvenanceQueries: recentQueries[0]?.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
