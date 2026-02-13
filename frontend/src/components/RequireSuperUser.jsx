
import { Navigate } from "react-router-dom";

export default function RequireSuperUser({ isSuperUser, children }) {
  if (!isSuperUser) {
    return <Navigate to=".." replace />;
  }
  return children;
}
