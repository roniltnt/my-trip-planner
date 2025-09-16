import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { startIcon, endIcon } from "./TripPlanner";

const getWeatherForecast = async ([lat, lon]) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 2);

  const formatDate = (date) => date.toISOString().split("T")[0];

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${formatDate(
      startDate
    )}&end_date=${formatDate(endDate)}`
  );

  const data = await response.json();
  return data.daily;
};

export default function TripView() {
  const { id } = useParams();
  const { token } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/trips/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch trip");
        const data = await res.json();
        setTrip(data);

        if (data.route && data.route.length > 0 && data.route[0].points.length) {
          const startPoint = data.route[0].points[0];
          const forecast = await getWeatherForecast([
            startPoint.lat,
            startPoint.lng,
          ]);
          setWeather(forecast);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-cover bg-center" style={{ backgroundImage: "url('/travel-bg.jpg')" }}>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-blue-700">
            Loading your trip...
          </p>
        </div>
      </div>
    );
  }

  if (!trip) return <p className="text-gray-500">Trip not found.</p>;

  const coordinates = trip.route
    ? trip.route.flatMap((day) => day.points || [])
    : [];

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">{trip.name}</h2>
        <p>
          <strong>Location:</strong> {trip.location}
        </p>
        <p>
          <strong>Type:</strong> {trip.type}
        </p>
        {trip.description && <p className="italic">{trip.description}</p>}

        {trip.route?.length > 0 && (
          <div className="mt-4">
            <h4 className="font-bold text-blue-700 mb-2">
              🧭 Trip length: {trip.route[0].distanceKm} km
            </h4>
            {(() => {
              const distance = trip.route[0].distanceKm;
              const maxPerDay = trip.type === "bike" ? 60 : 15;
              if (distance > maxPerDay) {
                const days = Math.ceil(distance / maxPerDay);
                const perDay = (distance / days).toFixed(2);
                return (
                  <p>
                    🚶‍♂️ Requires <b>{days} days</b> — {perDay} km per day
                  </p>
                );
              } else {
                return <p>✔️ Can do in one day</p>;
              }
            })()}
          </div>
        )}


        {weather && (
          <div className="mt-6">
            <h4 className="font-semibold mb-4 text-lg text-blue-700">
              ☀️ Weather forecast
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weather.time.map((date, i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-md p-4 rounded-lg shadow-md border border-gray-200 text-center"
                >
                  <p className="font-bold text-blue-600">{date}</p>
                  <p className="text-sm">
                    {weather.temperature_2m_min[i]}° – {weather.temperature_2m_max[i]}°C
                  </p>
                  <p className="text-xs text-gray-600">
                    Precipitation: {weather.precipitation_sum[i]} mm
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {coordinates.length > 0 ? (
          <MapContainer
            center={[coordinates[0].lat, coordinates[0].lng]}
            zoom={13}
            className="h-96 w-full mt-6 rounded-lg shadow-md"
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={coordinates.map((c) => [c.lat, c.lng])} color="blue" />
            <Marker position={[coordinates[0].lat, coordinates[0].lng]} icon={startIcon}>
              <Popup>Start</Popup>
            </Marker>
            <Marker
              position={[
                coordinates[coordinates.length - 1].lat,
                coordinates[coordinates.length - 1].lng,
              ]}
              icon={endIcon}
            >
              <Popup>End</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <p className="text-gray-500 mt-4">No route data available.</p>
        )}
      </div>
    </div>
  );
}
