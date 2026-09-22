import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const RequireAuth = ({ children, role }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  // Belum login
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Role tidak sesuai
  if (role && user.role !== role) {
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    if (user.role === "pembeli") {
      return <Navigate to="/pembeli" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;