import React, { useState, useEffect } from 'react';
import { Music, User, Heart, LogOut, Play, Headphones } from 'lucide-react';

// Replace with your actual Client ID from Spotify Developer Dashboard
const CLIENT_ID = "38050f71f0d24edcb41de39261479fc9"; 
const REDIRECT_URI = "http://localhost:3000"; 

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = 'user-top-read user-read-private user-read-email';

function App() {
  const [accessToken, setAccessToken] = useState(""); 
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('medium_term');
  const [activeTab, setActiveTab] = useState('artists');

  useEffect(() => {
    // Handle Spotify callback for authentication
    const hash = window.location.hash;
    let token = window.localStorage.getItem("spotify_token");

    // If there's no token in localStorage but there's a hash in the URL (from Spotify redirect)
    if (!token && hash) {
      // Extract the access token from the URL hash
      const tokenParam = hash.substring(1).split("&").find(elem => elem.startsWith("access_token"));
      if (tokenParam) {
        token = tokenParam.split("=")[1];
        // Clear the hash from the URL to prevent issues on refresh
        window.location.hash = "";
        // Store the token in localStorage for persistence
        window.localStorage.setItem("spotify_token", token);
      }
    }

    // If a token is available (either from localStorage or just extracted from hash)
    if (token) {
      setAccessToken(token);
      setIsLoggedIn(true);
    }
  }, []);

  // Function to initiate Spotify login
  const handleLogin = () => {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
  };

  // Function to logout
  const handleLogout = () => {
    setAccessToken("");
    window.localStorage.removeItem("spotify_token");
    setIsLoggedIn(false);
    setTopArtists([]);
    setTopTracks([]);
  };

  // Get Top Artists for selected time range
  async function getTopArtists(timeRange = selectedTimeRange) {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        }
      });
      const data = await response.json();
      setTopArtists(data.items || []); 
    } catch (error) {
      console.error("Error fetching top artists:", error);
      setTopArtists([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Get Top Tracks for selected time range
  async function getTopTracks(timeRange = selectedTimeRange) {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        }
      });
      const data = await response.json();
      setTopTracks(data.items || []); 
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      setTopTracks([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Load initial data when logged in
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      if (activeTab === 'artists') {
        getTopArtists();
      } else {
        getTopTracks();
      }
    }
  }, [isLoggedIn, accessToken, selectedTimeRange, activeTab]);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-blue-500 rounded-full opacity-15 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Brian's Spotify Portfolio
            </h1>
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="flex justify-center min-h-96 items-center">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl max-w-md shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Connect Your Music</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                  Login with Spotify to explore your personal music analytics and discover your listening patterns
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Play className="w-6 h-6" />
                  Login with Spotify
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Navigation */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 mb-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Connected to Spotify</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-red-500 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('artists')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'artists' 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Top Artists
                </button>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'tracks' 
                      ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Top Songs
                </button>
              </div>

              {/* Time Range Selector */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setSelectedTimeRange('short_term')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    selectedTimeRange === 'short_term' 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Past Month
                </button>
                <button
                  onClick={() => setSelectedTimeRange('medium_term')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    selectedTimeRange === 'medium_term' 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Past 6 Months
                </button>
                <button
                  onClick={() => setSelectedTimeRange('long_term')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    selectedTimeRange === 'long_term' 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Past Year
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && <LoadingSpinner />}

            {/* Display Top Artists */}
            {activeTab === 'artists' && !isLoading && (
              <div className="mb-12">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <User className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                    Your Top Artists
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {topArtists.map((artist, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
                      <div className="relative aspect-square">
                        {artist.images[0] && (
                          <img
                            src={artist.images[0].url}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/1f2937/9ca3af?text=No+Image`; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          #{i + 1}
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2 text-center truncate">{artist.name}</h3>
                        <p className="text-sm text-gray-300 text-center truncate">
                          {artist.genres.slice(0, 2).join(', ') || 'Various Genres'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Top Tracks */}
            {activeTab === 'tracks' && !isLoading && (
              <div className="mb-12">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Heart className="w-8 h-8 text-pink-400" />
                  <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
                    Your Top Songs
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {topTracks.map((track, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group">
                      <div className="relative aspect-square">
                        {track.album.images[0] && (
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/1f2937/9ca3af?text=No+Image`; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          #{i + 1}
                        </div>
                        <button className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-110">
                          <Play className="w-5 h-5 text-white ml-1" />
                        </button>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2 text-center truncate">{track.name || 'Unknown Title'}</h3>
                        <p className="text-sm text-gray-300 text-center truncate mb-1">
                          {track.artists && track.artists.length > 0 ? track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'}
                        </p>
                        <p className="text-xs text-gray-400 text-center truncate">
                          {track.album.name || 'Unknown Album'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;