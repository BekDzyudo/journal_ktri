import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, auth }) => {
//   const { auth } = useContext(AuthContext);
  if (!auth.refreshToken) {
    return <Navigate to="/login" replace />;
  }
else return children;
};

export default ProtectedRoute;

