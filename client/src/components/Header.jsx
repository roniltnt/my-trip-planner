import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const Header = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-blue-700 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-white text-2xl font-bold tracking-wide hover:text-yellow-300 transition"
        >
          🌍 My Trip Planner
        </Link>

        <nav className="flex items-center space-x-6 rtl:space-x-reverse">

          {token && (
            <>
              <Link
                to="/planner"
                className="text-white hover:text-yellow-300 transition font-medium"
              >
                Plan a Trip
              </Link>
              <Link
                to="/history"
                className="text-white hover:text-yellow-300 transition font-medium"
              >
                Saved Trips
              </Link>
            </>
          )}

          {!token ? (
            <>
              <Link
                to="/login"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded-lg transition"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
