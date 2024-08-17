const API_URL = "https://citiesgame.onrender.com";

const startBtn = document.querySelector(".start-btn");
const nextBtn = document.querySelector(".next-btn");
const endBtn = document.querySelector(".end-btn");
const wordInput = document.querySelector(".word-input");
const serverWordField = document.querySelector(".server-word");
const loaderContainer = document.querySelector(".overlay");

let gameStarted = Boolean(parseInt(localStorage.getItem("gameStarted") ?? "0"));
if (localStorage.getItem("serverWord")) {
    serverWordField.value = localStorage.getItem("serverWord");
}
if (localStorage.getItem("userWord")) {
    wordInput.value = localStorage.getItem("userWord");
}

if (gameStarted) {
    startBtn.classList.add("btn-disabled");
} else {
    nextBtn.classList.add("btn-disabled");
    endBtn.classList.add("btn-disabled");
}

// API REQUESTS
const startGameQuery = async () => {
    const serverWord = await fetch(`${API_URL}/begin`, {
        method: "GET",
        credentials: "include",
    }).then((data) => data.text());

    return serverWord;
};
const nextWordQuery = async (serverPrevWord, userWord) => {
    const congratulation = await fetch(
        `${API_URL}/next?word=${userWord}&current-city=${serverPrevWord}`,
        {
            method: "GET",
            credentials: "include",
        }
    ).then(async (data) => {
        if (data.status === 400) {
            const errorMessage = await data.text();
            throw new Error(errorMessage);
        }

        return data.text();
    });

    return congratulation;
};
const endGameQuery = async () => {
    const congratulation = await fetch(`${API_URL}/end`, {
        method: "POST",
        credentials: "include",
    }).then((data) => data.text());

    return congratulation;
};

// SHOW TOAST WITH ERROR
const showErrorToast = (message) => {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: "red",
        },
    }).showToast();
};

startBtn.addEventListener("touchend", async () => {
    gameStarted = true;
    startBtn.classList.add("btn-disabled");
    nextBtn.classList.remove("btn-disabled");
    endBtn.classList.remove("btn-disabled");

    loaderContainer.classList.add("active");
    const serverWord = await startGameQuery();
    serverWordField.value = serverWord;
    loaderContainer.classList.remove("active");
});
nextBtn.addEventListener("touchend", async () => {
    const userWord = wordInput.value;
    const prevServerWord = serverWordField.value;

    if (!userWord) {
        wordInput.setCustomValidity("Обов'язково впишіть сюди своє слово");
        wordInput.reportValidity();
        return;
    }

    try {
        loaderContainer.classList.add("active");
        const newServerWord = await nextWordQuery(prevServerWord, userWord);
        serverWordField.value = newServerWord;
    }
    catch (e) {
        if (e.message === "Система не знайшла слово, ви виграли!") {
            gameStarted = false;
            startBtn.classList.remove("btn-disabled");
            nextBtn.classList.add("btn-disabled");
            endBtn.classList.add("btn-disabled");
            wordInput.value = "";
            serverWordField.value = "Місто сервера";
            await endGameQuery();
            showErrorToast(e.message);
        }
        else {
            showErrorToast(e.message);
        }
    }
    finally {
        loaderContainer.classList.remove("active");
        wordInput.value = "";
    }
});
endBtn.addEventListener("touchend", async () => {
    gameStarted = false;
    startBtn.classList.remove("btn-disabled");
    nextBtn.classList.add("btn-disabled");
    endBtn.classList.add("btn-disabled");

    serverWordField.value = "Місто сервера";
    wordInput.value = "";
    loaderContainer.classList.add("active");
    const congratulation = await endGameQuery();
    showErrorToast(congratulation);
    loaderContainer.classList.remove("active");
});

window.onbeforeunload = () => {
    localStorage.setItem("serverWord", serverWordField.value);
    localStorage.setItem("userWord", wordInput.value);
    localStorage.setItem("gameStarted", gameStarted ? 1 : 0);
};
