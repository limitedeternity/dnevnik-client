const express = require('express');
const helmet = require('helmet');
const throng = require('throng');
const shrinkRay = require('shrink-ray');
const path = require('path');

var __dirname = path.resolve();

const application = () => {
    var instance = express();

    instance.use(helmet());

    instance.use(shrinkRay());
    instance.use('/src/assets', express.static(path.join(__dirname, 'src', 'assets')));
    instance.use('/dist', express.static(path.join(__dirname, 'dist')));

    instance.get('/sw.js', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'sw.js'));
    });
    
    instance.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    instance.get('*', (req, res) => {
        res.redirect('/');
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
