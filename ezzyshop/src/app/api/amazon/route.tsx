// // // app/api/amazon/route.js
// import { NextResponse } from "next/server";
// import amazon from "amazon-buddy";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const searchTerm = searchParams.get("searchTerm");

//   // Ensure a search term is provided
//   if (!searchTerm) {
//     return NextResponse.json(
//       { error: "Please provide a search term." },
//       { status: 400 },
//     );
//   }

//   try {
//     // Perform the Amazon search with amazon-buddy
//     const result = await amazon.products({
//       keyword: searchTerm,
//       number: 50,
//       country: "IN",
//       randomUa: true, // 👈 rotates user agents
//       timeout: 30000, // 👈 give it more time
//       bulk: false, // 👈 try disabling bulk mode
//       sponsored: false,
//     });

//     // Send the search result as a JSON response
//     return NextResponse.json(result);
//   } catch (error: any) {
//     console.error("Full error:", JSON.stringify(error, null, 2));
//     console.error("Message:", error?.message);
//     console.error("Stack:", error?.stack);
//     return NextResponse.json(
//       { error: "Failed to fetch data from Amazon.", details: error?.message },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get("searchTerm");

  if (!searchTerm) {
    return NextResponse.json(
      { error: "Please provide a search term." },
      { status: 400 },
    );
  }

  try {
    const params = new URLSearchParams({
      query: searchTerm,
      page: "1",
      country: "IN",
      sort_by: "RELEVANCE",
      product_condition: "ALL",
    });

    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?${params}`,
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        },
      },
    );

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Raw:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      totalProducts: data.data?.total_products || 0,
      keyword: searchTerm,
      result: data.data?.products || [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch data.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
