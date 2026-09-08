const CLIENT_ID = "330d8f2d";
const API = "https://api.jamendo.com/v3.0/tracks/";

const $ = id => document.getElementById(id);
const input = $("searchInput");
const form = $("searchForm");
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

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
}

function setEmpty(title, text) {
  emptyEl.querySelector("h2").textContent = title;
  emptyEl.querySelector("p").textContent = text;
  emptyEl.hidden = false;
}

function renderResults() {
  resultsEl.replaceChildren();
  $("resultsCount").textContent = tracks.length ? `${tracks.length} canciones` : "";
  tracks.forEach((track,index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "track";
    button.setAttribute("aria-label", `Reproducir ${track.name || "canción"} de ${track.artist_name || "artista"}`);

    const img = document.createElement("img");
    img.className = "cover";
    img.alt = "";
    img.loading = "lazy";
    img.src = track.image || track.album_image || "";
    img.onerror = () => { img.removeAttribute("src"); };

    const info = document.createElement("div");
    info.className = "track-info";

    const name = document.createElement("div");
    name.className = "track-name";
    name.textContent = track.name || "Sin título";

    const artist = document.createElement("div");
    artist.className = "track-artist";
    artist.textContent = track.artist_name || "Artista desconocido";

    const album = document.createElement("div");
    album.className = "track-album";
    album.textContent = track.album_name || "Single";

    const play = document.createElement("span");
    play.className = "track-play";
    play.textContent = "▶";
    play.setAttribute("aria-hidden","true");

    info.append(name,artist,album);
    button.append(img,info,play);
    button.addEventListener("click",() => selectTrack(index,true));
    resultsEl.append(button);
  });
}

async function searchJamendo(query) {
  const q = query.trim();
  if (!q) {
    tracks = [];
    renderResults();
    statusEl.textContent = "";
    setEmpty("Empieza a buscar","Escribe el nombre de una canción, artista o álbum.");
    return;
  }

  if (controller) controller.abort();
  controller = new AbortController();

  statusEl.textContent = "Buscando en Jamendo…";
  emptyEl.hidden = true;
  resultsEl.replaceChildren();

  // Jamendo's current tracks API supports free-text `search`, which considers
  // track, album, artist, tags and similar artists. Include singles + album tracks.
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    format: "json",
    limit: "100",
    offset: "0",
    order: "relevance",
    search: q,
    type: "single albumtrack",
    audioformat: "mp32",
    imagesize: "200"
  });

  try {
    const response = await fetch(`${API}?${params}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.headers?.status !== "success") {
      throw new Error(data.headers?.error_message || "Jamendo devolvió un error.");
    }

    tracks = (Array.isArray(data.results) ? data.results : [])
      .filter(track => track.audio);

    renderResults();

    if (!tracks.length) {
      statusEl.textContent = "0 resultados";
      setEmpty("No encontramos esa búsqueda","Prueba con otro nombre de canción, artista o álbum.");
    } else {
      statusEl.textContent = "";
      emptyEl.hidden = true;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    tracks = [];
    renderResults();
    statusEl.textContent = "Error de conexión";
    setEmpty("No se pudo buscar","Comprueba tu conexión y vuelve a intentarlo.");
  }
}

function scheduleSearch() {
  clearTimeout(searchTimer);
  clearSearch.hidden = !input.value;
  searchTimer = setTimeout(() => searchJamendo(input.value), 420);
}

function updateButtons() {
  const playing = !audio.paused && !audio.ended;
  const symbol = playing ? "❚❚" : "▶";
  $("playerPlay").textContent = symbol;
  $("bigPlay").textContent = symbol;
  $("playerPlay").setAttribute("aria-label",playing ? "Pausar" : "Reproducir");
  $("bigPlay").setAttribute("aria-label",playing ? "Pausar" : "Reproducir");
}

function showPlayer(track) {
  player.hidden = false;
  $("playerCover").src = track.image || track.album_image || "";
  $("playerCover").alt = track.name || "";
  $("playerTitle").textContent = track.name || "Sin título";
  $("playerArtist").textContent = track.artist_name || "Artista desconocido";
}

async function selectTrack(index, autoplay = true) {
  const track = tracks[index];
  if (!track?.audio) return;

  currentIndex = index;
  showPlayer(track);
  $("audioStatus").textContent = "Cargando…";
  progress.value = 0;
  progress.max = 0;
  $("currentTime").textContent = "0:00";
  $("duration").textContent = "0:00";

  audio.src = track.audio;
  audio.load();

  if (autoplay) {
    try {
      await audio.play();
    } catch {
      $("audioStatus").textContent = "Toca ▶ para reproducir";
      updateButtons();
    }
  }
}

async function togglePlay() {
  if (currentIndex < 0) {
    if (tracks.length) return selectTrack(0,true);
    return;
  }
  if (audio.paused) {
    try { await audio.play(); }
    catch { $("audioStatus").textContent = "Toca ▶ otra vez para iniciar"; }
  } else {
    audio.pause();
  }
}

function nextTrack() {
  if (!tracks.length) return;
  selectTrack(currentIndex < tracks.length - 1 ? currentIndex + 1 : 0,true);
}

function previousTrack() {
  if (!tracks.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  selectTrack(currentIndex > 0 ? currentIndex - 1 : tracks.length - 1,true);
}

form.addEventListener("submit",e => {
  e.preventDefault();
  clearTimeout(searchTimer);
  searchJamendo(input.value);
});
input.addEventListener("input",scheduleSearch);
clearSearch.addEventListener("click",() => {
  input.value = "";
  clearSearch.hidden = true;
  searchJamendo("");
  input.focus();
});
$("playerPlay").addEventListener("click",togglePlay);
$("bigPlay").addEventListener("click",togglePlay);
$("nextButton").addEventListener("click",nextTrack);
$("prevButton").addEventListener("click",previousTrack);

progress.addEventListener("input",() => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(progress.value);
});

audio.addEventListener("play",() => {
  $("audioStatus").textContent = "Reproduciendo";
  updateButtons();
});
audio.addEventListener("pause",() => {
  if (!audio.ended) $("audioStatus").textContent = "Pausado";
  updateButtons();
});
audio.addEventListener("timeupdate",() => {
  if (!Number.isFinite(audio.duration)) return;
  progress.value = audio.currentTime;
  $("currentTime").textContent = formatTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata",() => {
  progress.max = audio.duration || 0;
  $("duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("waiting",() => $("audioStatus").textContent = "Cargando audio…");
audio.addEventListener("canplay",() => {
  if (!audio.paused) $("audioStatus").textContent = "Reproduciendo";
});
audio.addEventListener("ended",nextTrack);
audio.addEventListener("error",() => {
  $("audioStatus").textContent = "No se pudo reproducir esta canción.";
  updateButtons();
});

updateButtons();
