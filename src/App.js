import React, { useState, useEffect } from 'react';
import './App.css';

// Replace with your actual Client ID from Spotify Developer Dashboard
const CLIENT_ID = "38050f71f0d24edcb41de39261479fc9"; 
const CLIENT_SECRET = "373082b87067489b9c0463233523f5fc"; 
const REDIRECT_URI = "http://localhost:3000"; 

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = 'user-top-read user-read-private user-read-email';

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState(""); 
  const [albums, setAlbums] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showTopContent, setShowTopContent] = useState(false); // State to control visibility of top content

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
    setTopArtists([]);
    setTopTracks([]);
    setAlbums([]);
    setShowTopContent(false);
  };

  // Search for artists and their albums
  async function search() {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return;
    }
    console.log("Searching for " + searchInput);

    try {
      // Get artist ID
      const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${searchInput}&type=artist&limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        }
      });
      const artistData = await artistResponse.json();
      const artistID = artistData.artists.items[0]?.id;

      if (artistID) {
        // Get albums from artist
        const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
          }
        });
        const albumsData = await albumsResponse.json();
        // Ensure albumsData.items is an array, default to empty array if undefined
        setAlbums(albumsData.items || []); 
        setShowTopContent(false); // Hide top content when searching
      } else {
        setAlbums([]); // Clear albums if no artist found
        console.log("No artist found for your search.");
      }
    } catch (error) {
      console.error("Error during artist/album search:", error);
      setAlbums([]); // Ensure albums are cleared on error
    }
  }

  // Get Top Artists
  async function getTopArtists() {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', { // Fetch top 10 artists
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        }
      });
      const data = await response.json();
      // Ensure data.items is an array, default to empty array if undefined
      setTopArtists(data.items || []); 
      setTopTracks([]); // Clear top tracks when showing artists
      setAlbums([]); // Clear albums when showing artists
      setShowTopContent(true); // Show the top content section
    } catch (error) {
      console.error("Error fetching top artists:", error);
      setTopArtists([]); // Ensure artists are cleared on error
    }
  }

  // Get Top Tracks
  async function getTopTracks() {
    if (!accessToken) {
      console.error("No access token available. Please log in.");
      return;
    }

    try {
      const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', { // Fetch top 10 tracks
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        }
      });
      const data = await response.json();
      // Ensure data.items is an array, default to empty array if undefined
      setTopTracks(data.items || []); 
      setTopArtists([]); // Clear top artists when showing tracks
      setAlbums([]); // Clear albums when showing tracks
      setShowTopContent(true); // Show the top content section
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      setTopTracks([]); // Ensure tracks are cleared on error
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-4">
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-4xl font-bold mb-6 text-center text-green-400">Spotify Stats Tracker</h1>
        
        {!isLoggedIn ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out"
            >
              Login with Spotify
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Logout
              </button>
            </div>

            <div className="mb-6 flex max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search for Artist"
                value={searchInput}
                onKeyUp={event => {
                  if (event.key === "Enter") {
                    search();
                  }
                }}
                onChange={event => setSearchInput(event.target.value)}
                className="flex-1 rounded-l-full py-3 px-4 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={search}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-r-full shadow-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Search
              </button>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={getTopArtists}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Get My Top Artists
              </button>
              <button
                onClick={getTopTracks}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Get My Top Songs
              </button>
            </div>

            {/* Display Top Artists */}
            {showTopContent && topArtists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-blue-300">Your Top Artists</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                  {topArtists.map((artist, i) => (
                    <div key={i} className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden">
                      {artist.images[0] && (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-1 text-center">{artist.name}</h3>
                        <p className="text-sm text-gray-300 text-center">{artist.genres.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Top Tracks */}
            {showTopContent && topTracks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-purple-300">Your Top Songs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                  {topTracks.map((track, i) => (
                    <div key={i} className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                      {track.album.images[0] && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <div className="p-4 flex-grow bg-gray-700 min-h-[100px] flex flex-col justify-between">
                        <h3 className="text-lg font-semibold mb-1 text-center leading-tight">{track.name || 'Unknown Title'}</h3>
                        <p className="text-sm text-gray-300 text-center leading-tight">
                          Artist: {track.artists && track.artists.length > 0 ? track.artists.map(artist => artist.name).join(', ') : 'Unknown Artist'}
                        </p>
                        <p className="text-xs text-gray-400 text-center leading-tight">
                          Album: {track.album.name || 'Unknown Album'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display Searched Albums */}
            {albums.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-green-300">Artist Albums</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                  {albums.map((album, i) => (
                    <div key={i} className="bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden">
                      {album.images[0] && (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-xl font-semibold mb-2 text-center">{album.name}</h3>
                        <p className="text-sm text-gray-400 text-center">{album.release_date}</p>
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
