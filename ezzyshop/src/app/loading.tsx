"use client";
import { useLoading } from "./loadingContext";
import Image from "next/image";
import loader from "@/assets/gif/cart-loader.gif";

function Loading() {
  const { loading } = useLoading();
  return loading ? (
    <div className="bg-luxury-card absolute fixed inset-0 flex items-center justify-center opacity-50">
      <Image src={loader} alt="loader" />
    </div>
  ) : null;
}

export default Loading;
