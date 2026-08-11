export default function CoffeeBean({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C7 2 3 6 3 11c0 5.5 4.5 11 9 11s9-5.5 9-11c0-5-4-9-9-9z" />
      <path
        d="M12 4c-3 3-3 6 0 9s3 6 0 9"
        stroke="#FAFAFA"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}