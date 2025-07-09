import React, { useState, useEffect } from 'react';
import { Container, InputGroup, FormControl, Button, Row, Card } from 'react-bootstrap';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Replace with your actual Client ID from Spotify Developer Dashboard
const CLIENT_ID = "38050f71f0d24edcb41de39261479fc9";
// In a real application, CLIENT_SECRET should NOT be exposed in client-side code.
// For demonstration purposes, it's included here as it was in your original code.
// For production, you'd use a backend to handle client_secret and token exchange.
const CLIENT_SECRET = "373082b87067489b9c0463233523f5fc"; 
const REDIRECT_URI = "http://localhost:3000"; // Your redirect URI
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = 'user-top-read user-read-private user-read-email'; // Added more scopes for top tracks/artists

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

    if (!token && hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
      window.location.hash = "";
      window.localStorage.setItem("spotify_token", token);
    }

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
        setAlbums(albumsData.items);
      } else {
        setAlbums([]); // Clear albums if no artist found
        console.log("No artist found for your search.");
      }
    } catch (error) {
      console.error("Error during artist/album search:", error);
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
      setTopArtists(data.items);
      setShowTopContent(true); // Show the top content section
    } catch (error) {
      console.error("Error fetching top artists:", error);
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
      setTopTracks(data.items);
      setShowTopContent(true); // Show the top content section
    } catch (error) {
      console.error("Error fetching top tracks:", error);
    }
  }

  return (
    <div className="App bg-gray-900 min-h-screen text-white font-inter p-4">
      <Container className="my-4">
        <h1 className="text-4xl font-bold mb-6 text-center text-green-400">Spotify Stats Tracker</h1>
        {!isLoggedIn ? (
          <div className="flex justify-center">
            <Button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out"
            >
              Login with Spotify
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Logout
              </Button>
            </div>

            <InputGroup className="mb-6" size="lg">
              <FormControl
                placeholder="Search for Artist"
                type="input"
                onKeyUp={event => {
                  if (event.key === "Enter") {
                    search();
                  }
                }}
                onChange={event => setSearchInput(event.target.value)}
                className="rounded-l-full py-3 px-4 bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-green-500"
              />
              <Button
                onClick={search}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-r-full shadow-md transition duration-300 ease-in-out"
              >
                Search
              </Button>
            </InputGroup>

            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={getTopArtists}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Get My Top Artists
              </Button>
              <Button
                onClick={getTopTracks}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out"
              >
                Get My Top Songs
              </Button>
            </div>

            {/* Display Top Artists */}
            {showTopContent && topArtists.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-blue-300">Your Top Artists</h2>
                <Row className="mx-2 row-cols-1 sm:row-cols-2 md:row-cols-3 lg:row-cols-4 g-4">
                  {topArtists.map((artist, i) => (
                    <Card key={i} className="bg-gray-800 text-white border-0 rounded-lg shadow-lg overflow-hidden">
                      {artist.images[0] && (
                        <Card.Img
                          variant="top"
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <Card.Body className="p-4">
                        <Card.Title className="text-xl font-semibold mb-2 text-center">{artist.name}</Card.Title>
                        <p className="text-sm text-gray-400 text-center">{artist.genres.join(', ')}</p>
                      </Card.Body>
                    </Card>
                  ))}
                </Row>
              </div>
            )}

            {/* Display Top Tracks */}
            {showTopContent && topTracks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-purple-300">Your Top Songs</h2>
                <Row className="mx-2 row-cols-1 sm:row-cols-2 md:row-cols-3 lg:row-cols-4 g-4">
                  {topTracks.map((track, i) => (
                    <Card key={i} className="bg-gray-800 text-white border-0 rounded-lg shadow-lg overflow-hidden">
                      {track.album.images[0] && (
                        <Card.Img
                          variant="top"
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <Card.Body className="p-4">
                        <Card.Title className="text-xl font-semibold mb-2 text-center">{track.name}</Card.Title>
                        <p className="text-sm text-gray-400 text-center">{track.artists.map(artist => artist.name).join(', ')}</p>
                        <p className="text-xs text-gray-500 text-center">{track.album.name}</p>
                      </Card.Body>
                    </Card>
                  ))}
                </Row>
              </div>
            )}

            {/* Display Searched Albums */}
            {albums.length > 0 && (
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4 text-center text-green-300">Artist Albums</h2>
                <Row className="mx-2 row-cols-1 sm:row-cols-2 md:row-cols-3 lg:row-cols-4 g-4">
                  {albums.map((album, i) => (
                    <Card key={i} className="bg-gray-800 text-white border-0 rounded-lg shadow-lg overflow-hidden">
                      {album.images[0] && (
                        <Card.Img
                          variant="top"
                          src={album.images[0].url}
                          alt={album.name}
                          className="w-full h-48 object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/333333/FFFFFF?text=No+Image`; }}
                        />
                      )}
                      <Card.Body className="p-4">
                        <Card.Title className="text-xl font-semibold mb-2 text-center">{album.name}</Card.Title>
                        <p className="text-sm text-gray-400 text-center">{album.release_date}</p>
                      </Card.Body>
                    </Card>
                  ))}
                </Row>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
