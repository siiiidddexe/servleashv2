import { useLocation } from "react-router-dom";

/**
 * Extracts the role (customer | admin | vendor) from the current URL path.
 * e.g. /customer/login → "customer"
 */
export function useRole() {
  const { pathname } = useLocation();
  const seg = pathname.split("/")[1]; // "customer" | "admin" | "vendor"
  return seg || "customer";
}
