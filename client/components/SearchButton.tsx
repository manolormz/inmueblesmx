export default function SearchButton({ label = "Search" }: { label?: string }) {
  return (
    <button
      type="submit"
      className="bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 active:bg-blue-800 transition-colors"
      aria-label={label}
    >
      {label}
    </button>
  );
}
