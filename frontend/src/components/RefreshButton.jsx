import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";

/**
 * RefreshButton
 * Props:
 *  - onClick: function to call when button is clicked
 *  - isLoading: optional external loading state
 *  - variant: bootstrap button variant, default "primary"
 *  - children: optional button content (icon/text)
 */
export default function RefreshButton({ onClick, isLoading: externalLoading, variant = "primary", children }) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading ?? internalLoading;

  useEffect(() => {
    if (!internalLoading) return;

    const timeoutId = setTimeout(() => {
      setInternalLoading(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [internalLoading]);

  const handleClick = () => {
    if (onClick) onClick();
    if (!externalLoading) setInternalLoading(true);
  };

  return (
    <Button
      variant={variant}
      disabled={loading}
      onClick={handleClick}
      className="d-flex align-items-center gap-2"
    >
      {loading ? <i className="bi bi-arrow-clockwise spin" /> : <i className="bi bi-arrow-clockwise" />}
      {children && <span>{children}</span>}
    </Button>
  );
}
