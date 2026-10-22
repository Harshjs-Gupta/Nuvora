"use client";
import Image from "next/image";
import Link from "next/link";
import long_underline from "../../public/image/long-underline.png";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/products");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="from-luxury-dark to-luxury-black flex h-screen flex-col items-center justify-center gap-3 bg-linear-to-r">
        <div className="border-gold-default h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
        <span className="animate-pulse text-2xl font-bold text-white">
          {status === "authenticated" ? "Redirecting..." : "Loading..."}
        </span>
      </div>
    );
  }

  return (
    <main className="background relative">
      <div className="relative flex h-20 w-full justify-between p-4">
        <Image
          src="/nuvora.png"
          loading="lazy"
          alt="product"
          width={600}
          height={1200}
          placeholder="blur"
          blurDataURL="/blur.jpg"
          className="h-10 w-40 object-cover"
        />
      </div>

      {/* Tagline and Description with Signup button */}
      <div className="mt-5 flex flex-col items-center justify-center gap-6 pt-10 text-center text-[#9b9996]">
        {/* Tagline */}
        <div className="font-custom flex flex-col text-5xl md:text-6xl xl:text-7xl">
          <span>
            Everything you <span className="text-gold-default">love</span>
          </span>
          <div className="flex items-center justify-center gap-4">
            in{" "}
            <div className="text-gold-default flex flex-col items-center">
              <span>one</span>
              <hr className="w-16 border-2 border-[#B98432]" />
            </div>{" "}
            place
          </div>
        </div>
        {/* Description */}
        <div className="text-xl">
          <p>Watch this space for the ultimate shopping </p>
          <p>experience —minus the crowds</p>
        </div>
        {/* Buttons */}
        <div className="flex items-center justify-start gap-4 text-sm">
          <Link
            id="btn-login"
            href="/log-in-page"
            className="text-luxury-black font-raleway rounded-full bg-[#997033] px-8 py-1.5 hover:bg-[#cf933e]"
          >
            LOG IN
          </Link>
          or
          <Link
            id="btn-signup"
            href="/sign-up-page"
            className="text-gold-muted hover:text-gold-light underline"
          >
            Sign up
          </Link>
        </div>
        {/* Already have an account */}
        <div className="text-md flex gap-1">
          <Link href="/log-in-page" className="text-gold-muted underline">
            Log in
          </Link>
          when already have an account
        </div>
      </div>
    </main>
  );
}
