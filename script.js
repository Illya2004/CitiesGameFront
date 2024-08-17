const API_URL = "https://citiesgame.onrender.com:8080";

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

startBtn.addEventListener("click", async () => {
    gameStarted = true;
    startBtn.classList.add("btn-disabled");
    nextBtn.classList.remove("btn-disabled");
    endBtn.classList.remove("btn-disabled");

    loaderContainer.classList.add("active");
    const serverWord = await startGameQuery();
    serverWordField.value = serverWord;
    loaderContainer.classList.remove("active");
});
nextBtn.addEventListener("click", async () => {
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
        showErrorToast(e.message);
    }
    finally {
        loaderContainer.classList.remove("active");
        wordInput.value = "";
    }
});
endBtn.addEventListener("click", async () => {
    gameStarted = false;
    startBtn.classList.remove("btn-disabled");
    nextBtn.classList.add("btn-disabled");
    endBtn.classList.add("btn-disabled");

    serverWordField.value = "Місто сервера";
    wordInput.value = "";
    loaderContainer.classList.add("active");
    await endGameQuery();
    loaderContainer.classList.remove("active");
});

window.onbeforeunload = () => {
    localStorage.setItem("serverWord", serverWordField.value);
    localStorage.setItem("userWord", wordInput.value);
    localStorage.setItem("gameStarted", gameStarted ? 1 : 0);
};
