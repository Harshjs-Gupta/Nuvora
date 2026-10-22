import Image from "next/image";
import StartRating from "../StartRating/startRating";
// import { useState } from "react";
import { useLoading } from "@/app/loadingContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { url } from "inspector";
import { Product } from "@/types/productTypes";

interface Props {
  products: Product;
}

const SlugComponent: React.FC<Props> = ({ products }: Props) => {
  // const [searchID, setSearchID] = useState("");
  const { setLoading } = useLoading();
  const router = useRouter();
  const { data: session } = useSession();
  const {
    asin,
    product_title,
    product_photo,
    product_star_rating,
    product_price,
    product_original_price,
    product_url,
    currency,
  } = products;
  // const { before_price, current_price, savings_amount } = price ?? {};

  const parsePrice = (price: string | number | null | undefined): number => {
    if (price === null || price === undefined) return 0;

    const parsedPrice = parseFloat(String(price).replace(/[^\d.]/g, ""));

    return Number.isNaN(parsedPrice) ? 0 : parsedPrice;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-IN");
  };

  const originalPrice = parsePrice(product_original_price);
  const currentPrice = parsePrice(product_price);

  const savings = Math.max(originalPrice - currentPrice, 0);

  const discountPercentage =
    originalPrice > 0 && currentPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const fetchProductById = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/productDetail?searchID=${encodeURIComponent(productId)}`,
      );
      const data = await response.json();

      if (response.ok) {
        // setSearchID(productId);
        // Save fetched product data in local storage and navigate to cart page
        localStorage.setItem("productDetails", JSON.stringify(data));
        router.push("/products/product-details-page");
        return data;
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  function handleDetailsPage() {
    fetchProductById(asin);
  }

  async function addToCart(productId: string) {
    if (!session) {
      toast.error("You must be logged in to add items to the cart.");
      router.push("/log-in-page");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to add to cart.");
        return;
      }
      toast.success("Added to cart!");
      router.push("/products/cartPage");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-auto w-full overflow-hidden border-b p-1.5 text-white">
      <div
        className="flex h-auto w-66.25 cursor-pointer items-center justify-center bg-white object-cover sm:h-64 sm:w-72"
        onClick={handleDetailsPage}
      >
        {product_photo ? (
          <Image
            src={product_photo}
            alt={`${product_title} image`}
            className="h-full w-full rounded-sm object-contain"
            width={180}
            height={100}
          />
        ) : (
          <div className="flex h-25 w-45 flex-col items-center justify-center bg-gray-800">
            <span className="text-sm text-gray-400">Image not loaded</span>
            <span className="text-sm text-gray-400">
              Click for product Details
            </span>
          </div>
        )}
      </div>
      <div
        className="flex w-96 flex-col gap-3 sm:w-full sm:p-3"
        onClick={handleDetailsPage}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-gold-default hover:text-gold-dim block cursor-pointer text-base leading-relaxed font-semibold sm:hidden md:text-2xl">
            {product_title.length > 20
              ? product_title.slice(0, 40) + "..."
              : product_title}
          </h1>
          <h1 className="text-gold-default hover:text-gold-dim hidden cursor-pointer text-base leading-relaxed font-semibold sm:block md:text-2xl">
            {product_title.length > 20
              ? product_title.slice(0, 100) + "..."
              : product_title}
          </h1>
          <div className="flex items-center gap-3">
            <StartRating
              defaultRating={Number(product_star_rating) || 0}
              size={18}
              maxRating={5}
            />
            {!product_url ? (
              <span> </span>
            ) : (
              <Link
                href={product_url}
                target="_blank"
                className="w-fit text-[12px] hover:underline"
              >
                Go to Amazon
              </Link>
            )}
          </div>
          {/* //SECTION: Price, Discount percentage, and saving amount */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-3">
              {discountPercentage > 0 && (
                <span className="text-xl font-medium text-red-400 md:text-2xl">
                  -{discountPercentage}%
                </span>
              )}

              <span className="text-2xl font-bold md:text-3xl">
                ₹{formatPrice(currentPrice)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {originalPrice > currentPrice && (
                <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                  <span>M.R.P:</span>

                  <span className="line-through">
                    ₹{formatPrice(originalPrice)}
                  </span>
                </div>
              )}

              {savings > 0 && (
                <span className="text-sm text-green-400">
                  You save ₹{formatPrice(savings)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => addToCart(asin)}
            className="bg-gold-light hover:bg-gold-default active:bg-gold-dim text-luxury-black h-8 w-20 cursor-pointer rounded-full text-[12px] font-semibold transition-colors duration-200 sm:h-8 sm:w-24 sm:text-sm"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlugComponent;
