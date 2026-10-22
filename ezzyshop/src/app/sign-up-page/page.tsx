"use client";
import style from "./sign-up.module.css";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { User, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";

interface AvatarState {
  file: File | null;
  url: string | StaticImageData;
}

function SignUpPage() {
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarState>({
    file: null,
    url: "/image/dummyProfile.jpg",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  function handleAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar({ file, url: URL.createObjectURL(file) });
    }
  }

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    setIsLoading(true);
    e.preventDefault();

    try {
      // Upload avatar to Cloudinary if provided
      let imageUrl = "/image/dummyProfile.jpg";
      if (avatar.file) {
        const formData = new FormData();
        formData.append("file", avatar.file);
        // Note: Cloudinary upload is admin-gated. For user avatars, upload directly via unsigned preset.
        // For now, we'll skip avatar upload and use default image.
        // TODO: Add unsigned Cloudinary preset for user avatars
      }

      // Register user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed.");
        return;
      }

      toast.success("Account created! Logging you in...");

      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/products");
      } else {
        router.push("/log-in-page");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="signUpBackground animation">
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
      <div className="mt-20 flex flex-col items-center justify-center gap-6 text-[#9b9996] xl:mt-10">
        <form
          id="form-signup"
          className="animation bg-luxury-card/90 xl:bg-luxury-card/50 flex h-auto w-72 flex-col items-center justify-center rounded-3xl border border-[#B98432] px-2 py-4 text-white"
          onSubmit={handleSignIn}
        >
          <label htmlFor="file" className="flex w-full items-center gap-2 px-2 cursor-pointer">
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-full border border-[#B98432] p-2">
                {avatar.url !== "/image/dummyProfile.jpg" ? (
                  <Image
                    src={avatar.url as string}
                    alt="avatar"
                    width={64}
                    height={64}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <User className="h-8 w-8 text-[#B98432]" />
                )}
              </div>
            </div>
            <div className="flex flex-col text-sm">
              <span>Upload an image</span>
              <span className="text-[#B98432]">Optional profile pic</span>
            </div>
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} accept="image/*" />
          <div className="mt-2 h-auto space-y-5 p-2">
            <input
              type="text"
              name="username"
              id="input-username"
              className="w-64 rounded-lg border border-[#B98432] bg-transparent p-2 outline-none"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
            />
            <input
              type="email"
              name="email"
              id="input-email"
              className="w-64 rounded-lg border border-[#B98432] bg-transparent p-2 outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              name="password"
              id="input-password"
              className="w-64 rounded-lg border border-[#B98432] bg-transparent p-2 outline-none"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <button
              id="btn-signup-submit"
              disabled={!!isLoading}
              className="flex h-10 w-40 cursor-pointer items-center justify-center gap-2 rounded-full border border-black bg-[#D9A54B] p-2 font-bold text-black hover:bg-[#d9a44bcf]"
            >
              {isLoading ? "In Process..." : "Sign Up"}
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
              ) : (
                <UserPlus className="h-5.5 w-5.5" />
              )}
            </button>
            <p className="flex space-x-2 text-sm">
              <Link
                href="/log-in-page"
                className="text-gold-dim cursor-pointer underline transition-all hover:text-[#B98432]"
              >
                Log in
              </Link>
              , when you have an account.
            </p>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-sm">Or</span>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/products" })}
              className="font-semibold text-[#B98432] transition-all hover:underline"
            >
              Google Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default SignUpPage;
