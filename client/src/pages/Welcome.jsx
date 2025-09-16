import React from "react";
import { Link } from "react-router-dom";

export default function Welcome() {

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-xl p-12 max-w-3xl text-center">
        <h1 className="mb-6 text-5xl font-extrabold text-blue-700">
          Welcome Adventurer!
        </h1>
        <p className="mb-10 text-lg text-gray-700">
          Plan your hiking or biking trips, check the weather, and save your adventures.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Link to="/planner" className="btn px-6 py-3">Start Planning</Link>
          <Link to="/history" className="btn-outline px-6 py-3">View Saved Trips</Link>
        </div>
      </div>
    </div>
  );
}
