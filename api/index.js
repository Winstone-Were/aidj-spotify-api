const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const SPOTIFY_CLIENT_ID = "c7950af8cf894991bdf075c3b7bf7846";
const SPOTIFY_CLIENT_SECRET = "42370b8d78814caba4156bc508174105";
const REDIRECT_URI = "http://localhost:3000/callback";

app.get("/login", (req, res) => {
  const scope =
    "playlist-modify-public playlist-modify-private user-read-playback-state user-modify-playback-state";
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
  })}`;

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("Auth code missing");
    return;
  }

  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenResponse.data;
    res.redirect(`/index.html?access_token=${access_token}`);
  } catch (error) {
    console.error("Error exchanging token:", error.response?.data || error.message);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/currentsong", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).send("Missing Token");
    return;
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 204) {
      res.json({ message: "No song currently playing" });
      return;
    }

    res.json(response.data);
  } catch (error) {
    console.error("Current song error:", error.response?.data || error.message);
    res.status(500).send("Failed to get current song");
  }
});

app.get("/currentqueue", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).send("Missing token");
    return;
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/queue",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to get queue");
  }
});

app.get("/song/:song", async (req, res) => {
  const song = req.params.song; // <-- This was missing!

  try {
    const authResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = authResponse.data.access_token;

    // Search for the song
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        song
      )}&type=track&limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const track = searchResponse.data.tracks.items[0];
    res.json({
      title: track.name,
      artist: track.artists[0].name,
      albumCover: track.album.images[0].url,
      uri: track.uri
    });


  } catch (error) {
    console.error("Song fetch error:", error.response?.data || error.message);
    res.status(500).send("Failed to get song info");
  }
});

app.post("/updatequeue", async (req, res) => {
  const token = req.headers.authorization;
  const { uri } = req.body;

  if (!token) {
    res.status(401).send("Missing token");
    return;
  }

  if (!uri) {
    res.status(400).send("Missing track URI");
    return;
  }

  try {
    await axios.post(
      "https://api.spotify.com/v1/me/player/queue",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { uri },
      }
    );

    res.send("Track added to queue");
  } catch (error) {
    console.error("Update queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to update queue");
  }
});

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});


module.exports = app;
