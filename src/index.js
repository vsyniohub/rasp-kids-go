const inquirer = require('inquirer');
const chalk    = require('chalk');
const Pet      = require('./pet');
const { render }              = require('./display');
const { detectPlayStationPad } = require('./pad');
const { PadSession }           = require('./pad-input');

async function promptName() {
  const { name } = await inquirer.prompt([{
    type:     'input',
    name:     'name',
    message:  chalk.yellowBright('Name your pet:'),
    default:  'Buddy',
    validate: n => n.trim().length > 0 || 'Please enter a name!',
  }]);
  return name.trim();
}

// Returns true if user quit voluntarily, false if pet died
async function playGame(pet) {
  let message = pet.age === 0
    ? `${pet.name} has just hatched! Welcome home!`
    : `${pet.name} is happy to see you!`;

  while (true) {
    pet.tick();
    render(pet, message);
    message = '';

    if (!pet.isAlive) {
      await inquirer.prompt([{
        type:    'input',
        name:    '_',
        message: chalk.red('Press Enter to continue...'),
      }]);
      return false;
    }

    const { action } = await inquirer.prompt([{
      type:    'list',
      name:    'action',
      message: chalk.yellowBright('What would you like to do?'),
      choices: [
        { name: '  Feed     — fill the tummy',  value: 'feed'  },
        { name: '  Play     — boost happiness', value: 'play'  },
        { name: '  Sleep    — restore energy',  value: 'sleep' },
        { name: '  Clean    — improve health',  value: 'clean' },
        { name: '  Quit',                        value: 'quit'  },
      ],
    }]);

    if (action === 'quit') {
      pet.save();
      return true;
    }

    message = pet[action]();
    pet.save();
  }
}

const PAD_ICON = {
  feed:  chalk.blueBright('✕'),
  play:  chalk.redBright('○'),
  sleep: chalk.magentaBright('□'),
  clean: chalk.greenBright('△'),
};

async function runPadGame(pet, pad) {

  let message = pet.age === 0
    ? `${pet.name} has just hatched! Welcome home!`
    : `${pet.name} is happy to see you!`;

  while (pet.isAlive) {
    pet.tick();
    render(pet, message, true);
    message = '';

    const action = await pad.waitForAction();

    if (action === 'quit') {
      pet.save();
      pad.close();
      console.clear();
      console.log(chalk.cyanBright.bold(`\n  Goodbye! ${pet.name} will miss you!\n`));
      return;
    }

    message = `${PAD_ICON[action]}  ${pet[action]()}`;
    pet.save();
  }

  render(pet, `${pet.name} didn't make it...`, true);
  await pad.waitForAction();
  pad.close();
}

// Returns an open PadSession if user wants to use pad, null otherwise
async function checkForPad() {
  const pad = detectPlayStationPad();
  if (!pad) return null;

  console.log(chalk.greenBright(`\n  PlayStation pad detected: ${pad.name}`));
  const { usePad } = await inquirer.prompt([{
    type:    'confirm',
    name:    'usePad',
    message: chalk.yellowBright('Use it to control Gochi?'),
    default: true,
  }]);

  if (!usePad) return null;

  // Open device immediately — macOS GCF will claim it if we wait
  return new PadSession();
}

async function main() {
  const padSession = await checkForPad();

  while (true) {
    console.clear();

    let pet = Pet.load();

    if (padSession) {
      if (!pet || !pet.isAlive) {
        if (pet && !pet.isAlive) {
          render(pet, `${pet.name} has passed away...`);
          console.log('');
        } else {
          console.log(chalk.bold.cyanBright('\n  Welcome to Gochi!\n  Your digital friend is waiting...\n'));
        }
        const name = await promptName();
        pet = new Pet(name);
        pet.save();
      }
      await runPadGame(pet, padSession);
      return;
    }

    if (!pet) {
      console.log(chalk.bold.cyanBright('\n  Welcome to Gochi!\n  Your digital friend is waiting...\n'));
      const name = await promptName();
      pet = new Pet(name);
      pet.save();
    } else if (!pet.isAlive) {
      render(pet, `${pet.name} has passed away...`);
      console.log('');
      const { restart } = await inquirer.prompt([{
        type:    'confirm',
        name:    'restart',
        message: chalk.yellowBright('Start fresh with a new pet?'),
        default: true,
      }]);
      if (!restart) {
        console.log(chalk.gray('\n  Goodbye!\n'));
        return;
      }
      const name = await promptName();
      pet = new Pet(name);
      pet.save();
    }

    const quit = await playGame(pet);

    if (quit) {
      console.clear();
      console.log(chalk.cyanBright.bold(`\n  Goodbye! ${pet.name} will miss you!\n`));
      return;
    }

    // Pet died — offer restart
    const { restart } = await inquirer.prompt([{
      type:    'confirm',
      name:    'restart',
      message: chalk.yellowBright('Start fresh with a new pet?'),
      default: true,
    }]);
    if (!restart) {
      console.log(chalk.gray('\n  Goodbye!\n'));
      return;
    }
    // Loop again → creates a new pet
  }
}

main().catch(err => {
  console.error(chalk.red('\nSomething went wrong:'), err.message);
  process.exit(1);
});
