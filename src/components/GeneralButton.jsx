export default function GeneralButton({ text, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm whitespace-nowrap border border-gray-300 hover:bg-gray-100 transition ${className}`}
    >
      {text}
    </button>
  );
}
