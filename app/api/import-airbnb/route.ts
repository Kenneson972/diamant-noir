import { NextResponse } from "next/server";
import { fetchAirbnbData } from "@/lib/airbnb-import";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || !url.includes('airbnb')) {
      return NextResponse.json({ error: "URL Airbnb invalide" }, { status: 400 });
    }

    const data = await fetchAirbnbData(url);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
