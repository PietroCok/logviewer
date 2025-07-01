import fs from 'node:fs';
import chalk from 'chalk';
import prompts from 'prompts';
import config from './config.json' with { type: "json" };

// Function to manipulate new content
function manipulateContent(content) {
  // split content line by line
  const lines = content.split(/\r?\n/);

  const output = [];

  for (let line of lines) {
    // Ignore empty lines
    if (line.trim() == '') {
      continue;
    }

    // choose color, keep old one if not needed
    color_config.currentColor = getLineColor(line) || color_config.currentColor;

    // apply color if needed
    line = applyColor(line, color_config.currentColor?.color);

    // insert into output buffer
    output.push(line);

    // reset color if should not be kept
    if (!color_config.currentColor?.keep) {
      color_config.currentColor = color_config.prevColor?.keep ? color_config.prevColor : null;
    }
  }

  return output;
}

/**
 * Return new line color or null 
 */
function getLineColor(line) {
  let color = null;

  // also skip lines in stacktraces
  if (!line.trim().startsWith("at") && color_config.colors) {
    for (const cc of color_config.colors) {
      // can use keyword as string or regex
      if (cc.keyword.startsWith("/")) {
        // convert string to regex (removing also first and last '/')
        const regex = new RegExp(cc.keyword.slice(1, -1))
        if (regex.test(line)) {
          color = cc;
        }
      } else {
        if (line.includes(cc.keyword)) {
          color = cc;
        }
      }
    }
  }
  return color;
}

/**
 * Applies the color to the text, supports both chalk functions and hex formatted colors
 * @param {String} text text to be colored
 * @param {String} color chalk function or hex formatted color (must start with '#')
 * @returns Colored text
 */
function applyColor(text, color) {
  if (!color) return text;

  if (color.startsWith("#")) {
    // hex color
    text = chalk.hex(color)(text);
  } else {
    try {
      text = chalk[color](text);
    } catch (unsopported_color) { }
  }

  return text;
}

/**
 * Watches a file for changes
 * @param {String} filePath - path of the file to watch
 * @param {Number} [interval=2000] - Time (ms) between a check and the next
 */
function watchFile(filePath, interval = 500) {
  // Track the last known size of the file
  let lastFileSize = 0;

  try {
    const stats = fs.statSync(filePath);

    if (stats.size > 0) {
      lastFileSize = stats.size;
    }
  } catch (err) {
    if (err.code == "ENOENT") {
      console.error(chalk.red(`Requested file NOT found: ${filePath}`));
      process.exit(1);
    } else {
      console.error(err);
    }
    return;
  }

  // Watch the file for changes
  fs.watchFile(filePath, { interval: interval }, (curr, prev) => {
    // If the file size has increased, it means new content has been added
    if (curr.size > lastFileSize) {
      // Read only the new data that has been added
      const stream = fs.createReadStream(filePath, {
        start: lastFileSize,
        end: curr.size - 1,
        encoding: 'utf8'
      });

      let newContent = '';

      // Read the new content chunk
      stream.on('data', (chunk) => {
        newContent += chunk;
      });

      // Once we have the new content, manipulate and output it
      stream.on('end', () => {
        const manipulatedContent = manipulateContent(newContent);
        for (const line of manipulatedContent) {
          console.log(line);
        }
      });

      // Update the last known size of the file
      lastFileSize = curr.size;
    }
  });
}

// Checks if there is a placeholder in the string and replace
function checkPlaceholder(string) {
  // replace date with current date
  if (string.indexOf("{date}")) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    return string.replace("{date}", today);
  }
}

// get color configuration for the selected application
function loadColorConfig(app) {
  const colors = app.logs.colors;
  if (!colors) {
    return [];
  }
  if (colors === true) {
    return config.colors || [];
  }
  return colors || [];
}

// Custom hotkeys mapping for custom actions
function mapHotKeys() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (key) => {
    // CTRL + C
    if (key === '\u0003') {
      console.clear();
      process.exit();
    }

    if (key == "c") {
      _clear();
      return;
    }

    //console.log(key)
  });
}

function _clear() {
  console.clear();
  console.log(`Watching file: ${log_full_path} for new content...`);
}

// Retrieve applications informations
const app_options = config.applications.map(app => {
  return {
    "title": app.name_view,
    "value": app
  }
});

// Wait for user to select the application
const app_sel = await prompts({
  type: 'select',
  name: 'choice',
  message: 'Applicazione',
  choices: app_options
});
const app = app_sel.choice;

// Retrieve colors configuration for the selected application
const color_config = {
  "colors": loadColorConfig(app),
  "prevColor": null,
  "currentColor": null
}

// Retrieve logs information for the selected application
const log_options = app.logs.files.map(log => {
  return {
    "title": log.name_view,
    "value": log
  }
})

// Wait for user to select the log file
const log_sel = await prompts({
  type: 'select',
  name: 'choice',
  message: 'Log',
  choices: log_options
});
const log = log_sel.choice;
// Replace placeholder keywords if present
log.name_real = checkPlaceholder(log.name_real);

// Calculate log full path
const base_folder = app.folder;
const log_folder = app.logs.folder;
let title = app.name_real + "-" + log.name_real;
const log_full_path = `${base_folder}/${app.name_real}/${log_folder}/${log.name_real}`.replaceAll("//", "/");

mapHotKeys();

process.stdout.write('\x1b]0;' + title + '\x07');
watchFile(log_full_path);
_clear();
