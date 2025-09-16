import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useAuth } from '../AuthContext';

export const startIcon = L.icon({
  iconUrl: '/start-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const endIcon = L.icon({
  iconUrl: '/start-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const getWeatherForecast = async ([lat, lon]) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 2);

  const formatDate = (date) => date.toISOString().split('T')[0];

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`);
  const data = await response.json();
  return data.daily;
};

const calculateDistance = (coordinates) => {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lon1] = coordinates[i];
    const [lat2, lon2] = coordinates[i + 1];
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return total.toFixed(2);
};

const generateRoute = async (startCoords, type) => {
  if (type === 'hike') {
    const rand = () => (Math.random() - 0.5) * 0.035;
    const p1 = [startCoords[0] + rand(), startCoords[1] + rand()];
    const p2 = [startCoords[0] + rand(), startCoords[1] + rand()];
    const p3 = [startCoords[0] + rand(), startCoords[1] + rand()];

    const response = await fetch(`https://api.openrouteservice.org/v2/directions/foot-walking/geojson`, {
      method: 'POST',
      headers: {
        'Authorization': process.env.REACT_APP_ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [
          [startCoords[1], startCoords[0]],
          [p1[1], p1[0]],
          [p2[1], p2[0]],
          [p3[1], p3[0]],
          [startCoords[1], startCoords[0]]
        ]
      })
    });

    if (!response.ok) throw new Error("Error in planning your trip");

    const data = await response.json();
    const coordinates = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distance = parseFloat(calculateDistance(coordinates));
    if (distance < 5 || distance > 60) return await generateRoute(startCoords, type);
    return coordinates;
  }

  const randomDelta = 0.3 + Math.random() * 0.3;
  const endLat = startCoords[0] + randomDelta;
  const endLng = startCoords[1] + randomDelta;
  const endCoords = [endLat, endLng];

  const response = await fetch(`https://api.openrouteservice.org/v2/directions/cycling-regular/geojson`, {
    method: 'POST',
    headers: {
      'Authorization': process.env.REACT_APP_ORS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [
        [startCoords[1], startCoords[0]],
        [endCoords[1], endCoords[0]]
      ]
    })
  });

  if (!response.ok) throw new Error("Error in planning your trip");

  const data = await response.json();
  return data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
};

const getImageForLocation = async (query) => {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
  );
  const data = await response.json();
  if (!data.results?.length) throw new Error("Photo not found");
  return data.results[Math.floor(Math.random() * data.results.length)].urls.regular;
};

const TripPlanner = () => {
  const [location, setLocation] = useState('');
  const [type, setType] = useState('hike');
  const [route, setRoute] = useState([]);
  const [weather, setWeather] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [tripName, setTripName] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const { token } = useAuth();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tripName.trim()) return alert("Please enter a name for the trip");

    const res = await fetch('http://localhost:5000/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: tripName,
        description: tripDescription,
        type,
        location,
        route: [{
          day: 1,
          distanceKm: parseFloat(calculateDistance(route)),
          points: route.map(([lat, lng]) => ({ lat, lng }))
        }],
      }),
    });

    if (res.ok) {
      alert("Trip saved successfully!🎉");
      setTripName('');
      setTripDescription('');
    } else {
      if (res.status === 401) {
        alert("Connection time over - you have to reconnect🔒");
        window.location.href = "/login";
      } else alert("Error in saving your trip😢");
    }
  };

  const getCoordinatesFromCity = async (input) => {
    const response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${process.env.REACT_APP_ORS_API_KEY}&text=${encodeURIComponent(input)}&size=5`
    );
    const data = await response.json();
    if (!data.features?.length) throw new Error("Results not found");

    const feature =
      data.features.find((f) =>
        ["locality", "city", "town", "village"].includes(f.properties?.layer)
      ) ||
      data.features.find((f) => f.properties?.layer === "country") ||
      data.features[0];

    if (feature?.bbox) {
      const [minLon, minLat, maxLon, maxLat] = feature.bbox;
      const randomInRange = (min, max) => Math.random() * (max - min) + min;
      return [randomInRange(minLat, maxLat), randomInRange(minLon, maxLon)];
    } else if (feature?.geometry?.coordinates) {
      const [lon, lat] = feature.geometry.coordinates;
      return [lat, lon];
    } else {
      throw new Error("Coordinates not found");
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) return alert("You must enter city or country!");
    try {
      const startCoords = await getCoordinatesFromCity(location);
      const newRoute = await generateRoute(startCoords, type);
      setRoute(newRoute);
      setWeather(await getWeatherForecast(startCoords));
      setImageUrl(await getImageForLocation(location));
    } catch {
      alert("We can't found your city or country😕");
    }
  };

  const MapController = ({ route }) => {
    const map = useMap();
    useEffect(() => {
      if (route.length) map.fitBounds(L.latLngBounds(route), { padding: [50, 50] });
    }, [route, map]);
    return null;
  };

  return (
    <div className ="default-blur">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Planning new trip</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter city or country"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
          />
          <div className="flex items-center gap-4">
            <label className="label">
              <input type="radio" value="bike" checked={type === 'bike'} onChange={() => setType('bike')} /> bike
            </label>
            <label className="label">
              <input type="radio" value="hike" checked={type === 'hike'} onChange={() => setType('hike')} /> hike
            </label>
          </div>
          <button type="submit" className="btn">Create your trip!</button>
        </form>

        <div style={{ height: '400px' }}>
          <MapContainer center={[32.3, 34.9]} zoom={8} className="h-full w-full rounded-lg shadow-md">
            <MapController route={route}/>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            <Polyline positions={route} color="blue" />
            {route.length > 0 && (
              <>
                <Marker position={route[0]} icon={startIcon}><Popup>start</Popup></Marker>
                <Marker position={route[route.length - 1]} icon={endIcon}><Popup>end</Popup></Marker>
              </>
            )}
          </MapContainer>
        </div>

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


        {route.length > 1 && (
          <div className="">
            <h4 className="font-bold text-blue-700 mb-2"> 🧭 Trip length:  {calculateDistance(route)} km</h4>
            {(() => {
              const distance = parseFloat(calculateDistance(route));
              const maxPerDay = type === 'bike' ? 60 : 15;
              if (distance > maxPerDay) {
                const days = Math.ceil(distance / maxPerDay);
                const perDay = (distance / days).toFixed(2);
                return <p>🚶‍♂️ Require <b>{days} days</b> — {perDay} km per day</p>;
              } else {
                return <p>✔️ Can do in one day</p>;
              }
            })()}
          </div>
        )}

        {imageUrl && (
          <div className="">
            <h4 className="font-bold text-blue-700 mb-2">🌄 A bit from the magic of {location}:</h4>
            <img src={imageUrl} alt={location} className="rounded-lg shadow" />
          </div>
        )}

        {route.length > 0 && (
          <div className="">
            <h3 className="text-xl font-bold mb-4 text-blue-700">💾 Save trip</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                placeholder="Trip name"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="input"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={tripDescription}
                onChange={(e) => setTripDescription(e.target.value)}
                className="input"
              />
              <button type="submit" className="btn">Save</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;
