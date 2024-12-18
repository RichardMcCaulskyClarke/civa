import path from 'node:path'
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const slideToolbarIntegration = {
  name: 'slide-toolbar',
  hooks: {
    'astro:config:setup': ({ addDevToolbarApp }) => {
      addDevToolbarApp({
        id: 'slide-toolbar',
        name: 'Slide Data Viewer',
        icon: '📄',
        entrypoint: fileURLToPath(new URL('./slideTools-client.js', import.meta.url)),
      });
    },
    'astro:server:setup': ({ toolbar }) => {
      toolbar.on('update-slide-data', (slide) => {
        // Prepare the route and data for the Node.js script
        const scriptPath = path.resolve('scripts/save_slide.js'); 
        const jsonData = JSON.stringify(slide.data);  // serialize the data object

        // Pass the route and data as arguments to the Node script
        const args = [slide.filePath, jsonData];

        execFile('node', [scriptPath, ...args], (error, stdout) => {
          if (error) {
            console.error('Error executing updateJson.js:', error);
            return;
          }
          console.log('updateJson.js output:', stdout.trim());
        });


      });
    },
  },
};

export default slideToolbarIntegration