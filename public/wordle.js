const rowCount = 6;
const letterCount = 5;
let currentRow = 0;
let guess = new Array(letterCount).fill('');

const wordData = await fetchData('https://random-word-api.vercel.app/api?words=1&length=5');
const word = wordData ? wordData[0] : 'apple';

const gameButton = document.querySelector('.wordle-button');

let wordLetters = new Array(26).fill(0); 

for(let letter of word) {
    wordLetters[letter.charCodeAt(0) - 97] ++;
    
}

let prev = 0;


buildBoard();


gameButton.addEventListener('click', () => {
    window.scrollTo({top: document.querySelector('.wordle').offsetTop  - 150, behavior: 'smooth' });
});


//functions

function buildBoard() {
    const board = document.querySelector('.wordle-box');
    for (let i = 0; i < rowCount; i++) {
        const row = document.createElement('div');
        row.className = 'wordle-row';
        row.setAttribute('row-index', i);

        for (let j = 0; j < letterCount; j++) {
            const letterBox = document.createElement('input');
            letterBox.className = 'letter-box';
            letterBox.setAttribute('maxlength', '1');
            letterBox.setAttribute('oninput', 'this.value = this.value.toUpperCase()')
            letterBox.setAttribute('letter-index', j);
            letterBox.disabled = i !== currentRow;
            letterBox.addEventListener('input', getInput);
            letterBox.addEventListener('keydown', backTrack);
            row.appendChild(letterBox);
        }
        board.appendChild(row);
    }
}

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

async function getInput(inputEvent) {
    const letterBox = inputEvent.target;
    const row = letterBox.parentElement;
    const col = parseInt(letterBox.getAttribute('letter-index'));

    if(letterBox.value == ''){
        return;
    } else guess[col] = letterBox.value;
    if (col < letterCount - 1) {
        row.children[col + 1].focus();
    } else {
        await checkGuess();
    }
}

function backTrack (event){
    
    if(event.key == 'Backspace'){
    
        const letterBox = this;
        const row = letterBox.parentElement;
        const col = parseInt(letterBox.getAttribute('letter-index'));

        if(letterBox.value !== ''){
            letterBox.value = '';
        } 
        else if(col > 0){
            row.children[col-1].focus();
        }
    }
}

async function checkGuess() {
    const activeRow = document.querySelector(`[row-index="${currentRow}"]`);
    const allLetterBoxes = document.querySelectorAll('.letter-box');

    let guessLetters = new Array(26).fill(0);

    let prevYellow;

    const currentGuess = guess.join('').toLowerCase();
    if (currentGuess.length !== letterCount) {
        return;
    }

    const isInvalid = await checkInvalid(currentGuess);
    if(isInvalid){
        for (const letterBox of activeRow.children) {
            letterBox.classList.add('red');
            letterBox.blur();
        }
        return;
    }
 
    for (let i = 0; i < letterCount; i++) {
        const letter = currentGuess[i];
        const letterBox = activeRow.children[i];
        
        if (letter === word[i]) {
            guessLetters[letter.charCodeAt(0) - 97] ++;
            letterBox.classList.remove('red');
            letterBox.classList.add('green');

            let removedYellows = guessLetters[letter.charCodeAt(0) - 97] - wordLetters[letter.charCodeAt(0) - 97];
    
            for (let j = i-1; j >= 0; j--) {
                const prevBox = activeRow.children[j];
             
                if (removedYellows === 0) {
                    break;
                }
                if (currentGuess[i] === currentGuess[j]){
                    prevBox.classList.remove('yellow');
                    removedYellows--;
                }
            }

        } else if (word.includes(letter)) {
            
            letterBox.classList.remove('red');

            if(wordLetters[letter.charCodeAt(0) - 97] > guessLetters[letter.charCodeAt(0) - 97]){

                letterBox.classList.add('yellow');
            }
            guessLetters[letter.charCodeAt(0) - 97] ++;
            prev = i;
            
        } else {
            letterBox.classList.remove('red');  
        }
    }
 
    if (currentGuess === word) {
        endGame(true);
    } 
    
    else if (currentRow === rowCount - 1) {
        endGame(false);
        console.log(`The word was ${word}`);
    } 
    
    else {
        currentRow++;
        guess = new Array(letterCount).fill('');  
        nextRow();
    }
}

async function checkInvalid(word) {
    const res = await fetch(`/api/validate-word?word=${word.toLocaleLowerCase()}`);
    const data = await res.json();
    return !data.valid;
}

function nextRow() {
    const nextRow = document.querySelector(`[row-index="${currentRow}"]`);
    const previousRow = document.querySelector(`[row-index="${currentRow - 1}"]`);

    if (previousRow) {
        Array.from(previousRow.children).forEach(box => box.disabled = true);
    }

    Array.from(nextRow.children).forEach(box => box.disabled = false);
    nextRow.children[0].focus();
}

function endGame(isWin) {
    document.querySelectorAll('.letter-box').forEach(box => {
        box.disabled = true;
    });

    //need to add some actual win responses later

    if (isWin) {
        console.log('Congratulations! You guessed the word!');
    } else {
        console.log('You lost! Better luck next time.');
    }
}

