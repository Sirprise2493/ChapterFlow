import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

type AppLayoutProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};

function AppLayout({ isLoggedIn, onLogout }: AppLayoutProps) {
  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={onLogout} />

      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
