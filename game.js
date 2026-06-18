const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let secretNumber;
let attempts;
let maxNumber;

function startGame() {
    attempts = 0;

    console.log("\n🎮 Welcome to PRO Guess Game!");

    rl.question("Choose difficulty (easy / medium / hard): ", (level) => {

        if (level === "easy") {
            maxNumber = 50;
        } else if (level === "medium") {
            maxNumber = 100;
        } else {
            maxNumber = 500;
        }

        secretNumber = Math.floor(Math.random() * maxNumber) + 1;

        console.log(`\nI picked a number between 1 and ${maxNumber}`);
        console.log("Try to guess it!\n");

        askGuess();
    });
}

function askGuess() {
    rl.question("Your guess: ", (answer) => {
        let guess = Number(answer);
        attempts++;

        let diff = Math.abs(guess - secretNumber);

        if (guess === secretNumber) {
            console.log("🎉 Correct! You win!");
            console.log("Attempts:", attempts);

            rl.question("\nPlay again? (yes/no): ", (res) => {
                if (res === "yes") startGame();
                else {
                    console.log("👋 Thanks for playing!");
                    rl.close();
                }
            });

        } else {
            if (diff <= 5) {
                console.log("🔥 Very close!");
            } else if (diff <= 15) {
                console.log("🙂 Close!");
            } else {
                console.log("❄️ Far away!");
            }

            if (guess > secretNumber) {
                console.log("📉 Too high!");
            } else {
                console.log("📈 Too low!");
            }

            console.log("Attempts:", attempts, "\n");
            askGuess();
        }
    });
}

startGame();