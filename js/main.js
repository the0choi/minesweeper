/*----- constants -----*/
const GAME_MODE = {
    easy: {rows: 9, cols: 9, mines: 10},
    medium: {rows: 16, cols: 16, mines: 40},
    hard: {rows: 22, cols: 22, mines: 99},
}
const CELL_NUMS = [1, 2, 3, 4, 5, 6, 7, 8]

/*----- state variables -----*/
let timer; // count seconds from 000
let difficulty; // 'easy', 'medium', 'hard'
let flags; // remaining flags that can be placed

/*----- cached elements  -----*/
const start = document.querySelector('#start-screen');
const gridContainer = document.getElementById('game-grid')
const flagEl = document.getElementById('flags').querySelector('span')
const timerEl = document.getElementById('timer').querySelector('span')
const helpButtonEl = document.getElementById('help')
const helpEl = document.getElementById('help-popup')
const newGameEl = document.getElementById('button1')
const difficultyEl = document.getElementById('button2')
const gameOverEl = document.getElementById('game-over')
const gameWonEl = document.getElementById('game-won')
const closeButtonEl = document.getElementById('close-button')
const closeWonButtonEl = document.getElementById('won-close-button')
const helpCloseButtonEl = document.getElementById('help-close-button')

/*----- event listeners -----*/

// Fades away start screen
start.addEventListener('click', (e) => {
    e.target.parentNode.classList.add('fade-out')
    setTimeout( () => {
        e.target.parentNode.remove()
        document.querySelector('.hidden').classList.remove('hidden')
    }, 500)
});

// Resets game
newGameEl.addEventListener('click', init)

// Opens a cell
gridContainer.addEventListener('click', openCell)

// Flags a cell
gridContainer.addEventListener('contextmenu', flagCell)

// Starts timer once first cell is opened
gridContainer.addEventListener('click', startTimer)

// Closes game over pop up
closeButtonEl.addEventListener('click', closePopUp)
closeWonButtonEl.addEventListener('click', closeWonPopUp)

// Opens help pop up
helpButtonEl.addEventListener('click', helpPopUp)

// Closes help pop up
helpCloseButtonEl.addEventListener('click', helpClosePopUp)

// Changes difficulty and grid

difficultyEl.addEventListener('click', changeDifficulty)

/*----- functions -----*/
init()
swing(start);


function init() {

    timer = 0
    cellsOpened = 0

    if (!difficulty) difficulty = 'medium'

    flags = GAME_MODE[difficulty].mines

    // Resets grid if already existing
    if (gridContainer.childNodes) {
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild)
        }
    }

    // Generate game grid
    for (let row = 0; row < GAME_MODE[difficulty].rows; row++) {
        for (let col = 0; col < GAME_MODE[difficulty].cols; col++) {
            const cell = document.createElement('div')
            cell.dataset.row = row
            cell.dataset.col = col
            cell.classList.add('cell')
            cell.dataset.status = 'closed'

            gridContainer.appendChild(cell)
        }
    }

    flagEl.innerText = parseInt(flags)

    addMinesToGrid()
    addNumsToGrid()

    render()
}

function render() {

    // Displays grid of game
    gridContainer.style.display = 'grid'
    gridContainer.style.gridTemplateRows = `repeat(${GAME_MODE[difficulty].rows}, 1fr`
    gridContainer.style.gridTemplateColumns = `repeat(${GAME_MODE[difficulty].cols}, 1fr`
    gridContainer.style.alignItems= 'center'
    gridContainer.style.justifyItems= 'center'
    gridContainer.style.gap = 1;

    const head = document.querySelector('header')
    head.classList.add('h')
    
}

function addMinesToGrid() {
    
    let gridSize = gridContainer.childNodes.length
    let cellIndices = Array.from( {length: gridSize}, (_, index) => index);

    // Random shuffle algorithm
    cellIndices.sort( () => Math.random() - 0.5)

    for (let i = 0; i < GAME_MODE[difficulty].mines; i++) {
        gridContainer.childNodes[cellIndices[i]].dataset.type = 'mine'
    }
}

function addNumsToGrid() {
    gridContainer.childNodes.forEach( function(cell) {

        const mineNum = checkSurroundingMines(cell)
        if (mineNum) {
            cell.dataset.type = mineNum
        }    
    })
}

function checkSurroundingMines(cell) {

    if (cell.dataset.type === 'mine') return null // Skip mine cells

    const row = parseInt(cell.dataset.row)
    const col = parseInt(cell.dataset.col)
    let mineCount = 0

    for (let i = row - 1; i <= row + 1; i++) {
        for (let j = col - 1; j <= col + 1; j++) {
            if (i === row && j === col) continue // Skip the target cell

            const neighborCell = gridContainer.querySelector(`[data-row="${i}"][data-col="${j}"]`)
            
            if (neighborCell && neighborCell.dataset.type === 'mine') mineCount++
        }
    }
    return mineCount
}

function openCell(e) {
    if (e.target.dataset.status === 'flagged' ||
    e.target.dataset.status === 'opened') return // Disable for flag/opened cells

    let datasetValue = e.target.dataset.type

    if (datasetValue === 'mine') {
        gridContainer.childNodes.forEach( function(cell) {
            if (cell.dataset.type === 'mine') {
                cell.style.backgroundColor = 'black'
            }
        e.target.style.backgroundColor = 'red'
        gameOver()
        })
    } else if (CELL_NUMS.includes(parseInt(datasetValue))) {
        e.target.style.backgroundColor = 'grey'
        e.target.innerText = datasetValue
        e.target.dataset.status = 'opened'
    } else if (!datasetValue) {
        flood(e.target)
    }

    checkWin()

}

function flagCell(e) {
    e.preventDefault() 

    if (e.target.dataset.status === 'flagged') {
        e.target.innerText = ''
        e.target.dataset.status = 'closed'
        flagEl.innerText++
    } else if (e.target.dataset.status === 'closed' 
        && flagEl.innerText > 0) {
        e.target.innerText = '🚩'
        e.target.dataset.status = 'flagged'
        flagEl.innerText--
    }  
}

function flood(cell) {

    cell.dataset.status = 'opened'
    cell.style.backgroundColor = 'lightblue'


    let row = parseInt(cell.dataset.row)
    let col = parseInt(cell.dataset.col)

    const directions = [
        {row: row - 1, col: col}, // up
        {row: row + 1, col: col}, // down
        {row: row, col: col - 1}, // left
        {row: row, col: col + 1}  // right
    ];

    for (const direction of directions) {
        const neighborCell = gridContainer.querySelector(`[data-row="${direction.row}"][data-col="${direction.col}"]`)

        if (neighborCell && !neighborCell.dataset.type && neighborCell.dataset.status === 'closed') {
            neighborCell.dataset.status = 'opened'
            neighborCell.style.backgroundColor = 'lightblue'
            flood(neighborCell)   
        }

    }

    // Open the numbered cells on the border of the opened flood cells

    for (let i = row - 1; i <= row + 1; i++) {
        for (let j = col - 1; j <= col + 1; j++) {
            if (i === row && j === col) continue // Skip the target cell

            const neighborNumCell = gridContainer.querySelector(`[data-row="${i}"][data-col="${j}"]`)

            if (neighborNumCell && neighborNumCell.dataset.type !== 'mine' && neighborNumCell.dataset.status === 'closed') {

                if (!neighborNumCell.dataset.type) {
                    flood(neighborNumCell)

                    continue
                }

                neighborNumCell.innerText = neighborNumCell.dataset.type
                neighborNumCell.dataset.status = 'opened'
                neighborNumCell.style.backgroundColor = 'grey'
            }
        }
    } 
}

function startTimer() {
    if (timer === 0) {
        setInterval( () => {
            timer++
            let timerString = timer.toString().padStart(3, '0')
            timerEl.innerText = timerString
        }, 1000)
    }
}

function gameOver() {
    gameOverEl.classList.add('fade-in')

    gridContainer.childNodes.forEach( function(cell) {
        if (cell.dataset.status === 'closed')
        cell.dataset.status = 'opened'
    })
}

function checkWin() {
    const totalCellsToOpen = GAME_MODE[difficulty].rows * GAME_MODE[difficulty].cols - GAME_MODE[difficulty].mines

    let openedCells = 0

    gridContainer.childNodes.forEach( function(cell) {
        if (cell.dataset.status === 'opened') openedCells++
    })
    if (openedCells === totalCellsToOpen) {
        gameWonEl.classList.add('fade-in')
    }
}

function closePopUp() {
    gameOverEl.classList.remove('fade-in')
    init()
}

function closeWonPopUp() {
    gameWonEl.classList.remove('fade-in')
    init()
}

function helpClosePopUp() {
    helpEl.classList.remove('fade-in')
}

function helpPopUp() {
    helpEl.classList.add('fade-in')
}

function changeDifficulty() {
    if (difficulty === 'easy') {
        difficulty = 'medium'
    } else if (difficulty === 'medium') {
        difficulty = 'hard'
    } else {
        difficulty = 'easy'
    }
    init()
}

// Start screen with rotating logo
function swing(element) {
    function update(time) {
        const x = Math.sin(time / 1231) * 20;
        const y = Math.sin(time / 1458) * 20;

        element.style.transform = [
            `rotateX(${x}deg)`,
            `rotateY(${y}deg)`
        ].join(' ');
        requestAnimationFrame(update);
    }
    update(0);
}