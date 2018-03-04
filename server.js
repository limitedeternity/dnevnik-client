const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const throng = require('throng');
const path = require('path');


const application = () => {
    var instance = express();
    instance.use(helmet());
    instance.use(compression());

    instance.use('/src/assets', express.static(path.join(__dirname + '/src/assets')));  // eslint-disable-line
    instance.use('/dist', express.static(path.join(__dirname + '/dist'))); // eslint-disable-line

    instance.get('/workbox-sw.prod.v2.1.2.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'workbox-sw.prod.v2.1.2.js')); // eslint-disable-line
    });

    instance.get('/sw.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'sw.js')); // eslint-disable-line
    });
    
    instance.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html')); // eslint-disable-line
    });
    
    // eslint-disable-next-line
    instance.listen(process.env.PORT || 5000, () => {
        console.log('Up and running'); // eslint-disable-line
    });
};


throng({
    workers: process.env.WEB_CONCURRENCY || 1, // eslint-disable-line
    lifetime: Infinity
}, application);
