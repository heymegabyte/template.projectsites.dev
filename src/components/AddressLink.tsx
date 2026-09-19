interface Props {
  address: string;
  className?: string;
  multiline?: boolean;
}

/**
 * Wraps a street address in a Google Maps directions URL.
 * The `multiline` flag preserves embedded newlines (`\n`) when rendering.
 */
export function AddressLink({ address, className, multiline = true }: Props) {
  // Fail-safe: an empty / unfilled-{token} address → render nothing, never a broken directions link
  // (destination=%7BADDRESS%7D) with a leaked "{ADDRESS}" label + "Get directions to {ADDRESS}" aria.
  if (!address || address.startsWith("{") || !address.trim()) return null;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Get directions to ${address}`}
      className={`underline-hover interactive-4 ${className ?? ""}`.trim()}
      style={multiline ? { whiteSpace: "pre-line" } : undefined}
    >
      {address}
    </a>
  );
}

export default AddressLink;
