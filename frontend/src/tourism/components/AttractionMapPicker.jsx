import { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

const defaultPosition = [11.1271, 78.6569];
const attractionMarker = new L.Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenter({ latitude, longitude, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], zoom, { animate: true });
    map.invalidateSize();
  }, [latitude, longitude, map, zoom]);

  return null;
}

function MapClickHandler({ onSelectPosition }) {
  useMapEvents({
    click(event) {
      onSelectPosition(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function districtFromAddress(address = {}) {
  return (
    address.state_district ||
    address.county ||
    address.city ||
    address.town ||
    address.village ||
    ""
  );
}

function isValidPlace(place) {
  return (
    Number.isFinite(Number(place.lat)) &&
    Number.isFinite(Number(place.lon)) &&
    Number(place.lat) >= -90 &&
    Number(place.lat) <= 90 &&
    Number(place.lon) >= -180 &&
    Number(place.lon) <= 180
  );
}

function AttractionMapPicker({ form, onLocationSelect, onCoordinatesSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const hasCoordinates =
    form.latitude !== "" &&
    form.longitude !== "" &&
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude));
  const position = hasCoordinates
    ? [Number(form.latitude), Number(form.longitude)]
    : defaultPosition;

  const searchPlaces = async (event) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (searchTerm.length < 3) {
      setSearchError("Enter at least 3 characters to search for a place.");
      setResults([]);
      return;
    }

    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const params = new URLSearchParams({
        q: searchTerm,
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        countrycodes: "in",
        "accept-language": "en",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) {
        throw new Error(`Place search failed (${response.status}).`);
      }
      const places = await response.json();
      if (!Array.isArray(places)) {
        throw new Error("Place search returned an unexpected response.");
      }
      const validPlaces = places.filter(isValidPlace);
      if (validPlaces.length === 0) {
        setSearchError(
          "No locations with valid coordinates were found. Try a nearby landmark or address."
        );
        return;
      }
      setResults(validPlaces);
      selectPlace(validPlaces[0]);
    } catch (error) {
      console.error("Attraction place search error:", error);
      setSearchError(
        error instanceof Error
          ? `${error.message} You can still select a point directly on the map.`
          : "Unable to search places. You can still select a point directly on the map."
      );
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place) => {
    const address = place.address || {};
    const name =
      place.name ||
      place.display_name?.split(",")[0]?.trim() ||
      query.trim();
    const district = districtFromAddress(address);
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);
    onLocationSelect({
      name,
      ...(district ? { district } : {}),
      latitude,
      longitude,
    });
    setQuery(name);
    setSearchError(
      district
        ? `Location selected: ${name}. Coordinates and map pin updated.`
        : "Place selected. The map point and attraction name are set; add the district to match licensed guides."
    );
  };

  return (
    <div className="attraction-map-picker">
      <div className="attraction-map-search">
        <label htmlFor="attraction-place-search">Search for an attraction or landmark</label>
        <form onSubmit={searchPlaces}>
          <input
            id="attraction-place-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Brihadeeswarar Temple, Thanjavur"
            autoComplete="off"
          />
          <button className="tourism-button primary" type="submit" disabled={searching}>
            {searching ? "Searching..." : "Search places"}
          </button>
        </form>
        {searchError && (
          <p className="attraction-map-message" role="status">
            {searchError}
          </p>
        )}
        {results.length > 0 && (
          <ul className="attraction-search-results" aria-label="Place search results">
            {results.map((place) => (
              <li key={place.place_id}>
                <button type="button" onClick={() => selectPlace(place)}>
                  <strong>
                    {place.name || place.display_name?.split(",")[0] || "Unnamed place"}
                  </strong>
                  <span>{place.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="attraction-map-instructions">
        Select a search result, or click the map to set the exact meeting point.
      </div>
      <div className="attraction-map-frame">
        <MapContainer
          center={position}
          zoom={hasCoordinates ? 15 : 7}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter
            latitude={position[0]}
            longitude={position[1]}
            zoom={hasCoordinates ? 15 : 7}
          />
          <MapClickHandler onSelectPosition={onCoordinatesSelect} />
          {hasCoordinates && (
            <Marker position={position} icon={attractionMarker} />
          )}
        </MapContainer>
      </div>
      <small className="attraction-map-attribution">
        Search data © OpenStreetMap contributors · Map tiles © OpenStreetMap
      </small>
    </div>
  );
}

export default AttractionMapPicker;
