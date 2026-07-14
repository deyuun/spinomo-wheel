import { getRGB } from './utils.js';

const presets = {
  workout: [
    'Running',
    'Cycling',
    'Swimming',
    'Weights',
    'Boxing',
    'Jump Rope'
  ]
}

const options = [];

function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, duration)
}
// Preset
async function loadPreset() {
  const presetSelect = document.getElementById('presets');
  const selectedPreset = presetSelect.value;
  console.log('Loading preset:', selectedPreset, 'Options count:', options.length);

  try {
    clearOptions();

    if (selectedPreset === 'custom') {
      const savedOption = localStorage.getItem('spinomoCustomPreset');

      if (!savedOption) {
        showToast('No custom preset saved yet!');
        return;
      }

      const optionsToLoad = JSON.parse(savedOption);
      for (const option of optionsToLoad) {
        await addPresetOption(option);
      }
    }
    else if (selectedPreset === 'workout') {
      for (const option of presets.workout) {
        await addPresetOption(option);
      }
    }

    displayOptions();

    if (options.length > 0 ) {
      showToast('Preset loaded succesfully');
    }
  }
  catch (error) {
    console.error('Error loading preset:', error);
    showToast('Failed to load preset');
  }
}


function savePreset() {
  if (options.length === 0) {
    showToast(`No options to save`);
    return;
  }

  const optionsToSave = options.map(opt => opt.text);
  localStorage.setItem('spinomoCustomPreset', JSON.stringify(optionsToSave));
  showToast('Custom set saved successfully!');
}

// Functions for Input option
async function addOption(inputID) {
  let inputElement = document.getElementById(inputID);
  const value = inputElement.value.trim();

  if (value && options.length < 10 && !options.some(option => option.text === value)) {
    const color = await getRGB();
    options.push({ text: value, color });
    inputElement.value = '';
    displayOptions();
    drawWheel();
    inputElement.focus();
  }
  else if (!value) {
    showToast('Please enter a valid option.');
    inputElement.focus();
  }
  else if (options.some(option => option.text === value)) {
    showToast("You can't add the same option twice :(")
    inputElement.value = '';
    inputElement.focus();
  }
  else if (options.length >= 10) {
    showToast('Sorry you can only add up to 10 options :(');
    inputElement.focus();
  }
}

async function displayOptions() {
  const optionsList = document.getElementById('optionsList');
  optionsList.innerHTML = '';

  
  for (const option of options) {
    const li = document.createElement('li');
    li.className = 'optionItem';
    const text = document.createTextNode(option.text);
    li.appendChild(text);

    try {
      li.style.backgroundColor = 'transparent';
    }
    catch (error) {
      console.error('Error fetching RGB values:', error);
    }
    

    const button = document.createElement('button');
    button.textContent = 'X';
    button.addEventListener('click', () => removeOption(option.text));
    button.className = 'remove-option-button';
    
    li.appendChild(button);
    optionsList.appendChild(li);
    console.log('Options: ', options);
  }
}

async function addPresetOption(option) {
  const optionList = document.getElementById('optionsList');
  const li = document.createElement('li');
  li.className = 'optionItem loading';
  li.textContent = option;

  try {
    const color = await getRGB();
    options.push({text: option, color });
    drawWheel();
  }
  catch (error) {
    console.error('Error fetching RGB values:', error);
  }

  const button = document.createElement('button');
  button.textContent = 'X';
  button.addEventListener('click', () => {
    removeOption(option);
  });
  button.className = 'remove-option-button';

  li.appendChild(button);
  optionList.appendChild(li); 
}

function clearOptions() {
  options.length = 0;
  displayOptions();
  drawWheel();
}

function removeOption(optionText) {
  const index = options.findIndex(opt => opt.text === optionText)
  if (index > -1) {
    options.splice(index, 1);
    displayOptions();
    drawWheel();
  }
}

// Wheel

const wheel = document.getElementById('wheel');
const context = wheel.getContext('2d');

async function drawWheel() {
  context.clearRect(0, 0, wheel.width, wheel.height);
  if (options.length === 0) return;

  const eachAngle = 2 * Math.PI / options.length;
  const centerX = wheel.width / 2;
  const centerY = wheel.height / 2;
  const radius = Math.min(centerX, centerY);
  

  const colors = [];
  for (let i = 0; i < options.length; i++) {
    const { text, color } = options[i];
    const startAngle = i * eachAngle;
    const endAngle = startAngle + eachAngle;
    colors.push(color);
    const textAngle = startAngle + eachAngle / 2;

    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, endAngle); 
    context.fillStyle = color;
    context.fill();

    context.save();
    context.translate(centerX, centerY);
    context.rotate(textAngle);
    context.textAlign = 'center';
    context.fillStyle = 'black';
    context.font = '16px Arial';
    context.fillText(text, radius * 0.65, 0);
    context.restore();
  }
}

const spinSound = new Audio('sounds/spinsounds.mp3')
const winnerSound = new Audio('sounds/winnersound.mp3');
spinSound.volume = 0.1;
let currentRotation = 0;
let isSpinning = false;

function spin() {
  if (isSpinning) {
    return;
  }
  if (options.length === 0) {
    showToast('Add some option first');
    return;
  }

  isSpinning = true;
  spinSound.play();
  // Random color
  const fullSpins = Math.floor(Math.random() * 5) + 5;
  const anglePerOption = 360 / options.length;
  // Spin unpredictable
  const extraAngle = Math.random() * 360;
  
  const totalRotation = fullSpins * 360 + extraAngle;

  currentRotation += totalRotation;

  const wrapper = document.querySelector('.wheel-wrapper');
  wrapper.style.transition = 'transform 3s ease-out';
  wrapper.style.transform = `rotate(${currentRotation}deg)`;

  
  setTimeout(() => {
    // Get the final rotation position after animation completes
    const normalRotate = currentRotation % 360;
    
    // Canvas coordinate system: 0 = right (3 o'clock), 90 = bottom, 180 = left, 270 = top
    // Our pointer is positioned at the top of the wheel, which is 270° in canvas coordinates
    const pointerPosition = 270;
    
    // Calculate which wheel segment is currently under the pointer
    // We subtract the wheel's rotation from the pointer position to find the segment
    const adjustedAngle = (pointerPosition - normalRotate) % 360;
    
    // Handle negative angles by converting them to positive (0-360 range)
    const positiveAngle = adjustedAngle < 0 ? adjustedAngle + 360 : adjustedAngle;
    
    // Divide by angle per option to find which segment index is at the pointer
    // Use modulo to ensure we stay within the bounds of the options array
    const indexAtPointer = Math.floor(positiveAngle / anglePerOption) % options.length;

    // Display the winning option
    const result = options[indexAtPointer];
    document.getElementById('result').textContent = `You got: ${result.text}! 🚀`;

    winnerSound.play();
    isSpinning = false;
  }, 3000);
}

window.addOption = addOption;
window.clearOptions = clearOptions;
window.removeOption = removeOption;
window.displayOptions = displayOptions;
window.spin = spin;
window.savePreset = savePreset;
window.loadPreset = loadPreset;