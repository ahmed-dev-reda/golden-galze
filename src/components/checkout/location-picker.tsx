"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
} from "lucide-react";

/**
 * Coordinates are used only to ask Nominatim for a readable address.
 * They are never rendered and never submitted to Supabase.
 */
export type SelectedLocation = {
  latitude: number;
  longitude: number;
  readableAddress: string;
};

type LocationPickerProps = {
  value: SelectedLocation | null;
  onChange: (value: SelectedLocation | null) => void;
  /** Optional initial map center (for example the selected governorate). */
  center?: { lat: number; lng: number } | null;
};

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
};

const DEFAULT_CENTER = { lat: 26.8206, lng: 30.8025 }; // Egypt
const MIN_REQUEST_INTERVAL_MS = 1200; // Nominatim public policy: max 1 req/sec
const searchEndpoint =
  process.env.NEXT_PUBLIC_NOMINATIM_SEARCH_URL?.trim() ||
  "https://nominatim.openstreetmap.org/search";
const reverseEndpoint =
  process.env.NEXT_PUBLIC_NOMINATIM_REVERSE_URL?.trim() ||
  "https://nominatim.openstreetmap.org/reverse";

// Shared queue keeps search + reverse requests at least one second apart.
// Small in-memory caches avoid repeating identical queries during one visit.
let requestQueue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;
const searchCache = new Map<string, NominatimResult[]>();
const reverseCache = new Map<string, string | null>();

function fetchWithRateLimit(url: string): Promise<Response> {
  const run = requestQueue.then(async () => {
    const remaining = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    lastRequestAt = Date.now();
    // The browser sends the site's Referer, identifying this application to
    // Nominatim as required by its public usage policy.
    return fetch(url, {
      headers: { Accept: "application/json" },
      referrerPolicy: "strict-origin-when-cross-origin",
    });
  });
  requestQueue = run.catch(() => undefined);
  return run;
}

function remember<K, V>(cache: Map<K, V>, key: K, value: V) {
  if (cache.size >= 30) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

const boxClass = "rounded-lg border border-line bg-white p-3 sm:p-4";
const noteClass = "text-[12px] leading-6 text-muted";

// Leaflet touches `window` at import time; load the map only on the client.
const OSMMap = dynamic(
  () => import("./osm-map").then((module) => module.OSMMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-[#f4f0ee] text-sm text-[#493a34]"
        role="status"
      >
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          جارٍ تحميل الخريطة...
        </span>
      </div>
    ),
  },
);

function geolocationMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "تم رفض إذن الوصول إلى الموقع. يمكنك تحديد الموقع بالضغط على الخريطة.";
  }
  if (error.code === error.TIMEOUT) {
    return "استغرق تحديد موقعك وقتًا طويلًا. حاول مرة أخرى أو حدد الموقع من الخريطة.";
  }
  return "تعذر تحديد موقعك حاليًا. حدد الموقع بالضغط على الخريطة بدلًا من ذلك.";
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = reverseCache.get(key);
  if (cached !== undefined) return cached;

  const url = new URL(reverseEndpoint);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ar");

  const response = await fetchWithRateLimit(url.toString());
  if (!response.ok) throw new Error("reverse_failed");
  const data: unknown = await response.json();
  const readable =
    typeof data === "object" && data !== null
      ? (data as { display_name?: unknown }).display_name
      : undefined;
  const result = typeof readable === "string" && readable.trim()
    ? readable.trim().slice(0, 500)
    : null;
  remember(reverseCache, key, result);
  return result;
}

export function LocationPicker({ value, onChange, center }: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [addressNote, setAddressNote] = useState("");
  const [focusRequest, setFocusRequest] = useState<{
    latitude: number;
    longitude: number;
    id: number;
  } | null>(null);
  const focusId = useRef(0);
  const reverseRequestId = useRef(0);

  const initialCenter = center ?? DEFAULT_CENTER;
  const initialZoom = center ? 13 : 6;

  const selectOnMap = useCallback(
    (position: { latitude: number; longitude: number }) => {
      const latitude = Number(position.latitude.toFixed(6));
      const longitude = Number(position.longitude.toFixed(6));
      const request = ++reverseRequestId.current;

      // Store only the readable text in form state; coordinates stay in React.
      onChange({ latitude, longitude, readableAddress: "" });
      setLocationError("");
      setSearchError("");
      setAddressNote("");
      setReversing(true);

      void reverseGeocode(latitude, longitude)
        .then((readable) => {
          if (request !== reverseRequestId.current) return;
          setReversing(false);
          if (readable) {
            onChange({ latitude, longitude, readableAddress: readable });
          } else {
            setAddressNote(
              "تعذر جلب عنوان الموقع من الخريطة. يمكنك إكمال الطلب بالعنوان الذي كتبته يدويًا.",
            );
          }
        })
        .catch(() => {
          if (request !== reverseRequestId.current) return;
          setReversing(false);
          setAddressNote(
            "تعذر جلب عنوان الموقع من الخريطة. يمكنك إكمال الطلب بالعنوان الذي كتبته يدويًا.",
          );
        });
    },
    [onChange],
  );

  function focusMap(latitude: number, longitude: number) {
    setFocusRequest({ latitude, longitude, id: ++focusId.current });
  }

  async function runSearch() {
    setSearchError("");
    setResults([]);

    const term = query.trim();
    if (term.length < 3) {
      setSearched(false);
      setSearchError("اكتب 3 أحرف على الأقل للبحث عن العنوان.");
      return;
    }

    const cached = searchCache.get(term);
    if (cached) {
      setSearched(true);
      setResults(cached);
      return;
    }

    setSearching(true);
    setSearched(false);
    try {
      const url = new URL(searchEndpoint);
      url.searchParams.set("q", term);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("accept-language", "ar");
      url.searchParams.set("countrycodes", "eg");
      url.searchParams.set("limit", "5");

      const response = await fetchWithRateLimit(url.toString());
      if (response.status === 429) throw new Error("rate_limited");
      if (!response.ok) throw new Error("request_failed");

      const data: unknown = await response.json();
      const parsed: NominatimResult[] = Array.isArray(data)
        ? data.filter(
            (item): item is NominatimResult =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as NominatimResult).display_name === "string" &&
              Number.isFinite(Number((item as NominatimResult).lat)) &&
              Number.isFinite(Number((item as NominatimResult).lon)),
          )
        : [];

      remember(searchCache, term, parsed);
      setSearched(true);
      setResults(parsed);
    } catch (error) {
      setSearched(true);
      setSearchError(
        error instanceof Error && error.message === "rate_limited"
          ? "تم إرسال طلبات بحث كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
          : "تعذر البحث عن العنوان الآن. تحقق من الاتصال وحاول مرة أخرى.",
      );
    } finally {
      setSearching(false);
    }
  }

  function pickResult(result: NominatimResult) {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const readable = (result.display_name ?? "").slice(0, 500);
    ++reverseRequestId.current; // cancel any in-flight reverse lookup
    setReversing(false);
    setAddressNote("");
    onChange({ latitude, longitude, readableAddress: readable });
    setQuery(readable);
    setResults([]);
    setSearchError("");
    setLocationError("");
    focusMap(latitude, longitude);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("متصفحك لا يدعم تحديد الموقع. حدد الموقع من الخريطة.");
      return;
    }

    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        selectOnMap({ latitude, longitude });
        focusMap(latitude, longitude);
      },
      (error) => {
        setLocating(false);
        setLocationError(geolocationMessage(error));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <div className={boxClass}>
      <h2 className="m-0 text-[15px] font-bold">حدد موقع التوصيل</h2>
      <p className={`mb-0 mt-1 ${noteClass}`}>
        ابحث عن عنوانك أو حدد مكان الاستلام على الخريطة، وسنضيف العنوان المقروء
        تلقائيًا إلى العنوان التفصيلي الذي تكتبه.
      </p>

      <div className="mt-3">
        <label className={`mb-1.5 block ${noteClass}`} htmlFor="address-search">
          ابحث عن عنوان أو منطقة
        </label>
        <div className="flex gap-2">
          <input
            className="min-h-11 min-w-0 flex-1 rounded-md border border-field-line bg-white px-3 py-2 text-[13px]"
            id="address-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void runSearch();
              }
            }}
            placeholder="مثال: شارع النيل، العصافرة، الإسكندرية"
            minLength={3}
            maxLength={200}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching || query.trim().length < 3}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            {searching ? "جارٍ البحث..." : "بحث"}
          </button>
        </div>
      </div>

      {searchError && (
        <p className="mt-2 text-[12px] leading-6 text-[#9b2939]" role="alert">
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <ul
          className="mt-2 max-h-48 overflow-y-auto rounded-md border border-line bg-white"
          aria-label="نتائج البحث"
        >
          {results.map((result) => (
            <li key={result.place_id ?? result.display_name}>
              <button
                type="button"
                onClick={() => pickResult(result)}
                className="flex w-full items-start gap-2 border-b border-line px-3 py-2.5 text-right text-[13px] leading-6 hover:bg-brand-light last:border-b-0"
              >
                <MapPin
                  className="mt-1 size-4 shrink-0 text-brand"
                  aria-hidden="true"
                />
                <span>{result.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searched && !searching && !searchError && results.length === 0 && (
        <p className="mt-2 text-[12px] leading-6 text-[#8a5a1f]" role="status">
          لم نعثر على نتائج. جرّب كتابة اسم الشارع أو المنطقة بشكل مختلف.
        </p>
      )}
      {results.length > 0 && (
        <p className={`mt-1 ${noteClass}`}>نتائج البحث من OpenStreetMap.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className={`m-0 ${noteClass}`}>
          اضغط على الخريطة أو اسحب المؤشر لضبط الموقع بدقة.
        </p>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          aria-label="استخدم موقعي الحالي"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-field-line bg-brand-light px-3 text-[13px] font-semibold text-brand transition-colors hover:bg-soft-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-4" aria-hidden="true" />
          )}
          {locating ? "جارٍ تحديد موقعك..." : "استخدم موقعي الحالي"}
        </button>
      </div>

      <div
        dir="ltr"
        className="mt-2 h-[300px] w-full overflow-hidden rounded-lg border border-field-line bg-[#f4f0ee] sm:h-[360px]"
      >
        <OSMMap
          value={value}
          onSelect={selectOnMap}
          center={initialCenter}
          zoom={initialZoom}
          focusRequest={focusRequest}
        />
      </div>

      <div className="mt-3 space-y-2" aria-live="polite">
        {value ? (
          <div className="rounded-md bg-brand-light p-3">
            <p className="m-0 flex items-center gap-1.5 text-[13px] font-bold text-brand">
              <MapPin className="size-4" aria-hidden="true" />
              الموقع المحدد
            </p>
            {value.readableAddress && (
              <p className="mb-0 mt-1 text-[13px] leading-6 text-[#493a34]">
                {value.readableAddress}
              </p>
            )}
            {reversing && (
              <p className={`mb-0 mt-1 ${noteClass}`}>
                جارٍ جلب عنوان الموقع...
              </p>
            )}
          </div>
        ) : (
          <p className={`m-0 ${noteClass}`}>
            يجب اختيار موقع التوصيل بالبحث عن العنوان أو بالضغط على الخريطة
            قبل تأكيد الطلب.
          </p>
        )}

        {addressNote && (
          <p className="m-0 text-[12px] leading-6 text-[#8a5a1f]" role="status">
            {addressNote}
          </p>
        )}
        {locationError && (
          <p
            className="m-0 flex items-start gap-1.5 text-[12px] leading-6 text-[#9b2939]"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}
