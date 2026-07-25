import { Link } from "react-router-dom";
import { cx } from "@/lib/utils";

/** SameThing. — nokta her zaman sand. Tek imza, her ekranda ayni. */
export default function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <Link
      to="/"
      className={cx(
        "font-display font-medium leading-none tracking-tight text-cream dot",
        size === "lg" ? "text-6xl" : "text-2xl"
      )}
    >
      SameThing
    </Link>
  );
}
