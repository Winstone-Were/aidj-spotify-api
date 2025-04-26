import express, { Request, Response } from "express";
import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";
import cors from "cors";
import { access } from "fs";

console.log("Hello")

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const SPOTIFY_CLIENT_ID = "c7950af8cf894991bdf075c3b7bf7846";
const SPOTIFY_CLIENT_SECRET = "42370b8d78814caba4156bc508174105";
const REDIRECT_URI = "http://localhost:3000/callback";

app.get("/login", (req: Request, res: Response) => {
  const scope =
    "playlist-modify-public playlist-modify-private user-read-playback-state user-modify-playback-state";
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
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

app.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("Auth code missing");
    return;
  }

  try {
    const tokenResponse = await axios.post<SpotifyTokenResponse>(
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
    console.error("Error exchanging token:", error);
    res.status(500).send("Failed to authenticate");
  }
});

app.get("/currentsong", async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    console.error("Current song error:", error.response?.data || error.message);
    res.status(500).send("Failed to get current song");
  }
});

app.get("/currentqueue", async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    console.error("Queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to get queue");
  }
});

app.get("/song/:song", async (req: Request, res: Response): Promise<void> => {
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
    res.json(authResponse.data); // You were missing this!
  } catch (error: any) {
    console.error("Song fetch error:", error.response?.data || error.message);
    res.status(500).send("Failed to get song info");
  }
});

app.post("/updatequeue", async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization;
  const { uri } = req.body as { uri?: string };

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
  } catch (error: any) {
    console.error("Update queue error:", error.response?.data || error.message);
    res.status(500).send("Failed to update queue");
  }
});

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});


export default app;