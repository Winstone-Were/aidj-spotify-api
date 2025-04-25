import express from "express";
import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";
import cors from "cors";
import { promises } from "dns";

/**
 * Get Current Song
 * Get Current Queue
 * Get Song Info
 * Update Queue (Add/Remove)
 */

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
dotenv.config();

let SPOTIFY_CLIENT_ID = "c7950af8cf894991bdf075c3b7bf7846"
let SPOTIFY_CLIENT_SECRET = "42370b8d78814caba4156bc508174105";
let REDIRECT_URI = "http://localhost:3000/callback";

app.get("/login", (req, res) => {
  const scope = "playlist-modify-public playlist-modify-private";
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(
    {
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
    }
  )}`;

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Auth code missing");
  }

  try {
    // Exchange code for access token
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

    res.json(tokenResponse.data); // Send token to frontend
  } catch (error) {
    console.error("Error exchanging token:", error);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/currentsong", async (req, res) => {
  const token = req.headers.authorization!;

  if (!token) {
    res.status(201).send("Missing Token");
  }

  axios
    .get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((response) => {
      if (response.status === 204) {
        res.json({ message: "No song currently playing" });
      }

      res.json(response.data);
    })
    .catch((error) => {
      console.error(
        "Current song error:",
        error.response?.data || error.message
      );
      res.status(500).send("Failed to get current song");
    });
});

app.get("/currentqueue", async (req, res) => {
  const token = req.headers.authorization;

  if (!token) res.status(401).send("Missing token");

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/queue",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to get queue");
  }
});

app.get("/song/:song", async (req, res) => {
    try{
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
    }catch(error){

    }
});

app.post("/updatequeue", async (req, res) => {
  const token = req.headers.authorization;
  const { uri } = req.body as { uri?: string };

  if (!token) res.status(401).send("Missing token");
  if (!uri) res.status(400).send("Missing track URI");

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
  } catch (error: any) {
    console.error("Update queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to update queue");
  }
});

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});
