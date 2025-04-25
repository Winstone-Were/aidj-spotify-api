const params = new URLSearchParams(window.location.search);
const accessToken = params.get("access_token");

if (accessToken) {
    console.log("Access Token:", accessToken);
    // You can now use this token to call your backend endpoints like /currentsong
} else {
    console.log("No access token found. Please login first.");
    // Optionally redirect to login
    window.location.href = "/login";
}

async function getCurrentSong() {
    const response = await fetch("/currentsong", {
        headers: {
            Authorization: accessToken,
        },
    });

    const data = await response.json();
    console.log("Current Song:", data);
}

async function getCurrentQueue() {
    const response = await fetch("/currentqueue", {
        headers: {
            Authorization: accessToken,
        },
    });

    const data = await response.json();
    console.log("Current Queue:", data);
}

async function addToQueue(trackUri) {
    const response = await fetch("/updatequeue", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: accessToken,
        },
        body: JSON.stringify({ uri: trackUri }),
    });

    const result = await response.text();
    console.log("Add to Queue Result:", result);
}

console.log("Current Song info")
getCurrentSong();
console.log("Current Queue")
getCurrentQueue();
console.log("Add to Queue")
addToQueue("spotify:track:7ouMYWpwJ422jRcDASZB7P"); // some track URI
