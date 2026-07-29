import { Loader2 } from "lucide-react";

const Loader = ({ size = 18, className = "" }) => (
  <Loader2 size={size} className={`animate-spin text-gray-400 ${className}`} />
);

export default Loader;
