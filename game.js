const secretNumber = Math.floor(Math.random() * 100) + 1;

console.log("🎮 Guess the Number Game!");
console.log("Guess a number between 1 and 100");

let guess = 50; // we will improve this later

if (guess === secretNumber) {
    console.log("🎉 Correct! You win!");
} else if (guess > secretNumber) {
    console.log("📉 Too high!");
} else {
    console.log("📈 Too low!");
}

console.log("Secret was:", secretNumber);