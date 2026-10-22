import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchID = searchParams.get("searchID");

  console.log("Search ID:", searchID);

  if (!searchID) {
    return NextResponse.json(
      { error: "Please provide an ASIN." },
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({
      country: "IN",
      autoselect_variant: "true",
      asin: searchID,
    });

    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/product-details?${params}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.text();

      console.error("RapidAPI Error:", errorData);

      return NextResponse.json(
        {
          error: "Failed to fetch product data from RapidAPI.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching Amazon data:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch data from Amazon.",
      },
      { status: 500 },
    );
  }
}
