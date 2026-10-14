import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import { postal_locations } from '../api/apiUrls';
import { getRequest } from '../api/request';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface Store {
  id: number;
  name: string;
  lat: number;
  lng: number;
  index: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface LocationSelectorProps {
  onSelectStore: (store: Store) => void;
  onClose: () => void;
}

interface ClusterPoint {
  lat: number;
  lng: number;
  count: number;
  stores: Store[];
  id: string;
}

export default function LocationSelector({ onSelectStore, onClose }: LocationSelectorProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [, setClusters] = useState<ClusterPoint[]>([]);
  const [currentZoom, setCurrentZoom] = useState(6);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreForConfirm, setSelectedStoreForConfirm] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostalLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getRequest(postal_locations);
        
        // Response to'g'ridan-to'g'ri array kelayotgani uchun
        if (Array.isArray(response)) {
          const validStores = response.filter(store => {
            try {
              return store &&
                typeof store.lat === 'number' &&
                typeof store.lng === 'number' &&
                store.lat >= -90 && store.lat <= 90 &&
                store.lng >= -180 && store.lng <= 180 &&
                typeof store.name === 'string' &&
                typeof store.index === 'string' &&
                store.name.trim() !== '';
            } catch {
              console.error('Invalid store data:', store);
              return false;
            }
          });
          setAllStores(validStores);
          setFilteredStores(validStores);
        } else {
          console.error('Invalid data structure:', response);
          throw new Error('Invalid data format received');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching postal locations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostalLocations();
  }, []);

  useEffect(() => {
    const filtered = allStores.filter(store =>
      store && store.name && store.index &&
      (store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.index.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredStores(filtered);
  }, [searchQuery, allStores]);

  const createClusters = (storesList: Store[], zoom: number) => {
    // Zoom darajasiga qarab cluster radiusini o'zgartirish
    const clusterRadius = zoom < 8 ? 2 : // Katta masshtabda
                         zoom < 12 ? 0.5 : // O'rta masshtabda
                         zoom < 14 ? 0.1 : // Kichik masshtabda
                         0.01; // Juda yaqin masshtabda
    const clustered: ClusterPoint[] = [];
    const processed = new Set<string>();

    storesList.forEach(store => {
      if (!store || !store.lat || !store.lng || processed.has(String(store.id))) return;

      const nearby = storesList.filter(s => {
        if (!s || !s.lat || !s.lng || processed.has(String(s.id))) return false;
        const distance = Math.sqrt(
          Math.pow(s.lat - store.lat, 2) +
          Math.pow(s.lng - store.lng, 2)
        );
        return distance < clusterRadius;
      });

      nearby.forEach(s => processed.add(String(s.id)));

      const avgLat = nearby.reduce((sum, s) => sum + s.lat, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, s) => sum + s.lng, 0) / nearby.length;

      clustered.push({
        lat: avgLat,
        lng: avgLng,
        count: nearby.length,
        stores: nearby,
        id: nearby.map(s => s.id).join('-')
      });
    });

    return clustered;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([41.77, 60.91], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);

    mapRef.current.on('zoomend', () => {
      if (mapRef.current) {
        const zoom = mapRef.current.getZoom();
        setCurrentZoom(zoom);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const validStores = filteredStores.filter(store => store && store.lat && store.lng);
    const newClusters = createClusters(validStores, currentZoom);
    setClusters(newClusters);

    newClusters.forEach(cluster => {
      if (!mapRef.current) return;

      const isCluster = cluster.count > 1;

      if (isCluster) {
        const icon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `<div style="
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border-radius: 50%;
            width: ${Math.min(60, 30 + cluster.count * 2)}px;
            height: ${Math.min(60, 30 + cluster.count * 2)}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${cluster.count > 99 ? '12px' : '16px'};
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
          ">${cluster.count}</div>`,
          iconSize: [Math.min(60, 30 + cluster.count * 2), Math.min(60, 30 + cluster.count * 2)],
        });

        const marker = L.marker([cluster.lat, cluster.lng], { icon }).addTo(mapRef.current);

        marker.on('click', () => {
          if (mapRef.current) {
            const newZoom = Math.min(currentZoom + 2, 16);
            mapRef.current.setView([cluster.lat, cluster.lng], newZoom, { animate: true });
          }
        });

        markersRef.current.push(marker);
      } else {
        const store = cluster.stores[0];
        const icon = L.divIcon({
          className: 'custom-marker-icon',
          html: `<div style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
          ">1</div>`,
          iconSize: [40, 40],
        });

        const marker = L.marker([store.lat, store.lng], { icon }).addTo(mapRef.current);

        marker.on('click', () => {
          setSelectedStoreForConfirm(store);
        });

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${store.name}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Indeks: ${store.index}</p>
          </div>
        `;
        marker.bindPopup(popupContent);

        markersRef.current.push(marker);
      }
    });
  }, [filteredStores, currentZoom, onSelectStore]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className="p-4 text-red-500 text-center">
            {error}
          </div>
        )}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Выберите пункт выдачи</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Введите улицу или район"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">На карте или из списка</p>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredStores.map((store) => (
            <button
              key={store.id}
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.setView([store.lat, store.lng], 16, { animate: true });
                  const marker = markersRef.current.find(m => {
                    const latLng = m.getLatLng();
                    return Math.abs(latLng.lat - store.lat) < 0.0001 &&
                           Math.abs(latLng.lng - store.lng) < 0.0001;
                  });
                  if (marker) {
                    marker.openPopup();
                  }
                  setSelectedStoreForConfirm(store);
                }
              }}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-sm mb-1">{store.name}</h3>
              <p className="text-xs text-gray-500">Indeks: {store.index}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedStoreForConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100000] flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Manzilni tasdiqlash</h3>
            <p className="text-gray-600 mb-4">{selectedStoreForConfirm.name}</p>
            <p className="text-gray-600 mb-6">Indeks: {selectedStoreForConfirm.index}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedStoreForConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  // Local Storage'ga saqlash
                  localStorage.setItem('selectedStore', JSON.stringify(selectedStoreForConfirm));
                  onSelectStore(selectedStoreForConfirm);
                  setSelectedStoreForConfirm(null);
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X size={24} />
        </button>
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
