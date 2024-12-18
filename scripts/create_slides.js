import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const slidesDir = path.join(__dirname, '../public/slides');
const outputDir = path.join(__dirname, '../src/content/slide');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to prompt user for confirmation
const promptUser = (message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
};

// Function to create JSON files for each slide
const createSlides = () => {
  // Read the files in the slides directory
  fs.readdir(slidesDir, (err, files) => {
    if (err) {
      console.error('Error reading slides directory:', err);
      return;
    }

    // Filter only PNG files and sort them
    const slideFiles = files.filter(file => file.endsWith('.png')).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/), 10);
      const numB = parseInt(b.match(/\d+/), 10);
      return numA - numB;
    });

    // Process each slide file
    slideFiles.forEach((file,index) => {
      const slideNumber = index; // Extract the number from filename
      const slidePath = `../slides/${file}`;
      const jsonFileName = `Slide${slideNumber}.json`; // Output JSON filename

      // JSON structure
      const jsonContent = {
        uid: crypto.randomUUID(),
        order: slideNumber,
        image: {
          src: slidePath,
          width: 1365,
          height: 1024
        }
      };

      // Save JSON file in output directory
      fs.writeFile(path.join(outputDir, jsonFileName), JSON.stringify(jsonContent, null, 2), (writeErr) => {
        if (writeErr) {
          console.error(`Error writing JSON file for ${file}:`, writeErr);
        } else {
          console.log(`Successfully created JSON for ${file}`);
        }
      });
    });
  });
};

// Main function to run the script
const main = async () => {
  const answer = await promptUser('This is a destructive process. Do you want to proceed? (yes/no): ');

  if (answer === 'yes' || answer === 'y') {
    console.log('Proceeding with the process...');
    createSlides();
  } else {
    console.log('Operation cancelled.');
  }
};

main();