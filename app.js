const CLIENT_ID = "330d8f2d";
const API = "https://api.jamendo.com/v3.0/tracks/";

const $ = (id) => document.getElementById(id);
const input = $("searchInput");
const searchButton = $("searchButton");
const clearSearch = $("clearSearch");
const resultsEl = $("results");
const statusEl = $("status");
const emptyEl = $("emptyState");
const player = $("player");
const audio = $("audio");
const progress = $("progress");

let tracks = [];
let currentIndex = -1;
let searchTimer = null;
let controller = null;

function setStatus(text = "") { statusEl.textContent = text; }

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function renderResults() {
  resultsEl.replaceChildren();
  tracks.forEach((track, index) => {
    const button = document.createElement("button");
    button.className = "track";
    button.type = "button";
    button.setAttribute("aria-label", `Reproducir ${track.name} de ${track.artist_name}`);

    const img = document.createElement("img");
    img.className = "cover";
    img.alt = "";
    img.loading = "lazy";
    img.src = track.image || track.album_image || "";
    img.onerror = () => { img.style.visibility = "hidden"; };

    const info = document.createElement("div");
    info.className = "track-info";

    const name = document.createElement("div");
    name.className = "track-name";
    name.textContent = track.name || "Sin título";

    const artist = document.createElement("div");
    artist.className = "track-artist";
    artist.textContent = track.artist_name || "Artista desconocido";

    const play = document.createElement("span");
    play.className = "track-play";
    play.textContent = "▶";
    play.setAttribute("aria-hidden", "true");

    info.append(name, artist);
    button.append(img, info, play);
    button.addEventListener("click", () => selectTrack(index));
    resultsEl.append(button);
  });
  emptyEl.hidden = tracks.length > 0;
}

async function searchJamendo(query) {
  const q = query.trim();
  if (!q) {
    tracks = [];
    renderResults();
    setStatus("");
    emptyEl.hidden = false;
    return;
  }

  if (controller) controller.abort();
  controller = new AbortController();
  setStatus("Buscando…");
  emptyEl.hidden = true;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    format: "json",
    limit: "20",
    offset: "0",
    order: "relevance",
    search: q,
    audioformat: "mp32",
    imagesize: "200"
  });

  try {
    const response = await fetch(`${API}?${params.toString()}`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.headers?.status !== "success") {
      throw new Error(data.headers?.error_message || "Jamendo devolvió un error.");
    }

    tracks = Array.isArray(data.results) ? data.results.filter(t => t.audio) : [];
    renderResults();

    if (!tracks.length) {
      setStatus("Sin resultados");
      emptyEl.hidden = false;
      emptyEl.querySelector("h2").textContent = "No encontramos nada";
      emptyEl.querySelector("p").textContent = "Prueba con otro nombre o artista.";
    } else {
      setStatus(`${tracks.length} resultados`);
      emptyEl.querySelector("h2").textContent = "Busca algo para escuchar";
      emptyEl.querySelector("p").textContent = "Explora música real de Jamendo.";
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    tracks = [];
    renderResults();
    setStatus("No se pudo realizar la búsqueda.");
    emptyEl.hidden = false;
    emptyEl.querySelector("h2").textContent = "Error de búsqueda";
    emptyEl.querySelector("p").textContent = "Comprueba tu conexión y vuelve a intentarlo.";
  }
}

function scheduleSearch() {
  clearTimeout(searchTimer);
  clearSearch.hidden = !input.value;
  searchTimer = setTimeout(() => searchJamendo(input.value), 420);
}

function updatePlayerButtons() {
  const playing = !audio.paused && !audio.ended;
  const symbol = playing ? "❚❚" : "▶";
  $("playerPlay").textContent = symbol;
  $("bigPlay").textContent = symbol;
  $("playerPlay").setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
  $("bigPlay").setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
}

function showPlayer(track) {
  player.hidden = false;
  $("playerCover").src = track.image || track.album_image || "";
  $("playerCover").alt = track.name || "";
  $("playerTitle").textContent = track.name || "Sin título";
  $("playerArtist").textContent = track.artist_name || "";
}

async function selectTrack(index, autoplay = true) {
  const track = tracks[index];
  if (!track || !track.audio) return;
  currentIndex = index;
  showPlayer(track);
  $("audioStatus").textContent = "Cargando audio…";
  audio.src = track.audio;
  audio.load();

  if (autoplay) {
    try {
      await audio.play();
    } catch {
      $("audioStatus").textContent = "Toca reproducir para iniciar el audio.";
      updatePlayerButtons();
    }
  }
}

async function togglePlay() {
  if (currentIndex < 0) {
    if (tracks.length) return selectTrack(0, true);
    return;
  }
  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      $("audioStatus").textContent = "Safari bloqueó el inicio. Toca reproducir otra vez.";
    }
  } else {
    audio.pause();
  }
}

function nextTrack() {
  if (!tracks.length) return;
  const next = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
  selectTrack(next, true);
}

function previousTrack() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const prev = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
  selectTrack(prev, true);
}

input.addEventListener("input", scheduleSearch);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    clearTimeout(searchTimer);
    searchJamendo(input.value);
  }
});
searchButton.addEventListener("click", () => searchJamendo(input.value));
clearSearch.addEventListener("click", () => {
  input.value = "";
  clearSearch.hidden = true;
  searchJamendo("");
  input.focus();
});
$("playerPlay").addEventListener("click", togglePlay);
$("bigPlay").addEventListener("click", togglePlay);
$("nextButton").addEventListener("click", nextTrack);
$("prevButton").addEventListener("click", previousTrack);

progress.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value);
});

audio.addEventListener("play", () => {
  $("audioStatus").textContent = "Reproduciendo";
  updatePlayerButtons();
});
audio.addEventListener("pause", () => {
  if (!audio.ended) $("audioStatus").textContent = "Pausado";
  updatePlayerButtons();
});
audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration)) return;
  progress.value = audio.currentTime;
  $("currentTime").textContent = formatTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata", () => {
  progress.max = audio.duration || 0;
  $("duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("waiting", () => { $("audioStatus").textContent = "Cargando audio…"; });
audio.addEventListener("canplay", () => {
  if (!audio.paused) $("audioStatus").textContent = "Reproduciendo";
});
audio.addEventListener("ended", nextTrack);
audio.addEventListener("error", () => {
  $("audioStatus").textContent = "No se pudo reproducir este audio. Prueba otra canción.";
  updatePlayerButtons();
});

updatePlayerButtons();
