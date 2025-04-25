let accessToken = null;

window.onload = async () => {
  const hashParams = new URLSearchParams(window.location.search);
  if (hashParams.get("code")) {
    // Exchange code for token
    const code = hashParams.get("code");

    const res = await fetch(`/callback?code=${code}`);
    const data = await res.json();
    accessToken = data.access_token;

    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("main-section").classList.remove("hidden");

    fetchCurrentSong();
    fetchQueue();
  }
};

async function fetchCurrentSong() {
  try {
    const res = await fetch("/currentsong", {
      headers: { Authorization: accessToken },
    });

    const data = await res.json();
    const container = document.getElementById("current-song");

    if (data.item) {
      const { name, artists, album } = data.item;
      container.innerHTML = `
        <p><strong>${name}</strong> by ${artists.map(a => a.name).join(", ")}</p>
        <img src="${album.images[0].url}" class="w-32 mt-2 rounded" />
      `;
    } else {
      container.textContent = data.message || "No song playing.";
    }
  } catch (err) {
    console.error("Failed to get current song", err);
  }
}

async function fetchQueue() {
  try {
    const res = await fetch("/currentqueue", {
      headers: { Authorization: accessToken },
    });

    const data = await res.json();
    const list = document.getElementById("queue-list");
    list.innerHTML = "";

    if (data.queue && data.queue.length > 0) {
      data.queue.forEach((track) => {
        const li = document.createElement("li");
        li.textContent = `${track.name} by ${track.artists.map(a => a.name).join(", ")}`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>No tracks in queue</li>";
    }
  } catch (err) {
    console.error("Failed to get queue", err);
  }
}

async function addToQueue() {
  const uri = document.getElementById("track-uri").value;
  if (!uri) return alert("Please enter a track URI.");

  try {
    const res = await fetch("/updatequeue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: accessToken,
      },
      body: JSON.stringify({ uri }),
    });

    if (res.ok) {
      alert("Track added to queue!");
      fetchQueue();
    } else {
      alert("Failed to add track");
    }
  } catch (err) {
    console.error("Failed to add to queue", err);
  }
}
