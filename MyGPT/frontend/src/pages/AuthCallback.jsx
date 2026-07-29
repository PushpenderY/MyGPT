import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";

const AuthCallback = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const user = await refreshUser();
      navigate(user ? "/" : "/login", { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-surface text-gray-300 gap-3">
      <Loader size={28} />
      <p className="text-sm">Signing you in…</p>
    </div>
  );
};

export default AuthCallback;
