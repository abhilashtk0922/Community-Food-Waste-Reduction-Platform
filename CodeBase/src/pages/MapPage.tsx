import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getFoodListings } from '../lib/supabase';
import { Filter, Search, Clock, Star, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

// Set Mapbox token from env var
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

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

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [filters, setFilters] = useState({
    foodType: '',
    urgency: '',
    distance: 10, // in km
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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
  
  // Initialize map when component mounts
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.0060, 40.7128], // Default to NYC
      zoom: 12
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add user location control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
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
  
  // Add markers to map when listings or map changes
  useEffect(() => {
    if (!map.current || !mapLoaded || listings.length === 0) return;
    
    // Remove existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
    // Add new markers
    listings.forEach(listing => {
      const { latitude, longitude } = listing.location;
      
      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.innerHTML = `
        <div class="w-10 h-10 bg-white rounded-full border-2 flex items-center justify-center shadow-lg ${
          listing.urgency === 'high' 
            ? 'border-error-500' 
            : listing.urgency === 'medium' 
              ? 'border-warning-500' 
              : 'border-success-500'
        }">
          <div class="w-6 h-6 bg-${
            listing.urgency === 'high' 
              ? 'error' 
              : listing.urgency === 'medium' 
                ? 'warning' 
                : 'success'
          }-500 rounded-full"></div>
        </div>
      `;
      
      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold text-gray-800">${listing.name}</h3>
          <p class="text-sm text-gray-600">${listing.description}</p>
          <p class="text-sm mt-2"><strong>Quantity:</strong> ${listing.quantity}</p>
          <p class="text-sm"><strong>Expires:</strong> ${new Date(listing.expiration).toLocaleDateString()}</p>
          <p class="text-sm"><strong>Donor:</strong> ${listing.donor_name}</p>
          <a href="/map?listing=${listing.id}" class="block mt-2 text-center px-4 py-2 bg-primary-500 text-white rounded-md text-sm">View Details</a>
        </div>
      `);
      
      // Add marker to map
      new mapboxgl.Marker(markerEl)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [listings, mapLoaded]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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
            <div 
              ref={mapContainer} 
              className="map-container rounded-lg shadow-lg border border-gray-200"
            />
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
                    
                    <button className="mt-3 w-full py-1.5 bg-primary-50 text-primary-600 rounded text-sm font-medium hover:bg-primary-100 transition-colors">
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