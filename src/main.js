// stolen from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffle = (array) => {
  let currentIndex = array.length; let temporaryValue; let
    randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

// solution
const $status = document.querySelector('#status');
const $startBtn = document.querySelector('#startBtn');
const $form = document.querySelector('#form');
const DEFAULT_LIST_LENGTH = 4;
const DELAY = 600;
let LIST = [];
let scoreArr = [];
const DEFAULT_COUNTER = 60;
const STORAGE_KEY = 'winners';
let pairArr = [];
let countDown;
let nowPlayingPairs;

const globUser = {
  name: '',
  pairs: DEFAULT_LIST_LENGTH,
  time: DEFAULT_COUNTER,
};

const setDataStorage = (key, data = []) => localStorage.setItem(key, JSON.stringify(data));
const getDataStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];

const removeEl = (el) => {
  if (el) el.parentNode.removeChild(el);
};

const switchClass = (el, className, switcher) => {
  el.classList[switcher ? 'add' : 'remove'](className);
};

const toggleModal = (switcher) => {
  const $modal = document.querySelector('#modal');

  switchClass($modal, 'b-modal--hide', switcher);
};

const initCardsLength = () => {
  const $nicknameInput = $form.querySelector('#nicknameInput');
  const $inputPairLength = $form.querySelector('#inputLength');
  const $feedback = $form.querySelector('.input__feedback');
  let result = DEFAULT_LIST_LENGTH;

  const isInputNumValid = (value) => +value % 2 === 0 && +value <= 10 && +value > 1;

  const toggleFeedback = (value) => {
    $feedback.classList[isInputNumValid(value) ? 'remove' : 'add']('active');
  };

  $inputPairLength.addEventListener('input', () => toggleFeedback($inputPairLength.value));

  $form.addEventListener('submit', (e) => {
    e.preventDefault();

    result = isInputNumValid($inputPairLength.value) ? $inputPairLength.value : DEFAULT_LIST_LENGTH;
    $inputPairLength.value = result;
    nowPlayingPairs = +result;

    window.startGame(+result, $nicknameInput.value);
    toggleFeedback($inputPairLength.value);
  });
};

const cardListCallback = (call) => {
  document.querySelectorAll('.card').forEach((el) => {
    call(el);
  });
};

const toggleStatus = (bool) => {
  $status.textContent = `YOU ${bool ? 'WIN' : 'LOSE'}`;
};

const fillWinner = (user, inner) => {
  const { name, pairs, time } = user;
  const $tr = document.createElement('tr');

  inner.appendChild($tr);

  const initContent = (content = '', tag = 'td', className = '') => {
    const $el = document.createElement(tag);

    $el.innerHTML = `<span>${content}</span>`;
    $tr.appendChild($el);

    if (className.length) {
      $el.classList.add(className);
    }
  };

  initContent(name, 'th', 'table__body-name');
  initContent(pairs);
  initContent(time);
};

const writeWinnerInStorage = (user) => {
  const winnersArr = getDataStorage(STORAGE_KEY);

  if (winnersArr.length) {
    const doubleName = winnersArr.find((item) => (
      item.name === user.name && item.pairs === user.pairs
    ));

    if (doubleName && user.time > doubleName.time) {
      doubleName.time = user.time;
    } else if (!doubleName) {
      winnersArr.push(user);
    }
  } else {
    winnersArr.push(user);
  }

  setDataStorage(STORAGE_KEY, winnersArr);
};

const initWin = () => {
  writeWinnerInStorage(globUser);
  window.fillListWinners();

  toggleModal(false);
  toggleStatus(true);
  clearInterval(countDown);
  $form.classList.remove('disable');
};

const checkLuck = ($card, title) => {
  $card.addEventListener('click', (e) => {
    e.preventDefault();

    if (pairArr.length < 2) {
      $card.classList.add('card--active');
      pairArr.push({ el: $card, title });
    }

    if (pairArr.length === 2) {
      if (pairArr[0].title === pairArr[1].title) {
        scoreArr.push(...pairArr);

        pairArr.forEach(({ el }) => el.classList.add('card--no-touch'));
      } else {
        pairArr.forEach(({ el }) => {
          setTimeout(() => el.classList.remove('card--active'), DELAY);
        });
      }

      pairArr = [];
    }

    if (scoreArr.length === nowPlayingPairs ** 2) {
      initWin();
    }
  });
};

const createCard = (title, bgColor) => {
  const B = 'card';
  const $card = document.createElement('div');
  const $cardTitle = document.createElement('h2');

  $card.classList.add(B);
  $card.style.backgroundColor = bgColor;

  $cardTitle.classList.add(`${B}__title`);
  $cardTitle.textContent = title + 1;
  $card.append($cardTitle);

  checkLuck($card, title);

  return $card;
};

const randomizeList = (pair) => {
  const arr = [];
  let i = 0;
  const max = (pair ** 2) / 2;

  while (i < max) {
    const randomize = Math.round(Math.random() * (max - 1));

    if (!arr.includes(randomize) || i === 0) {
      arr.push(randomize);
      i++;
    }
  }

  return shuffle([...arr, ...arr]);
};

const generateColors = (max) => {
  const colors = [];

  while (colors.length < max) {
    let color;
    do {
      color = Math.floor(Math.random() * 16777215).toString(16);
    } while (colors.indexOf(color) >= 0);

    colors.push(`#${color}`);
  }

  return colors;
};

const createCardList = (pairs) => {
  const $cardsRow = document.querySelector('.cards-list');
  const colors = generateColors((pairs ** 2) / 2);

  scoreArr = [];
  LIST = randomizeList(pairs);
  cardListCallback((el) => removeEl(el));

  for (const thing of LIST) {
    const $card = createCard(thing, colors[thing]);

    $cardsRow.style.gridTemplateColumns = `repeat(${pairs}, 8vw)`;
    $cardsRow.style.gridTemplateRows = `repeat(${pairs}, 8vw)`;
    $cardsRow.append($card);
  }
};

const startTimer = () => {
  const $timer = document.getElementById('timer');
  let counter = DEFAULT_COUNTER + 1;

  clearInterval(countDown);
  $timer.classList.add('timer--active');

  countDown = setInterval(() => {
    $timer.innerText = --counter;

    globUser.time = counter;

    if (counter <= 0) {
      clearInterval(countDown);
      toggleStatus(false);
      toggleModal(false);
      cardListCallback((el) => el.classList.add('card--no-touch'));
    }
  }, 1000);
};

window.startGame = (list, name) => {
  if (!list) {
    // eslint-disable-next-line no-console
    console.error('NO LIST IN START GAME');
  }

  globUser.name = name;
  globUser.pairs = list;
  startTimer();
  createCardList(list);
  $startBtn.textContent = 'replay';
  toggleModal(true);

  setTimeout(() => {
    switchClass($status, 'status--active', true);
    toggleStatus(false);
  }, DELAY * 2);
};

const toggleModalWinners = () => {
  const $winnersTrigger = document.querySelector('#winnersTrigger');
  const $winnersModal = document.querySelector('#winners');

  $winnersTrigger.addEventListener('click', () => {
    $winnersModal.classList.toggle('winners--active');
  });
};

window.fillListWinners = () => {
  const arr = getDataStorage(STORAGE_KEY);
  const $table = document.querySelector('#winnersTable');
  const $tbody = $table.querySelector('tbody');

  $tbody.innerHTML = '';

  for (const item of arr) {
    fillWinner(item, $tbody);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.fillListWinners();
  initCardsLength();
  toggleModalWinners();
});
