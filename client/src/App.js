import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, FormControl, Button, Row, Card} from 'react-bootstrap';
import { useState, useEffect } from 'react';

const CLIENT_ID="38050f71f0d24edcb41de39261479fc9";
const CLIENT_SECRET="373082b87067489b9c0463233523f5fc";

function App() {
  const [searchInput, setSearchInput] = useState("");
  const[accessToken, setAccessToken] = useState("");
  const[albums, setAlbums] = useState([])
  const[topArtists, setTopArtists] = useState([])
  const scopes = 'user-top-read playlist-modify-public playlist-modify-private';

  useEffect(() => {
    var authParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET
    }
    fetch('https://accounts.spotify.com/api/token', authParameters)
    .then(result => result.json())
    .then(data => setAccessToken(data.access_token))

    var redirect_uri = 'http://localhost:3000/callback';
    var scope = 'user-read-private user-read-email';
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + CLIENT_ID;
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);

  }, [])

  //Search 
  async function search(){
    console.log("Search for " + searchInput);

    // Get request using search to get Artist ID
    var searchParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      }
    }

    var artistID = await fetch('https://api.spotify.com/v1/search?q=' + searchInput + '&type=artist', searchParameters)
    .then(response => response.json())
    .then(data => { return data.artists.items[0].id})
    // Get request with Artist ID grab all the albums from artist

    var returnedAlbums = await fetch('https://api.spotify.com/v1/artists/' + artistID + '/albums' + '?include_groups=album&market=US&limit=50', searchParameters)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setAlbums(data.items);
    });
    // Display those albums
  }

  // Get Top Songs
  async function getTopSongs(){
    var searchParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken,
      }
    }

    var topSongs = await fetch('https://api.spotify.com/v1/me/top/artists', searchParameters)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      setTopArtists(data);});

  }


  return (
    <div className="App">
      <Container>
        <InputGroup className="mb-3" size="lg">
          <FormControl
           placeholder="Search For Artist"
           type="input"
           onKeyUp={event => {
            if(event.key == "Enter"){
              search()
            }
           }}
           onChange={event => setSearchInput(event.target.value)}
          />
          <Button onClick={search}>
            Search
          </Button>
          <Button onClick={getTopSongs}>
            Get My Songs
          </Button>
        </InputGroup>
      </Container>

      <Container>
        <Row className="mx-2 row row-cols-4">
          {albums.map( (album,i) => {
            return (
              <Card>
                <Card.Img src={album.images[0].url}></Card.Img>
                <Card.Body>
                  <Card.Title>{album.name}</Card.Title>
                </Card.Body>
              </Card>
              )
          })}
        </Row>
      </Container>
    </div>
  );
}

export default App;
