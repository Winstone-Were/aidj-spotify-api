const params = new URLSearchParams(window.location.search);
const accessToken = params.get("access_token");

let authSection = document.getElementById("auth-section");
let mainSection = document.getElementById("main-section");
const currentSongDiv = document.getElementById("current-song");
const queueList = document.getElementById("queue-list");

if (accessToken) {
    console.log("Access Token:", accessToken);
    authSection.setAttribute("style", "display:none");

    // Unhide main section
    mainSection.classList.remove("hidden");

    // Optionally, start fetching now playing info, queue, etc.
} else {
    console.log("No access token found. Please login first.");
    window.location.href = "/login";
}

function onLoginSuccess() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-section').classList.remove('hidden');
}

// If you're using OAuth and redirect, check for token in URL
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
        // Store the token if needed
        localStorage.setItem('spotify_token', accessToken);

        // Show the main UI
        onLoginSuccess();
    }
});


async function getCurrentSong() {
    const response = await fetch("/currentsong", {
        headers: {
            Authorization: accessToken,
        },
    });

    const data = await response.json();
    console.log("Current Song:", data);

    if (data && data.item) {
        const songName = data.item.name;
        const artistName = data.item.artists.map(artist => artist.name).join(", ");
        const albumArt = data.item.album.images[0]?.url; // Optional: show album art

        currentSongDiv.innerHTML = `
            <div class="flex items-center space-x-4">
                <img src="${albumArt}" alt="${songName}" class="w-16 h-16 rounded shadow" />
                <div>
                    <div class="font-bold">${songName}</div>
                    <div class="text-sm text-gray-400">${artistName}</div>
                </div>
            </div>
        `;
    } else {
        currentSongDiv.textContent = "No song is currently playing.";
    }
}


async function getCurrentQueue() {
    const response = await fetch("/currentqueue", {
        headers: {
            Authorization: accessToken,
        },
    });

    const data = await response.json();
    console.log("Current Queue:", data.queue);

    queueList.innerHTML = "";

    if (data.queue) {
        data.queue.forEach(track => {
            const song = track.name;
            const artist = track.artists.map(a => a.name).join(", ");
            const albumArt = track.album.images[0]?.url || "";

            const li = document.createElement("li");
            li.innerHTML = `
                <div class="flex items-center space-x-4 py-2">
                    <img src="${albumArt}" alt="${song}" class="w-12 h-12 rounded shadow" />
                    <div>
                        <div class="font-medium">${song}</div>
                        <div class="text-sm text-gray-400">${artist}</div>
                    </div>
                </div>
            `;
            queueList.appendChild(li);
        });
    } else {
        queueList.innerHTML = `<li class="text-gray-400">Queue is empty.</li>`;
    }
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
//addToQueue("spotify:track:7ouMYWpwJ422jRcDASZB7P"); // some track URI
