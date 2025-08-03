import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

const startIcon = L.icon({
  iconUrl: '/start-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const endIcon = L.icon({
  iconUrl: '/start-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const getWeatherForecast = async ([lat, lon]) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + 1); // מחר
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 2); // שלושה ימים בסך הכול

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

    const R = 6371; // רדיוס כדור הארץ בק"מ
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }

  return total.toFixed(2); // מחזיר בק"מ, עם שתי ספרות אחרי הנקודה
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
            [startCoords[1], startCoords[0]], // התחלה
            [p1[1], p1[0]],                   // נקודת ביניים 1
            [p2[1], p2[0]],                   // נקודת ביניים 2
            [p3[1], p3[0]],                   // נקודת ביניים 3
            [startCoords[1], startCoords[0]]  // חזרה להתחלה
        ]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouteService error:", errorText);
        throw new Error("שגיאה בתכנון המסלול - נסה שוב עם עיר אחרת או מאוחר יותר");
    }

    const data = await response.json();

    const coordinates = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    const distance = parseFloat(calculateDistance(coordinates));

    if (distance < 5 || distance > 60) {
        // לא מתאים – תנסה מחדש (רק פעם אחת)
        return await generateRoute(startCoords, type);
    }

    return coordinates;
  }

  // מסלול אופניים רגיל, מ־A ל־B
  const randomDelta = 0.3 + Math.random() * 0.3; // מביא כ-60–110 ק"מ
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouteService error:", errorText);
    throw new Error("שגיאה בתכנון המסלול - נסה שוב עם עיר אחרת או מאוחר יותר");
  }

  const data = await response.json();


  const coordinates = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  return coordinates;
};

const getImageForLocation = async (query) => {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
  );

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("לא נמצאה תמונה");
  }

  const randomImage = data.results[Math.floor(Math.random() * data.results.length)];
  return randomImage.urls.regular;
};

const TripPlanner = () => {
  const [location, setLocation] = useState('');
  const [type, setType] = useState('hike');
  const [route, setRoute] = useState([]);
  const [weather, setWeather] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const getCoordinatesFromCity = async (input) => {
  const response = await fetch(
    `https://api.openrouteservice.org/geocode/search?api_key=${process.env.REACT_APP_ORS_API_KEY}&text=${encodeURIComponent(input)}&size=5`
  );
  const data = await response.json();

  if (!data || !data.features || data.features.length === 0) {
    throw new Error("לא נמצאו תוצאות מתאימות");
  }

  const feature =
    data.features.find(f =>
      ['locality', 'city', 'town', 'village'].includes(f.properties?.layer)
    ) ||
    data.features.find(f =>
      f.properties?.layer === 'country'
    ) ||
    data.features[0];

  if (!feature || !feature.geometry?.coordinates || !feature.bbox) {
    throw new Error("לא נמצאו קואורדינטות בתוצאה המתאימה");
  }

  const [minLon, minLat, maxLon, maxLat] = feature.bbox;

  // בחר נקודה רנדומלית בתוך ה־bbox
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  const randomLat = randomInRange(minLat, maxLat);
  const randomLon = randomInRange(minLon, maxLon);

  console.log(`🎯 סוג מקום: ${feature.properties?.layer}, bbox: [${minLat}, ${minLon}] – [${maxLat}, ${maxLon}], נקודה רנדומלית: ${randomLat},${randomLon}`);

  return [randomLat, randomLon];
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const startCoords = await getCoordinatesFromCity(location);
        const newRoute = await generateRoute(startCoords, type);
        setRoute(newRoute);

        const forecast = await getWeatherForecast(startCoords);
        setWeather(forecast);

        const image = await getImageForLocation(location);
        setImageUrl(image);
    } catch (err) {
        alert("לא ניתן למצוא את העיר שביקשת 😕");
    }
  };

  const MapController = ({ route }) => {
    const map = useMap();

    useEffect(() => {
        if (route.length > 0) {
        const bounds = L.latLngBounds(route);
        map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [route, map]);

    return null;
  };

  return (
    <div>
      <h2>תכנון מסלול חדש</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="הכנס עיר או מדינה"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        /><br />

        <label>
            <input
                type="radio"
                value="bike"
                checked={type === 'bike'}
                onChange={() => setType('bike')}
            />
            bike
        </label>
        <label>
            <input
                type="radio"
                value="hike"
                checked={type === 'hike'}
                onChange={() => setType('hike')}
            />
            hike
        </label>
        <br />

        <button type="submit">צור מסלול</button>
      </form>

      <div style={{ height: '400px', marginTop: '20px' }}>
        <MapContainer center={[32.3, 34.9]} zoom={8} style={{ height: '100%', width: '100%' }}>
            <MapController route={route} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Polyline positions={route} color="blue" />
          {route.length > 0 && (
            <>
                <Marker position={route[0]} icon={startIcon}>
                <Popup>התחלה</Popup>
                </Marker>
                <Marker position={route[route.length - 1]} icon={endIcon}>
                <Popup>סיום</Popup>
                </Marker>
            </>
            )}
        </MapContainer>

        {weather && (
            <div style={{ marginTop: '20px' }}>
                <h4>☀️ תחזית מזג האוויר (מחר והלאה):</h4>
                <ul>
                {weather.time.map((date, index) => (
                    <li key={index}>
                    <b>{date}:</b> טמפרטורות {weather.temperature_2m_min[index]}°–{weather.temperature_2m_max[index]}°C,
                    משקעים {weather.precipitation_sum[index]} מ״מ
                    </li>
                ))}
                </ul>
            </div>
        )}

        {route.length > 1 && (
            <div style={{ marginTop: '15px' }}>
                <h4>🧭 אורך המסלול: {calculateDistance(route)} ק"מ</h4>

                {(() => {
                const distance = parseFloat(calculateDistance(route));
                const maxPerDay = type === 'bike' ? 60 : 15;

                if (distance > maxPerDay) {
                    const days = Math.ceil(distance / maxPerDay);
                    const perDay = (distance / days).toFixed(2);

                    return (
                    <p>
                        🚶‍♂️ המסלול עובר את המקסימום ליום – נדרש לפחות <b>{days} ימים</b><br />
                        כל יום תצטרך לעבור בערך <b>{perDay} ק"מ</b>
                    </p>
                    );
                } else {
                    return <p>✔️ ניתן לבצע את המסלול ביום אחד.</p>;
                }
                })()}
            </div>
        )}
        
        {imageUrl && (
            <div style={{ marginTop: '20px' }}>
                <h4>🌄 תמונה מייצגת של {location}:</h4>
                <img src={imageUrl} alt={`תמונה של ${location}`} style={{ maxWidth: '100%', borderRadius: '12px' }} />
            </div>
        )}
      </div>
    </div>
  );
};

export default TripPlanner;

