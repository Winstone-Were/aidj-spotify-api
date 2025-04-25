import express from "express";
import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";
import cors from "cors";

/**
 * Get Current Song
 * Get Current Queue
 * Get Song Info
 * Update Queue (Add/Remove)
 */

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.REDIRECT_URI!;

app.get("/login", (req, res) => {
  const scope = "playlist-modify-public playlist-modify-private";
  const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(
    {
      response_type: "code",
      client_id: CLIENT_ID,
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
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json(tokenResponse.data); // Send token to frontend
  } catch (error) {
    console.error("Error exchanging token:", error);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/currentsong/:songname", async (req, res) => {});

app.get("/currentqueue", async (req, res) => {});

app.get("/song/:song", async (req, res) => {});

app.post("/updatequeue", async (req, res) => {});

