
const STORAGE_KEY = "luckydraw_college_demo_v1";

const START_BALANCE = 100;
const ENTRY = 10;
const PRIZE = 40;
const PLATFORM_FEE = 10;
const REQUIRED = 5;

const defaultState = () => ({
    name: "Guest Player",
    balance: START_BALANCE,
    wins: 0,
    round: 1,
    players: [],
    history: []
});

let state;

try {
    state = {
        ...defaultState(),
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    };
} catch (error) {
    state = defaultState();
}

if (!Array.isArray(state.players)) state.players = [];
if (!Array.isArray(state.history)) state.history = [];

let drawing = false;

// SELECT HTML ELEMENTS
const $ = id => document.getElementById(id);

// SAVE DATA
function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// GET FIRST LETTER
function initials(name) {
    return (name || "?").trim().charAt(0).toUpperCase();
}

// PREVENT HTML INJECTION
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// TOAST MESSAGE
function toast(message) {
    const element = $("toast");

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        element.classList.remove("show");
    }, 2600);
}

// UPDATE WEBSITE
function render() {

    // PROFILE INFORMATION
    $("headerName").textContent = state.name;
    $("headerAvatar").textContent = initials(state.name);

    $("profileAvatar").textContent = initials(state.name);
    $("nameInput").value = state.name;

    // USER STATISTICS
    $("balanceStat").textContent = state.balance;
    $("profileBalance").textContent = state.balance;

    $("winsStat").textContent = state.wins;
    $("profileWins").textContent = state.wins;

    $("playersStat").textContent =
        `${state.players.length}/${REQUIRED}`;

    // PRIZE POOL
    $("poolAmount").textContent =
        state.players.length * ENTRY;

    // PROGRESS BAR
    const percentage =
        state.players.length / REQUIRED * 100;

    $("progressBar").style.width = percentage + "%";

    $("progressText").textContent =
        `${state.players.length} of ${REQUIRED} players joined`;

    $("progressPercent").textContent =
        percentage + "%";

    $("roundNumber").textContent =
        String(state.round).padStart(2, "0");

    // PLAYER SLOTS
    $("playerSlots").innerHTML = "";

    for (let i = 0; i < REQUIRED; i++) {

        const player = state.players[i];

        const element = document.createElement("div");

        element.className = "player" + (player ? "" : " empty");

        element.textContent =
            player ? initials(player.name) : "+";

        element.title =
            player ? player.name : "Open spot";

        $("playerSlots").appendChild(element);
    }

    // JOIN BUTTON
    const alreadyJoined = state.players.some(
        player => player.id === "you"
    );

    $("joinBtn").disabled =
        alreadyJoined ||
        state.players.length >= REQUIRED ||
        state.balance < ENTRY;

    if (alreadyJoined) {
        $("joinBtn").textContent = "✓ Joined this round";
    } else if (state.players.length >= REQUIRED) {
        $("joinBtn").textContent = "Round is full";
    } else {
        $("joinBtn").textContent = "＋ Join draw · 10 credits";
    }

    $("joinBtn").style.opacity =
        $("joinBtn").disabled ? ".55" : "1";

    // DRAW BUTTON
    $("drawBtn").disabled =
        state.players.length !== REQUIRED || drawing;

    $("drawBtn").textContent =
        state.players.length === REQUIRED
            ? "🎉 Pick the winner"
            : "Draw needs 5 players";

    // DRAW STATUS
    if (state.players.length === REQUIRED) {

        $("drawTitle").textContent =
            "All spots are filled!";

        $("drawMessage").textContent =
            "The round is ready. Start the draw to randomly select one winner.";

        $("drawIcon").textContent = "🎊";

    } else {

        $("drawTitle").textContent =
            "Ready to try your luck?";

        $("drawMessage").textContent =
            "Join the round. The draw becomes available when all five player spots are filled.";

        $("drawIcon").textContent = "🎲";
    }

    renderHistory();
}

// DISPLAY HISTORY
function renderHistory() {

    const items = state.history.slice().reverse();

    if (items.length === 0) {

        const empty =
            '<div class="empty-state">No winners yet. Complete your first demo round!</div>';

        $("recentWinners").innerHTML = empty;
        $("allHistory").innerHTML = empty;

        return;
    }

    function historyHTML(item) {

        return `
            <div class="history-item">

                <div>
                    <strong>${escapeHTML(item.winner)}</strong>

                    <small>
                        Round ${item.round} ·
                        ${escapeHTML(item.date)}
                    </small>
                </div>

                <span class="winner-pill">
                    +${item.prize} credits
                </span>

            </div>
        `;
    }

    $("recentWinners").innerHTML =
        items.slice(0, 3).map(historyHTML).join("");

    $("allHistory").innerHTML =
        items.map(historyHTML).join("");
}

// JOIN DRAW
function joinPlayer() {

    if (state.players.some(player => player.id === "you")) {
        return toast("You have already joined this round.");
    }

    if (state.players.length >= REQUIRED) {
        return toast("This round is already full.");
    }

    if (state.balance < ENTRY) {
        return toast("Not enough demo credits. Reset demo data to try again.");
    }

    // Deduct virtual entry credits
    state.balance -= ENTRY;

    // Add current user
    state.players.push({
        id: "you",
        name: state.name
    });

    save();
    render();

    toast("You joined the draw. 10 demo credits used.");
}

// ADD COMPUTER / DEMO PLAYERS
function addDemoPlayers() {

    if (state.players.length >= REQUIRED) {
        return toast("All five spots are already filled.");
    }

    const names = [
        "Aarav",
        "Maya",
        "Rohan",
        "Zoya",
        "Ishaan",
        "Diya",
        "Kabir",
        "Anaya"
    ];

    const used = new Set(
        state.players.map(player => player.name)
    );

    let count = 0;

    while (state.players.length < REQUIRED) {

        let name =
            names.find(playerName => !used.has(playerName)) ||
            ("Player " + (state.players.length + 1));

        used.add(name);

        state.players.push({
            id: "demo-" + state.round + "-" + state.players.length,
            name: name
        });

        count++;
    }

    save();
    render();

    toast(
        `${count} demo player${count === 1 ? "" : "s"} added. Ready for the draw!`
    );
}

// RANDOM WINNER SELECTION
function pickWinner() {

    if (state.players.length !== REQUIRED || drawing) {
        return;
    }

    drawing = true;

    $("drawBtn").disabled = true;
    $("drawBtn").textContent = "🎲 Drawing...";

    $("drawIcon").textContent = "🎰";
    $("drawTitle").textContent = "The moment of truth...";

    $("drawMessage").textContent =
        "Picking one player at random from this round.";

    let ticks = 0;

    const spin = setInterval(() => {

        const icons = ["🎰", "🎲", "✨", "🎯"];

        $("drawIcon").textContent =
            icons[ticks % icons.length];

        ticks++;

        if (ticks >= 12) {

            clearInterval(spin);

            completeDraw();
        }

    }, 120);
}

// COMPLETE DRAW
function completeDraw() {

    // Select random player
    const randomIndex = Math.floor(
        Math.random() * state.players.length
    );

    const winner = state.players[randomIndex];

    // Give prize to user if they win
    if (winner.id === "you") {

        state.balance += PRIZE;
        state.wins++;
    }

    // Save winner history
    const now = new Date();

    state.history.push({

        round: state.round,

        winner: winner.name,

        prize: PRIZE,

        date: now.toLocaleString()
    });

    // Winner popup
    $("modalWinner").textContent =
        winner.id === "you"
            ? "You are the lucky winner!"
            : winner.name + " wins!";

    $("modalText").textContent =
        winner.id === "you"
            ? "40 demo credits have been added to your balance. The platform demo fee is 10 credits."
            : winner.name + " wins 40 demo credits in this simulated round. The platform demo fee is 10 credits.";

    $("winnerModal").classList.add("show");

    // Prepare next round
    state.players = [];
    state.round++;

    save();

    drawing = false;

    render();

    $("drawTitle").textContent = "Round complete!";

    $("drawMessage").textContent =
        "Start a new round whenever you are ready.";

    $("drawIcon").textContent = "🏆";
}

// START NEXT ROUND
function newRound() {

    $("winnerModal").classList.remove("show");

    render();
}

// NAVIGATION
function showPage(page) {

    document.querySelectorAll(".page").forEach(element => {

        element.classList.toggle(
            "active",
            element.id === page
        );

    });

    document.querySelectorAll("[data-page]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.page === page
        );

    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// NAVIGATION BUTTONS
document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        showPage(button.dataset.page);

    });

});

document.querySelectorAll("[data-goto]").forEach(button => {

    button.addEventListener("click", () => {

        showPage(button.dataset.goto);

    });

});

// JOIN BUTTON
$("joinBtn").addEventListener("click", joinPlayer);

// ADD DEMO PLAYERS BUTTON
$("demoFillBtn").addEventListener("click", addDemoPlayers);

// RANDOM DRAW BUTTON
$("drawBtn").addEventListener("click", pickWinner);

// NEXT ROUND BUTTON
$("newRoundBtn").addEventListener("click", newRound);

// HOW IT WORKS BUTTON
$("howBtn").addEventListener("click", () => {

    toast(
        "Join with 10 demo credits · 5 players fill the round · one random winner gets 40 credits."
    );

});

// CHANGE USERNAME
$("nameInput").addEventListener("change", event => {

    const name = event.target.value.trim().slice(0, 22);

    if (!name) {

        event.target.value = state.name;

        return;
    }

    state.name = name;

    save();
    render();

    toast("Player name updated.");
});

// RESET DEMO DATA
$("resetBtn").addEventListener("click", () => {

    const confirmed = confirm(
        "Reset your balance, player name, and all draw history on this browser?"
    );

    if (confirmed) {

        state = defaultState();

        save();
        render();

        showPage("home");

        toast("Demo data has been reset.");
    }

});

// INITIALIZE WEBSITE
render();
