/// <reference types="google.maps" />
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

async function fetchGoogleMapsApiKey() {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-maps-config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({}),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.apiKey) {
    throw new Error(data?.error || "Google Maps config unavailable");
  }

  return data.apiKey as string;
}

export function GooglePlacesAutocomplete({ value, onChange, placeholder, className }: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(Boolean(window.google?.maps?.places));
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);

  const scriptSrc = useMemo(() => {
    if (!apiKey) return "";
    return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=it&v=weekly`;
  }, [apiKey]);

  const showMap = useCallback((location: LatLng) => {
    setSelectedLocation(location);

    setTimeout(() => {
      if (!mapRef.current || !window.google?.maps) return;

      const latLng = new google.maps.LatLng(location.lat, location.lng);

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: latLng,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "cooperative",
        });
      } else {
        mapInstanceRef.current.setCenter(latLng);
        mapInstanceRef.current.setZoom(16);
      }

      if (markerRef.current) {
        markerRef.current.setPosition(latLng);
      } else {
        markerRef.current = new google.maps.Marker({
          position: latLng,
          map: mapInstanceRef.current,
          animation: google.maps.Animation.DROP,
        });
      }
    }, 50);
  }, []);

  useEffect(() => {
    let active = true;
    const loadConfig = async () => {
      try {
        const key = await fetchGoogleMapsApiKey();
        if (!active) return;
        setApiKey(key);
      } catch (error) {
        if (!active) return;
        console.error("Google Maps config unavailable", error);
      }
    };
    loadConfig();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!scriptSrc) return;

    if (window.google?.maps?.places) {
      setScriptLoaded(true);
      setLoading(false);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    const mustReplaceExisting = Boolean(existingScript && (existingScript.src !== scriptSrc || existingScript.dataset.failed === "true"));

    if (mustReplaceExisting && existingScript) {
      existingScript.remove();
    }

    const reusableScript = !mustReplaceExisting
      ? document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null
      : null;

    const handleLoad = () => {
      const currentScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
      if (currentScript) {
        currentScript.dataset.loaded = "true";
        currentScript.dataset.failed = "false";
      }
      setScriptLoaded(Boolean(window.google?.maps?.places));
      setLoading(false);
    };

    const handleError = () => {
      const currentScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
      if (currentScript) currentScript.dataset.failed = "true";
      console.error("Failed to load Google Maps script");
      setLoading(false);
    };

    if (reusableScript) {
      if (reusableScript.dataset.loaded === "true" && window.google?.maps?.places) {
        setScriptLoaded(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      reusableScript.addEventListener("load", handleLoad);
      reusableScript.addEventListener("error", handleError);
      return () => {
        reusableScript.removeEventListener("load", handleLoad);
        reusableScript.removeEventListener("error", handleError);
      };
    }

    setLoading(true);
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.dataset.loaded = "false";
    script.dataset.failed = "false";
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [scriptSrc]);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || autocompleteRef.current || !window.google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "address_components", "geometry", "name"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
      if (place?.geometry?.location) {
        showMap({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    autocompleteRef.current = autocomplete;

    return () => {
      autocompleteRef.current = null;
    };
  }, [scriptLoaded, onChange, showMap]);

  useEffect(() => {
    return () => {
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground/50" />
        ) : (
          <MapPin className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground/50" />
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!e.target.value) {
              setSelectedLocation(null);
            }
          }}
          placeholder={placeholder}
          autoFocus
          autoComplete="street-address"
          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-12 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className || ""}`}
        />
      </div>

      {selectedLocation && (
        <div
          ref={mapRef}
          className="w-full h-44 rounded-xl border border-border overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
        />
      )}
    </div>
  );
}
