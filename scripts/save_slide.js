#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Arguments:
// process.argv[2] = route (e.g., "mySlide")
// process.argv[3] = JSON string of the data

const route = process.argv[2];
let jsonData = process.argv[3];

console.log(route,jsonData)
// Construct a target file path. For example, 
// if route is "mySlide" this will save to ./content/mySlide.json
const targetPath = path.resolve(route);

// Write the JSON data to the file
try {
  fs.writeFileSync(targetPath, jsonData, 'utf-8');
  console.log(`Slide saved successfully`);
} catch (err) {
  console.error(`Failed to save data for route "${route}":`, err);
  process.exit(1);
}