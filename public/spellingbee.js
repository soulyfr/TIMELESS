import letterSets from './lettersets.js';

const letters = letterSets[Math.floor(Math.random() * 10)];
const anchor = letters.shift().toLocaleLowerCase();
const guessBox = document.querySelector('.guess-line');
guessBox.textContent = '';

const correctsList = document.querySelector('.corrects-list');
const wordCounter = document.querySelector('.word-counter');
const scoreBoxes = document.querySelectorAll('.current-score');

const alertMessage = document.querySelector('.alert-message');

let correctWords = [];
let currentScore = 0;

const dict = await fetchData('/dictionary');

const allLetterBoxes = document.querySelectorAll('.letter:not(.anchor)');
const anchorLetter = document.querySelector('.anchor.letter');

const eraseButton = document.querySelector('.erase');
const shuffleButton = document.querySelector('.shuffle');
const submitButton = document.querySelector('.submit');
const giveUpButton = document.querySelector('.give-up');

const gameButton = document.querySelector('.spelling-bee-button');

const submitBox = document.querySelector('.submit-box');
const nameInput = document.querySelector('.name-input');
const blurFilter = document.querySelector('.back-blur');

const nameColumn = document.querySelector('.name-column');
const scoreColumn = document.querySelector('.score-column');


//boot function calls
setLetters(letters, anchor);

fillLeaderboard();


//buttons
for(const letterBox of allLetterBoxes) {

    letterBox.addEventListener('click', (event) => {
        const letter = event.target.textContent;
        guessBox.textContent += letter; 
    });
}

anchorLetter.addEventListener('click', (event) => {
    const letter = event.target.textContent;
    guessBox.textContent += letter; 
});



eraseButton.addEventListener('click', () => {
    guessBox.textContent = guessBox.textContent.slice(0, -1);
});

shuffleButton.addEventListener('click', () => {
    shuffleLetters(letters);

    setLetters(letters, anchor);
});

submitButton.addEventListener('click', checkWord);

giveUpButton.addEventListener('click', () => {
    if(currentScore > 0){
        submitBox.style.display = 'flex';
        blurFilter.style.display = 'block';
        nameInput.focus();
    } else {
        for(const scoreBox of scoreBoxes) {
            scoreBox.textContent = 'PLAY THE GAME FIRST';
        }
        setTimeout(() => {
            displayScore(currentScore);
        }, 1000);
    }
});

document.addEventListener('keydown', async (e) => {
    if(e.key === 'Escape' && submitBox.style.display == 'flex') {
        submitBox.style.display = 'none';
        blurFilter.style.display = 'none';
        nameInput.value = '';
        giveUpButton.style.display = 'none';
    }
});

nameInput.addEventListener('keypress', async (e) => {
    if(e.key === 'Enter' && nameInput.value !== '' && nameInput.value !== ' ') {
        await submitScore(nameInput.value, currentScore);
        submitBox.style.display = 'none';
        blurFilter.style.display = 'none';
        nameInput.value = '';
        giveUpButton.style.display = 'none';
        fillLeaderboard();
    }
});

gameButton.addEventListener('click', () => {
    window.scrollTo({ top: document.querySelector('.spelling-bee').offsetTop  - 100, behavior: 'smooth' });
});


//functions

async function fetchData(link) {

    try{

         
        const response = await fetch(link);

        if(!response.ok){
            throw new Error("Could not fetch resource");
        }

        const data = await response.json();
        return data;
    }
    catch(error){
        console.error(error);
    }
}

function shuffleLetters(letters) {
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); 
        [letters[i], letters[j]] = [letters[j], letters[i]]; 
    }
}

function setLetters(letters, anchor) {
    
    anchorLetter.textContent = anchor.toLocaleUpperCase();

    for (let i = 0; i < 6; i++) {
        allLetterBoxes[i].textContent = letters[i];
    }
}

function checkWord() {
    const currentWord = guessBox.textContent.toLocaleLowerCase();

    if(checkInvalid(currentWord)) {
        showAlert('NOT A REAL WORD!');
    } else if(!checkInvalid(currentWord)){

        if (correctWords.includes(currentWord.toLocaleUpperCase())) {
            showAlert('WORD ALREADY GUESSED!')
        
        } else if (currentWord.length > 3 && currentWord.includes(anchor)) {
            
            if(checkPangram(currentWord.toLocaleUpperCase())){
                showAlert('PANGRAM!')
                currentScore += evaluateWord(currentWord, true);
            } else{
                showAlert('GOOD ONE!');
                currentScore += evaluateWord(currentWord, false);
            }
            
            correctWords.push(currentWord.toLocaleUpperCase());
            

            listCorrects();
            displayScore(currentScore);

        } else if (!(currentWord.includes(anchor))) {
            showAlert('WORD MUST INCLUDE THE ANCHOR LETTER!');
            
            
        } else if (currentWord.length <= 3) {
            showAlert('WORD MUST BE AT LEAST 4 LETTERS LONG!');
            
        }
    }

    guessBox.textContent = '';
}

function listCorrects() {
    correctsList.innerHTML = '';
    wordCounter.innerHTML = `YOU HAVE FOUND ${correctWords.length} WORD`;
    if (correctWords.length >1) {
        wordCounter.innerHTML += 'S';
    }

    for(const correctWord of correctWords) {
        let listItem = document.createElement('p');
        listItem.textContent = correctWord.toLocaleUpperCase();
        listItem.classList.add('list-item');
        correctsList.appendChild(listItem);
    }
}

function checkInvalid(word) {
    if (word.length > 1 && dict[word] == 1) {
        return false;
    } else {return true;}
}

function checkPangram(word) {

    //quicker than for loop
    if(word.length < 7) {
        return false;
    }

    for(let letter of letters) {
        if(!(word.includes(letter))) {
            return false
        }
    }

    return true;
}

function showAlert(message) {
    alertMessage.textContent = '';
    alertMessage.textContent = message;
    alertMessage.classList.add('show');

    setTimeout(() => {
        alertMessage.classList.remove("show");
    }, 500);
}

function evaluateWord(word, isPangram) {
    let baseScore = word.length;

    if(isPangram) {
        return baseScore * 2;
    }

    return baseScore;
}

async function submitScore(user, score) {
    const submitData = {
        user: user,
        score: score
    };
    
    try{

            
        const response = await fetch(`${window.location.origin}/api/submit-score`, {
            method: 'POST',

            headers: {
                'Content-type': 'application/json'
            },
            
            body: JSON.stringify(submitData)
        });

        if(!response.ok){
            throw new Error("Could not fetch resource");
        }

        const data = await response.json();
        console.log(data.message);
    }
    catch(error){
        console.error(error);
    }
}

function displayScore(score) {
    
    for(const scoreBox of scoreBoxes){
        scoreBox.textContent = `SCORE: ${score}`;
    }
}

async function fillLeaderboard() {
    nameColumn.innerHTML = '';
    scoreColumn.innerHTML = '';

    let topScores = await fetchData('/api/top-10');

    for(const entry of topScores) {
        const user = entry.user;
        const score = entry.score;

        const nameItem = document.createElement('p');
        nameItem.textContent = user;
        nameItem.classList.add('list-item');

        const scoreItem = document.createElement('p');
        scoreItem.textContent = score;
        scoreItem.classList.add('list-item');

        nameColumn.appendChild(nameItem);
        scoreColumn.appendChild(scoreItem);
    }
}