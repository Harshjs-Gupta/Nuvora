interface PropTypes {
  maxRating?: number;
  size?: number;
  defaultRating?: number;
}

export default function StarRating({
  maxRating = 5,
  size = 20,
  defaultRating = 0,
}: PropTypes) {
  const rating = Math.min(Math.max(defaultRating, 0), maxRating);

  return (
    <div className="flex items-center gap-2">
      <span className="pt-0.5 text-center text-lg font-medium">
        {rating.toFixed(1)}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const fillPercentage = Math.min(Math.max(rating - index, 0), 1);

          return (
            <div
              key={index}
              className="relative"
              style={{
                width: size,
                height: size,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C8A84B"
                strokeWidth="2"
                className="absolute inset-0"
                width={size}
                height={size}
              >
                <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
              </svg>

              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: `${fillPercentage * 100}%`,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#C8A84B"
                  stroke="#C8A84B"
                  strokeWidth="2"
                  width={size}
                  height={size}
                  style={{
                    minWidth: size,
                  }}
                >
                  <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
