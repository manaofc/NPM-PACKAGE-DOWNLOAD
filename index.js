const express = require('express');
const axios = require('axios');
const AdmZip = require('adm-zip');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

// Homepage with form
app.get('/', (req, res) => {
    res.send(`
        <h1>NPM Package Downloader as ZIP</h1>
        <form method="POST" action="/download">
            <input type="text" name="packageName" placeholder="Enter npm package name" required/>
            <button type="submit">Download as ZIP</button>
        </form>
    `);
});

// Handle package download
app.post('/download', async (req, res) => {
    const { packageName } = req.body;

    if (!packageName) {
        return res.send('Package name is required.');
    }

    try {
        // Get latest package info from npm registry
        const { data } = await axios.get(`https://registry.npmjs.org/${packageName}/latest`);
        const tarballUrl = data.dist.tarball;

        // Download tarball as ArrayBuffer
        const response = await axios.get(tarballUrl, { responseType: 'arraybuffer' });
        const tgzBuffer = Buffer.from(response.data);

        // Create ZIP and add tarball inside
        const zip = new AdmZip();
        zip.addFile(`${packageName}.tgz`, tgzBuffer);
        const zipBuffer = zip.toBuffer();

        // Send ZIP to client
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename=${packageName}.zip`,
            'Content-Length': zipBuffer.length
        });
        res.send(zipBuffer);

    } catch (err) {
        console.error(err);
        res.send('Error: Package not found or failed to download.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
