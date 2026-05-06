import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import type { AuthUser } from "../lib/auth";

type AppLayoutProps = {
  currentUser: AuthUser | null;
  onLogout: () => void;
};

function AppLayout({ currentUser, onLogout }: AppLayoutProps) {
  return (
    <>
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <main className="page">
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
