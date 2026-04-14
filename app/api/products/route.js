import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Redirect to catalog route for general product queries
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    if (search) {
      // Forward to catalog route with search parameter
      const catalogUrl = new URL(
        `${req.url.split("/api/products")[0]}/api/products/catalog`,
        req.url,
      );
      catalogUrl.searchParams.set("search", search);

      const response = await fetch(catalogUrl.toString());
      const data = await response.json();

      return NextResponse.json(data, { status: response.status });
    }

    // Return basic info if no search parameter
    return NextResponse.json({
      message:
        "Products API - Use /api/products/catalog for catalog operations or /api/products/units for unit operations",
      endpoints: {
        catalog: "/api/products/catalog",
        units: "/api/products/units",
        bySerial: "/api/products/units/[serial]",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
