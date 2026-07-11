import React, { useState, useEffect, useCallback } from 'react';
import { User, Heart, LogOut, Play, Headphones, ListMusic, History, Music } from 'lucide-react';
import { theme } from '../lib/theme';
import LoadingSpinner from '../components/LoadingSpinner';

function Dashboard() {
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

  // Check connection status with our backend (which holds the Spotify refresh token server-side)
  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => setIsLoggedIn(!!data.connected))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Login now goes through our backend, which redirects to Spotify's Authorization Code flow
  const handleLogin = () => {
    window.location = '/api/auth/login';
  };

  // Local-only logout: the stored refresh token stays server-side for the daily cron pull
  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setUserPlaylists([]);
    setTopArtists([]);
    setTopTracks([]);
    setRecentlyPlayed([]);
    setTopGenres([]);
    setActiveTab('artists');
  }, []);

  // Fetch dashboard data (profile + tab data) through our own backend proxy
  const fetchDashboard = useCallback(async (tab, timeRange) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard?tab=${tab}&range=${timeRange}`);
      if (response.status === 401) {
        handleLogout();
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const { profile, data } = await response.json();
      setUserProfile(profile);

      switch (tab) {
        case 'playlists':
          setUserPlaylists(data);
          break;
        case 'tracks':
          setTopTracks(data);
          break;
        case 'recentlyPlayed':
          setRecentlyPlayed(data);
          break;
        case 'genres':
          setTopGenres(data);
          break;
        case 'artists':
        default:
          setTopArtists(data);
          break;
      }
    } catch (error) {
      console.error(`Error fetching dashboard data for tab ${tab}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]);

  // Load data based on active tab when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboard(activeTab, selectedTimeRange);
    }
  }, [isLoggedIn, activeTab, selectedTimeRange, fetchDashboard]);

  if (!isLoggedIn) {
    return (
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
    );
  }

  return (
    <>
      {/* Top Bar: User Profile, Status, and Logout Button */}
      <div className={`flex flex-col md:flex-row justify-between items-center gap-4 mb-8 p-4 bg-${theme.cardBg} backdrop-blur-lg border ${theme.cardBorder} rounded-3xl shadow-2xl`}>
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
            <div className="text-center md:text-left min-w-0">
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
          <div className={`flex items-center gap-2 ${theme.buttonBg} ${theme.lightTextColor} font-medium py-2 px-4 rounded-full border ${theme.cardBorder} shadow-md`}>
            <div className={`w-3 h-3 ${theme.connectedDot} rounded-full animate-pulse`}></div>
            <span>Connected</span>
          </div>

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
                : `${theme.buttonBg} ${theme.buttonText}`
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
                : `${theme.buttonBg} ${theme.buttonText}`
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
                : `${theme.buttonBg} ${theme.buttonText}`
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
                : `${theme.buttonBg} ${theme.buttonText}`
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
                : `${theme.buttonBg} ${theme.buttonText}`
            }`}
          >
            <ListMusic className="w-5 h-5" />
            Playlists
          </button>
        </div>

        {(activeTab === 'artists' || activeTab === 'tracks' || activeTab === 'genres') && (
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={() => setSelectedTimeRange('short_term')}
              className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                selectedTimeRange === 'short_term'
                  ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                  : `${theme.buttonBg} ${theme.buttonText}`
              }`}
            >
              Past Month
            </button>
            <button
              onClick={() => setSelectedTimeRange('medium_term')}
              className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                selectedTimeRange === 'medium_term'
                  ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                  : `${theme.buttonBg} ${theme.buttonText}`
              }`}
            >
              Past 6 Months
            </button>
            <button
              onClick={() => setSelectedTimeRange('long_term')}
              className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                selectedTimeRange === 'long_term'
                  ? `bg-gradient-to-r from-${theme.primaryAccent} to-${theme.secondaryAccent} text-white shadow-lg`
                  : `${theme.buttonBg} ${theme.buttonText}`
              }`}
            >
              Past Year
            </button>
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && (
        <>
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
          {activeTab === 'playlists' && userPlaylists.length === 0 && (
            <div className={`text-center ${theme.lighterTextColor} py-8`}>No playlists found or available.</div>
          )}

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
          {activeTab === 'artists' && topArtists.length === 0 && (
            <div className={`text-center ${theme.lighterTextColor} py-8`}>No top artists found for this time range.</div>
          )}

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
          {activeTab === 'tracks' && topTracks.length === 0 && (
            <div className={`text-center ${theme.lighterTextColor} py-8`}>No top tracks found for this time range.</div>
          )}

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
          {activeTab === 'genres' && topGenres.length === 0 && (
            <div className={`text-center ${theme.lighterTextColor} py-8`}>No top genres found for this time range (based on your top artists).</div>
          )}

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
          {activeTab === 'recentlyPlayed' && recentlyPlayed.length === 0 && (
            <div className={`text-center ${theme.lighterTextColor} py-8`}>No recently played tracks found.</div>
          )}
        </>
      )}
    </>
  );
}

export default Dashboard;
