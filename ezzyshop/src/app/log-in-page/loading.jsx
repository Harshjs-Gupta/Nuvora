export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-linear-to-br from-[#1a1a1a] via-[#2b2b2b] to-[#0f0f0f]">
      {/* Logo / Brand */}
      <h1 className="mb-6 animate-pulse text-3xl font-extrabold tracking-wide text-white">
        ShopEase
      </h1>

      {/* Spinner */}
      <div className="relative mb-6 h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-600 border-t-white"></div>
      </div>

      {/* Loading Text */}
      <p className="text-lg text-gray-300">Redirecting...</p>

      {/* Shimmer Bar */}
      <div className="mt-6 h-2 w-40 overflow-hidden rounded-full bg-gray-700">
        <div className="h-full w-full animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/40 to-transparent"></div>
      </div>
    </div>
  );
}
