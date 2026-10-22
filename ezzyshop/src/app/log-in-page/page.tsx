"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import GoogleLogo from "@/assets/logo/google_logo.png";
import { toast } from "react-toastify";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function LogInPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/products");
    }
  }, [status, router]);

  const handleGoogleAuth = async () => {
    await signIn("google", { callbackUrl: "/products" });
  };

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const { email, password } = Object.fromEntries(formData.entries()) as {
      email: string;
      password: string;
    };

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
      } else {
        toast.success("Logged in successfully!");
        router.push("/products");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setEmail("");
      setPassword("");
    }
  }

  if (status === "loading") {
    return (
      <div className="from-luxury-dark to-luxury-black flex h-screen items-center justify-center bg-linear-to-r">
        <div className="border-gold-default h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="logInBackground animation">
      {/* Logo */}
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
      {/* Log in Form */}
      <div className="mt-52 flex flex-col items-center justify-center gap-6 text-[#9b9996] xl:mt-10">
        <div className="animation bg-luxury-card/90 xl:bg-luxury-card/50 flex h-80 w-72 flex-col items-center justify-center rounded-3xl border border-[#B98432] p-5 text-white">
          {/* Google Auth button */}
          <button
            id="btn-google-signin"
            className={`text-gold-dim hover:bg-gold-deep/40 active:bg-gold-deep/70 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#B98432] transition`}
            onClick={handleGoogleAuth}
          >
            <Image src={GoogleLogo} alt="GoogleLogo" className="w-6" />
            <span>Sign in with Google</span>
          </button>
          <span className="p-2 text-[#9b9996]">Or</span>
          <form id="form-login" className="flex flex-col space-y-5" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              id="input-email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="placeholder:text-gold-dim h-10 w-64 rounded-lg border border-[#B98432] bg-transparent p-2 outline-none focus:outline-none"
            />
            <input
              type="password"
              name="password"
              id="input-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="placeholder:text-gold-dim h-10 w-64 rounded-lg border border-[#B98432] bg-transparent p-2 outline-none focus:outline-none"
            />
            <div className="animation flex flex-col items-center justify-center gap-4">
              <button
                id="btn-login-submit"
                disabled={!!isLoading}
                className="flex h-10 w-40 cursor-pointer items-center justify-center rounded-full bg-[#D9A54B] p-2 font-bold text-black hover:bg-[#b98332ce] active:bg-[#b9833299]"
              >
                <span className={`${isLoading ? "animate-caret-blink" : ""}`}>
                  {isLoading ? "In Process..." : "Login"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default LogInPage;
