import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Filter, Search, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Food listing type
interface FoodListing {
  id: string;
  name: string;
  description: string;
  quantity: string;
  expiration: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  food_type: string;
  donor_id: string;
  donor_name: string;
  created_at: string;
  urgency: 'low' | 'medium' | 'high';
}

const defaultCenter: [number, number] = [40.7128, -74.0060];

// Component to handle map view changes
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  
  return null;
};

const MapPage: React.FC = () => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [filters, setFilters] = useState({
    foodType: '',
    urgency: '',
    distance: 10, // in km
  });
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapReady, setMapReady] = useState(false);

  // Mock data for food listings
  const mockListings: FoodListing[] = [
    {
      id: '1',
      name: 'Fresh Bread',
      description: 'Day-old artisan bread from local bakery',
      quantity: '12 loaves',
      expiration: '2025-05-21',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St, New York, NY'
      },
      food_type: 'Bakery',
      donor_id: 'user1',
      donor_name: 'Downtown Bakery',
      created_at: '2025-05-20T08:00:00Z',
      urgency: 'medium'
    },
    {
      id: '2',
      name: 'Organic Vegetables',
      description: 'Mixed vegetables from farmers market',
      quantity: '5 kg',
      expiration: '2025-05-22',
      location: {
        latitude: 40.7200,
        longitude: -73.9950,
        address: '45 Green Ave, Brooklyn, NY'
      },
      food_type: 'Produce',
      donor_id: 'user2',
      donor_name: 'Green Earth Market',
      created_at: '2025-05-20T10:30:00Z',
      urgency: 'high'
    },
    {
      id: '3',
      name: 'Canned Goods',
      description: 'Assorted canned vegetables and soups',
      quantity: '24 cans',
      expiration: '2025-08-15',
      location: {
        latitude: 40.7300,
        longitude: -74.0100,
        address: '78 West St, Jersey City, NJ'
      },
      food_type: 'Canned',
      donor_id: 'user3',
      donor_name: 'Community Pantry',
      created_at: '2025-05-19T14:15:00Z',
      urgency: 'low'
    }
  ];

  // Load food listings data
  useEffect(() => {
    // In a real app, this would fetch from Supabase
    // const loadListings = async () => {
    //   const { data, error } = await getFoodListings(filters);
    //   if (!error && data) {
    //     setListings(data);
    //   }
    // };
    // loadListings();
    
    // Using mock data for now
    setListings(mockListings);
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getMarkerColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f97316'; // orange
      case 'low':
        return '#22c55e'; // green
      default:
        return '#3b82f6'; // blue
    }
  };

  const createCustomIcon = (urgency: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${getMarkerColor(urgency)};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const handleListingClick = (listing: FoodListing) => {
    setSelectedListing(listing);
    setMapCenter([listing.location.latitude, listing.location.longitude]);
  };

  return (
    <section className="min-h-screen pt-20 pb-16">
      <div className="container-custom">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Food Sharing Map</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover food donations available in your area. Use the filters to find what you need.
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search bar */}
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search for food or location..." 
              className="pl-10 w-full input-field"
            />
          </div>
          
          {/* Filter button */}
          <button 
            className="btn-outline py-2 flex items-center"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </button>
        </div>
        
        {/* Filters panel */}
        <motion.div
          className="bg-white rounded-lg shadow-md p-4 mb-6"
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isFilterOpen ? 'auto' : 0,
            opacity: isFilterOpen ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          style={{ overflow: 'hidden' }}
        >
          {isFilterOpen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Type
                </label>
                <select 
                  name="foodType"
                  value={filters.foodType}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  <option value="">All Types</option>
                  <option value="Produce">Produce</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Canned">Canned Goods</option>
                  <option value="Prepared">Prepared Meals</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select 
                  name="urgency"
                  value={filters.urgency}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  <option value="">Any Urgency</option>
                  <option value="high">High (Expires Soon)</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance
                </label>
                <select 
                  name="distance"
                  value={filters.distance}
                  onChange={handleFilterChange as any}
                  className="input-field"
                >
                  <option value={2}>Within 2 km</option>
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km</option>
                  <option value={50}>Within 50 km</option>
                </select>
              </div>
            </div>
          )}
        </motion.div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Map */}
          <div className="lg:w-3/4">
            <div className="map-container rounded-lg shadow-lg border border-gray-200" style={{ height: '70vh' }}>
              {mapReady ? (
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                  whenReady={() => setMapReady(true)}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapController center={mapCenter} />
                  {listings.map((listing) => (
                    <Marker
                      key={listing.id}
                      position={[listing.location.latitude, listing.location.longitude]}
                      icon={createCustomIcon(listing.urgency)}
                      eventHandlers={{
                        click: () => handleListingClick(listing),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-gray-800">{listing.name}</h3>
                          <p className="text-sm text-gray-600">{listing.description}</p>
                          <p className="text-sm mt-2"><strong>Quantity:</strong> {listing.quantity}</p>
                          <p className="text-sm"><strong>Expires:</strong> {new Date(listing.expiration).toLocaleDateString()}</p>
                          <p className="text-sm"><strong>Donor:</strong> {listing.donor_name}</p>
                          <a href={`/map?listing=${listing.id}`} className="block mt-2 text-center px-4 py-2 bg-primary-500 text-white rounded-md text-sm">
                            View Details
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Listings sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 text-primary-500 mr-2" />
                Nearby Listings
              </h2>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {listings.map(listing => (
                  <div 
                    key={listing.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{listing.name}</h3>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        listing.urgency === 'high' 
                          ? 'bg-error-100 text-error-700' 
                          : listing.urgency === 'medium' 
                            ? 'bg-warning-100 text-warning-700' 
                            : 'bg-success-100 text-success-700'
                      }`}>
                        {listing.urgency.charAt(0).toUpperCase() + listing.urgency.slice(1)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{listing.description}</p>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Expires: {new Date(listing.expiration).toLocaleDateString()}
                    </div>
                    
                    <button 
                      className="mt-3 w-full py-1.5 bg-primary-50 text-primary-600 rounded text-sm font-medium hover:bg-primary-100 transition-colors"
                      onClick={() => handleListingClick(listing)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPage;