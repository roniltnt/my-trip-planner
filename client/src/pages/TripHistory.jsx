import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

export default function TripHistory() {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/trips", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch trips");
        const data = await res.json();
        setTrips(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cover bg-center" style={{ backgroundImage: "url('/travel-bg.jpg')" }}>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700">
            Loading trips...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className ="default-blur">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">My Trips</h2>
        {trips.length === 0 ? (
          <p className="text-gray-500">No trips found.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map(trip => (
              <li
                key={trip._id}
                className="bg-white/80 backdrop-blur-md shadow-lg rounded-xl p-4 border border-gray-200 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-blue-700">{trip.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {trip.location} ({trip.type})
                  </p>
                  {trip.description && (
                    <p className="italic text-xs text-gray-500 mt-2">
                      {trip.description}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-400">
                    Created: {new Date(trip.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => navigate(`/trips/${trip._id}`)}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition w-full"
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}