import { Link, NavLink } from "react-router-dom";

type NavbarProps = {
  isLoggedIn: boolean;
  onLogout: () => void;
};

function Navbar({ isLoggedIn, onLogout }: NavbarProps) {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        ChapterFlow
      </Link>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/works">Works</NavLink>
        <NavLink to="/library">Library</NavLink>

        {isLoggedIn && <NavLink to="/subscription">Abo</NavLink>}
        {isLoggedIn && <NavLink to="/author/dashboard">Dashboard</NavLink>}
        {isLoggedIn && <NavLink to="/author/works">Author</NavLink>}

        {isLoggedIn ? (
          <button type="button" onClick={onLogout} className="navbar-button">
            Logout
          </button>
        ) : (
          <NavLink to="/auth">Sign In</NavLink>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
