console.log("hello");

// Global audio instance and state
let currentsong = new Audio();
let isPlaying = false;
let songs = [];
let currentIndex = -1;

// DOM element selections
const playButton = document.querySelector("#play");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const volumeInput = document.querySelector(".range input");
const volumeImg = document.querySelector(".volume img");
const seekbar = document.querySelector(".seekbar");
const progressCircle = document.querySelector(".circle");

// Convert seconds to mm:ss format
const secondsToMinutesSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// Fetch songs from local server directory
async function getsongs() {
    try {
        let response = await fetch("http://127.0.0.1:5500/SONGS");
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        let fetchedSongs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                const pathParts = new URL(element.href).pathname.split("/SONGS/");
                if (pathParts.length > 1) {
                    fetchedSongs.push(pathParts[1]);
                }
            }
        }
        return fetchedSongs;
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
}

// Play music function
const playMusic = (index) => {
    if (index < 0 || index >= songs.length) return;

    const track = songs[index];
    currentsong.src = "SONGS/" + track;
    currentsong.play();
    isPlaying = true;
    playButton.src = "img/pause.svg";
    currentIndex = index;

    const songInfo = document.querySelector(".songinfo");
    if (songInfo) {
        songInfo.innerHTML = decodeURI(track);
    }

    // Duration display when metadata is loaded
    currentsong.addEventListener("loadedmetadata", () => {
        const songTime = document.querySelector(".songtime");
        if (songTime) {
            songTime.innerHTML = "00:00 / " + secondsToMinutesSeconds(currentsong.duration);
        }
    });
};

// Main function
async function main() {
    songs = await getsongs();
    console.log(songs);

    let songUL = document.querySelector(".songList ul");
    if (!songUL) {
        console.error("No <ul> element found inside .songList");
        return;
    }

    songUL.innerHTML = '';

    for (const song of songs) {
        songUL.innerHTML += `<li>
            <img class="invert" src="img/music (1).svg" alt="">
            <div class="info">${decodeURIComponent(song.replaceAll("%20", " "))}</div>
            <div>Song artist</div>
            <div class="playnow">
                <span>play now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            playMusic(index);
        });
    });

    if (playButton) {
        playButton.addEventListener("click", () => {
            if (isPlaying) {
                currentsong.pause();
                playButton.src = "img/play.svg";
                isPlaying = false;
            } else {
                currentsong.play();
                playButton.src = "img/pause.svg";
                isPlaying = true;
            }
        });
    }

    currentsong.addEventListener("timeupdate", () => {
        const songTime = document.querySelector(".songtime");
        if (songTime && progressCircle) {
            songTime.innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
            progressCircle.style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
        }
    });

    if (seekbar) {
        seekbar.addEventListener("click", (e) => {
            const rect = seekbar.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const percent = (offsetX / rect.width);
            if (!isNaN(currentsong.duration)) {
                currentsong.currentTime = currentsong.duration * percent;
                progressCircle.style.left = percent * 100 + "%";
            }
        });
    }

    if (previousButton) {
        previousButton.addEventListener("click", () => {
            if (currentIndex > 0) {
                playMusic(currentIndex - 1);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            if (currentIndex < songs.length - 1) {
                playMusic(currentIndex + 1);
            }
        });
    }

    if (volumeInput) {
        volumeInput.addEventListener("input", (e) => {
            const volume = e.target.value / 100;
            currentsong.volume = volume;

            if (volume === 0) {
                volumeImg.src = "img/mute.svg";
            } else {
                volumeImg.src = "img/volume.svg";
            }
            console.log("Setting volume to", volume * 100, "/ 100");
        });
    }

    if (volumeImg) {
        volumeImg.addEventListener("click", () => {
            if (currentsong.volume > 0) {
                currentsong.volume = 0;
                volumeInput.value = 0;
                volumeImg.src = "img/mute.svg";
            } else {
                currentsong.volume = 0.1;
                volumeInput.value = 10;
                volumeImg.src = "img/volume.svg";
            }
        });
    }

    // Optional: Auto play the first song
    if (songs.length > 0) {
        playMusic(0);
    }
}

main();
