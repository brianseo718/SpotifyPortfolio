import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Keep your custom App.css if you have specific styles
import { User, Heart, LogOut, Play, Headphones, ListMusic, History, Music, } from 'lucide-react'; 



// Replace with your actual Client ID from Spotify Developer Dashboard
const CLIENT_ID = "38050f71f0d24edcb41de39261479fc9"; 
const REDIRECT_URI = "http://localhost:3000"; 

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
// Expanded SCOPES for user profile, playlists, recently played, and recommendations
const SCOPES = 'user-top-read user-read-private user-read-email playlist-read-private user-read-recently-played user-library-read';

// Theme configurations - Only 'darkGreen' remains
const themes = {
  'darkGreen': {
    label: 'Dark Green',
    bg: 'from-black via-gray-950 to-gray-900',
    primaryAccent: 'green-500', // Green start for gradients
    secondaryAccent: 'blue-600', // Blue end for gradients
    tertiaryAccent: 'blue-800', // Deeper blue for background blobs
    cardBg: 'bg-gray-900/60',
    cardBorder: 'border-green-800',
    textColor: 'text-white',
    lightTextColor: 'text-gray-300',
    lighterTextColor: 'text-gray-400',
     buttonBg: 'bg-gray-800/70',
    buttonText: 'text-gray-200', // Still useful for non-gradient buttons if any
    swatchColor: 'bg-gradient-to-r from-green-500 to-blue-600', // Now green to blue
    connectedDot: 'bg-lime-400',
  },
};


function App() {
  const [accessToken, setAccessToken] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('medium_term');
  const [activeTab, setActiveTab] = useState('artists');
  const [currentTheme, setCurrentTheme] = useState('darkGreen'); // Always 'darkGreen' now

  const theme = themes[currentTheme]; // Get current theme's classes

  // Removed theme toggle function as it's no longer needed


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
  }, []); // Empty dependency array means this effect runs once on component mount

  // Function to initiate Spotify login
  const handleLogin = () => {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(SCOPES)}`;
  };

  // Function to logout
  const handleLogout = () => {
    setAccessToken("");
    window.localStorage.removeItem("spotify_token");
    setIsLoggedIn(false);
    setUserProfile(null);
    setUserPlaylists([]);
    setTopArtists([]);
    setTopTracks([]);
    setRecentlyPlayed([]);
    setTopGenres([]); // Clear top genres on logout
    setActiveTab('artists'); // Reset to artists tab on logout
  };

  // Generic fetch function for Spotify API calls
  const spotifyFetch = async (url) => {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return null;
    }
    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        }
      });
      if (response.status === 401) {
        console.error("Access token expired or invalid. Please log in again.");
        handleLogout(); // Force logout to prompt re-authentication
        return null;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get User Profile
  async function getUserProfile() {
    const data = await spotifyFetch('https://api.spotify.com/v1/me');
    if (data) {
      setUserProfile(data);
    } else {
      setUserProfile(null);
    }
  }

  // Get User Playlists
  async function getUserPlaylists() {
    const data = await spotifyFetch('https://api.spotify.com/v1/me/playlists?limit=20'); // Fetch up to 20 playlists
    if (data) {
      setUserPlaylists(data.items || []);
    } else {
      setUserPlaylists([]);
    }
  }

  // Get Top Artists for selected time range
  async function getTopArtists(timeRange = selectedTimeRange) {
    const data = await spotifyFetch(`https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`);
    if (data) {
      setTopArtists(data.items || []);
      return data.items; // Return artists to be used for genre calculation
    } else {
      setTopArtists([]);
      return [];
    }
  }

  // Get Top Tracks for selected time range
  async function getTopTracks(timeRange = selectedTimeRange) {
    const data = await spotifyFetch(`https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=${timeRange}`);
    if (data) {
      setTopTracks(data.items || []);
    } else {
      setTopTracks([]);
    }
  }

  // Get Recently Played Tracks
  async function getRecentlyPlayed() {
    const data = await spotifyFetch('https://api.spotify.com/v1/me/player/recently-played?limit=20');
    if (data) {
      setRecentlyPlayed(data.items || []);
    } else {
      setRecentlyPlayed([]);
    }
  }

  // Get Top Genres (inferred from top artists)
  async function getTopGenres(timeRange = selectedTimeRange) {
    setIsLoading(true);
    const artists = await getTopArtists(timeRange); // Re-use getTopArtists to fetch data
    if (artists && artists.length > 0) {
      const genreCounts = {};
      artists.forEach(artist => {
        artist.genres.forEach(genre => {
          // Normalize genre names (e.g., lowercase, trim)
          const normalizedGenre = genre.toLowerCase().replace(/\s+/g, ' ').trim();
          genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
        });
      });

      // Convert to array and sort by count
      const sortedGenres = Object.entries(genreCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count })); // Capitalize first letter

      setTopGenres(sortedGenres);
    } else {
      setTopGenres([]);
    }
    setIsLoading(false);
  }

  // Load data based on active tab when logged in
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      // Always fetch user profile when logged in
      getUserProfile();

      switch (activeTab) {
        case 'playlists':
          getUserPlaylists();
          break;
        case 'artists':
          getTopArtists(selectedTimeRange);
          break;
        case 'tracks':
          getTopTracks(selectedTimeRange);
          break;
        case 'recentlyPlayed':
          getRecentlyPlayed();
          break;
        case 'genres':
          getTopGenres(selectedTimeRange);
          break;
        default:
          getTopArtists(selectedTimeRange);
          break;
      }
    }
  }, [isLoggedIn, accessToken, activeTab, selectedTimeRange]);

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <div className={`w-8 h-8 border-4 border-${theme.primaryAccent} border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} ${theme.textColor} relative overflow-hidden`}>
      {/* Animated background elements for a modern touch */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Larger, slower moving green blob */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-${theme.primaryAccent} rounded-full opacity-10 blur-3xl animate-blob-one`}></div>
        {/* Medium, faster moving green blob */}
        <div className={`absolute top-3/4 right-1/4 w-72 h-72 bg-${theme.secondaryAccent} rounded-full opacity-15 blur-3xl animate-blob-two`}></div>
        {/* Smaller, slightly offset green blob */}
        <div className={`absolute bottom-1/4 left-1/3 w-64 h-64 bg-${theme.tertiaryAccent} rounded-full opacity-12 blur-3xl animate-blob-three`}></div>
        {/* Additional pulsating green circles */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-${theme.primaryAccent} rounded-full opacity-5 animate-pulse-slow`}></div>
        <div className={`absolute top-1/3 right-1/4 w-32 h-32 bg-${theme.secondaryAccent} rounded-full opacity-7 animate-pulse-fast`}></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Conditional Header: User Profile or Connect Music */}
        {!isLoggedIn ? (
          <div className="flex justify-center min-h-96 items-center">
            <div className={`bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} p-8 rounded-3xl max-w-md shadow-2xl`}>
              <div className="text-center">
                <div className={`w-20 h-20 bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Connect Your Music</h2>
                <p className={`${theme.lightTextColor} mb-8 leading-relaxed`}>
                  Login with Spotify to explore your personal music analytics and discover your listening patterns
                </p>
                <button
                  onClick={handleLogin}
                  className={`w-full bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white font-semibold py-3 px-6 rounded-xl hover:from-${theme.primaryAccent}/80 hover:to-${theme.secondaryAccent}/80 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
                >
                  <Play className="w-6 h-6" />
                  Login with Spotify
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Bar: User Profile, Status, and Logout Button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-3xl shadow-2xl">
              {userProfile && (
                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                  {userProfile.images && userProfile.images.length > 0 ? (
                    <img
                      src={userProfile.images[0].url}
                      alt={userProfile.display_name || 'User Profile'}
                      className={`w-16 h-16 rounded-full object-cover border-2 border-${theme.primaryAccent} shadow-md`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-3xl font-bold border-2 border-${theme.primaryAccent} shadow-md`}>
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  {/* Added min-w-0 to prevent text cutoff in flex container */}
                  <div className="text-center md:text-left min-w-0">
                    {/* Updated gradient to match "Your Top Artists" heading */}
                    <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent overflow-hidden whitespace-nowrap text-ellipsis`}>
                      {userProfile.display_name || 'Spotify User'}
                    </h1>
                    {userProfile.external_urls && userProfile.external_urls.spotify && (
                      <a
                        href={userProfile.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-sm ${theme.lightTextColor} hover:text-${theme.primaryAccent} transition-colors duration-200 mt-1`}
                      >
                        View on Spotify <Play className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-end mt-4 md:mt-0">
                {/* Connected Status */}
                <div className={`flex items-center gap-2 ${theme.buttonBg} ${theme.lightTextColor} font-medium py-2 px-4 rounded-full border ${theme.cardBorder} shadow-md`}>
                  <div className={`w-3 h-3 ${theme.connectedDot} rounded-full animate-pulse`}></div>
                  <span>Connected</span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold py-2 px-4 rounded-xl hover:from-red-500 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className={`bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-3xl p-8 mb-8 shadow-2xl`}>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <button
                  onClick={() => setActiveTab('artists')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'artists'
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                  }`}
                >
                  <User className="w-5 h-5" />
                  Top Artists
                </button>
                <button
                  onClick={() => setActiveTab('tracks')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'tracks'
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Top Songs
                </button>
                <button
                  onClick={() => setActiveTab('genres')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'genres'
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                  }`}
                >
                  <Music className="w-5 h-5" />
                  Top Genres
                </button>
                <button
                  onClick={() => setActiveTab('recentlyPlayed')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'recentlyPlayed'
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                  }`}
                >
                  <History className="w-5 h-5" />
                  Recently Played
                </button>
                <button
                  onClick={() => setActiveTab('playlists')}
                  className={`font-semibold py-2 px-6 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    activeTab === 'playlists'
                      ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                      : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                  }`}
                >
                  <ListMusic className="w-5 h-5" />
                  Playlists
                </button>
              </div>

              {/* Time Range Selector (only for artists/tracks/genres tabs) */}
              {(activeTab === 'artists' || activeTab === 'tracks' || activeTab === 'genres') && (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <button
                    onClick={() => setSelectedTimeRange('short_term')}
                    className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      selectedTimeRange === 'short_term'
                        ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                        : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                    }`}
                  >
                    Past Month
                  </button>
                  <button
                    onClick={() => setSelectedTimeRange('medium_term')}
                    className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      selectedTimeRange === 'medium_term'
                        ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                        : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                    }`}
                  >
                    Past 6 Months
                  </button>
                  <button
                    onClick={() => setSelectedTimeRange('long_term')}
                    className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                      selectedTimeRange === 'long_term'
                        ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                        : `${theme.buttonBg} ${theme.buttonText} ${theme.buttonHoverBg}`
                    }`}
                  >
                    Past Year
                  </button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading && <LoadingSpinner />}

            {/* Content Display Area */}
            {!isLoading && (
              <>
                {/* Display User Playlists */}
                {activeTab === 'playlists' && userPlaylists.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <ListMusic className={`w-8 h-8 text-${theme.primaryAccent}`} />
                      <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
                        Your Playlists
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {userPlaylists.map((playlist, i) => (
                        <a
                          key={i}
                          href={playlist.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group block`}
                        >
                          <div className="relative aspect-square">
                            {playlist.images && playlist.images.length > 0 ? (
                              <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/1f2937/9ca3af?text=No+Image`; }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-6xl">
                                <ListMusic className="w-16 h-16" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <button className={`absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-110`}>
                              <Play className="w-5 h-5 text-white ml-1" />
                            </button>
                          </div>
                          <div className="p-6">
                            <h3 className={`text-lg font-semibold mb-2 text-center truncate ${theme.textColor}`}>{playlist.name || 'Unknown Playlist'}</h3>
                            <p className={`text-sm ${theme.lightTextColor} text-center truncate`}>{playlist.owner.display_name || 'Unknown Owner'}</p>
                            <p className={`text-xs ${theme.lighterTextColor} text-center`}>{playlist.tracks.total} songs</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'playlists' && userPlaylists.length === 0 && !isLoading && (
                  <div className={`text-center ${theme.lighterTextColor} py-8`}>No playlists found or available.</div>
                )}

                {/* Display Top Artists */}
                {activeTab === 'artists' && topArtists.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <User className={`w-8 h-8 text-${theme.primaryAccent}`} />
                      <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
                        Your Top Artists
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {topArtists.map((artist, i) => (
                        <a
                          key={i}
                          href={artist.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group block`}
                        >
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
                            <div className={`absolute top-4 right-4 bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white text-sm font-bold px-3 py-1 rounded-full`}>
                              #{i + 1}
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className={`text-lg font-semibold mb-2 text-center truncate ${theme.textColor}`}>{artist.name}</h3>
                            <p className={`text-sm ${theme.lightTextColor} text-center truncate`}>
                              {artist.genres.slice(0, 2).join(', ') || 'Various Genres'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'artists' && topArtists.length === 0 && !isLoading && (
                  <div className={`text-center ${theme.lighterTextColor} py-8`}>No top artists found for this time range.</div>
                )}

                {/* Display Top Tracks */}
                {activeTab === 'tracks' && topTracks.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <Heart className={`w-8 h-8 text-${theme.primaryAccent}`} />
                      <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
                        Your Top Songs
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {topTracks.map((track, i) => (
                        <a
                          key={i}
                          href={track.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group block`}
                        >
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
                            <button className={`absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-110`}>
                              <Play className="w-5 h-5 text-white ml-1" />
                            </button>
                          </div>
                          <div className="p-6">
                            <h3 className={`text-lg font-semibold mb-2 text-center truncate ${theme.textColor}`}>{track.name || 'Unknown Title'}</h3>
                            <p className={`text-sm ${theme.lightTextColor} text-center truncate mb-1`}>
                              Artist: {track.artists && track.artists.length > 0 ? track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'}
                            </p>
                            <p className={`text-xs ${theme.lighterTextColor} text-center truncate`}>
                              Album: {track.album.name || 'Unknown Album'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'tracks' && topTracks.length === 0 && !isLoading && (
                  <div className={`text-center ${theme.lighterTextColor} py-8`}>No top tracks found for this time range.</div>
                )}

                {/* Display Top Genres */}
                {activeTab === 'genres' && topGenres.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <Music className={`w-8 h-8 text-${theme.primaryAccent}`} />
                      <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
                        Your Top Genres
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {topGenres.map((genre, i) => (
                        <div
                          key={i}
                          className={`${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-xl p-6 shadow-lg flex flex-col items-center justify-center text-center`}
                        >
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} flex items-center justify-center mb-4 text-white text-2xl font-bold`}>
                            #{i + 1}
                          </div>
                          <h3 className={`text-lg font-semibold mb-1 ${theme.textColor}`}>{genre.name}</h3>
                          <p className={`text-sm ${theme.lightTextColor}`}>{genre.count} Top Artists</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'genres' && topGenres.length === 0 && !isLoading && (
                  <div className={`text-center ${theme.lighterTextColor} py-8`}>No top genres found for this time range (based on your top artists).</div>
                )}


                {/* Display Recently Played Tracks */}
                {activeTab === 'recentlyPlayed' && recentlyPlayed.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-center gap-4 mb-8">
                      <History className={`w-8 h-8 text-${theme.primaryAccent}`} />
                      <h2 className={`text-2xl md:text-4xl font-bold bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} bg-clip-text text-transparent`}>
                        Recently Played
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {recentlyPlayed.map((item, i) => (
                        <a
                          key={i}
                          href={item.track.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-xl overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 group block`}
                        >
                          <div className="relative aspect-square">
                            {item.track.album.images[0] && (
                              <img
                                src={item.track.album.images[0].url}
                                alt={item.track.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/1f2937/9ca3af?text=No+Image`; }}
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <button className={`absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:shadow-xl transform hover:scale-110`}>
                              <Play className="w-5 h-5 text-white ml-1" />
                            </button>
                          </div>
                          <div className="p-6">
                            <h3 className={`text-lg font-semibold mb-2 text-center truncate ${theme.textColor}`}>{item.track.name || 'Unknown Title'}</h3>
                            <p className={`text-sm ${theme.lightTextColor} text-center truncate mb-1`}>
                              Artist: {item.track.artists && item.track.artists.length > 0 ? item.track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'}
                            </p>
                            <p className={`text-xs ${theme.lighterTextColor} text-center truncate`}>
                              Album: {item.track.album.name || 'Unknown Album'}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'recentlyPlayed' && recentlyPlayed.length === 0 && !isLoading && (
                  <div className={`text-center ${theme.lighterTextColor} py-8`}>No recently played tracks found.</div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;