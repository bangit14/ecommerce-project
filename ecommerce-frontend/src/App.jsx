import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { syncUserIdFromToken } from "./utils/authSession";

function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || localStorage.getItem("userId")) {
      return;
    }

    syncUserIdFromToken(token);
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
