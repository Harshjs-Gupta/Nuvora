"use client";
import { useEffect, useState } from "react";
import SlugComponent from "./slugComponent";
import { Product } from "@/types/productTypes";

interface ProductsResponse {
  result: Product[];
}

function SlugProduct() {
  const [products, setProducts] = useState<ProductsResponse | null>(null);

  useEffect(() => {
    // Fetch products from localStorage (only on the client)
    const storedProducts = localStorage.getItem("products");
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    }
  }, []);

  // Re-run GSAP effect when products are loaded

  // Safely access `products.result` and default to an empty array if it's undefined
  const items = products?.result || [];
  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.asin, item])).values(),
  );
  // console.log(products);

  return (
    <div className="productContainer bg-luxury-card flex flex-col gap-5 p-3">
      {uniqueItems.map((item) => (
        <div key={item.asin} className="productsItem">
          <SlugComponent products={item} />
        </div>
      ))}
    </div>
  );
}

export default SlugProduct;
