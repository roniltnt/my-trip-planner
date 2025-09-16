# 🧭 My Trip Planner

Plan hiking or biking routes anywhere in the world 🌍, preview them on a live Leaflet map, check weather forecasts, view a representative photo, and save trips for later.  
Built as part of a **Full Stack Web Development final project**.

- **Client:** React + React Router + React-Leaflet + TailwindCSS  
- **Server:** Node.js + Express  
- **Routing:** OpenRouteService API (cycling / hiking)  
- **Persistence:** MongoDB (NoSQL)  
- **Extras:** Open Meteo (weather), Unsplash (images)

---

## Table of contents

- [Screens](#screens)
  - [Welcome](#welcome)
  - [Planner](#planner)
  - [My Trips](#my-trips)
  - [Trip View](#trip-view)
  - [Login / Logout](#login--logout)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [API reference](#api-reference)
- [Sample DB export](#sample-db-export)
- [Troubleshooting](#troubleshooting)

---

## Screens

### Welcome
The entry page with a **full-screen background image** and a call-to-action to open the planner.

### Planner
Generate new routes:
- Enter **city/country**  
- Select **bike** / **hike**  
- Preview **route on map** (blue polyline, start/end markers)  
- View **trip length** (km, with per-day split if needed)  
- See **3-day weather forecast**  
- Fetch a **representative photo** from Unsplash  
- Save trip (with name + description)

### My Trips
List of saved trips with:
- Trip name  
- Location & type  
- Approx distance  
- Created date  

Blurred background always shown, even if empty.

### Trip View
Detailed view of a single trip:
- Title, description, type  
- Representative photo  
- Weather forecast  
- Route map  
- Distance & per-day calculation  

### Login / Logout
JWT-based authentication with tokens stored in `localStorage`.

---

## How it works

1. **Geocoding** – OpenRouteService converts input city/country → coordinates.  
2. **Route generation** – OpenRouteService API builds realistic `hike` or `bike` route.  
3. **Distance** – Calculated once in the planner and saved in DB (`distanceKm`).  
4. **Weather** – Fetched from Open-Meteo API for starting point.  
5. **Image** – Unsplash API returns a representative photo.  
6. **Persistence** – Trips stored in MongoDB with fields: name, description, location, type, route & createdAt

## Quick start 

### Open two terminals:

#### Server

cd server
npm i
cp .env.example .env
Fill: REACT_APP_ORS_API_KEY, REACT_APP_UNSPLASH_ACCESS_KEY, JWT_SECRET
npm start

#### Client 

cd client
npm i
npm start   # http://localhost:3000

### API reference

- POST/api/auth/register – register new user
- POST/api/auth/login – login, returns JWT
- GET/api/trips – list user trips
- POST/api/trips – save new trip
- GET/api/trips/:id – get single trip
