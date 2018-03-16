const express = require('express');
const helmet = require('helmet');
const throng = require('throng');
const shrinkRay = require('shrink-ray');
const path = require('path');
const fs = require('fs');


const application = () => {
    var instance = express();

    if (process.env.NODE_ENV === 'production') {
        var PORT = '/tmp/nginx.socket';
        var callbackFn = () => {
            fs.closeSync(fs.openSync('/tmp/app-initialized', 'w'));
            console.log(`Listening on ${PORT}`);
        };

    } else {
        var PORT = 8080;
        var callbackFn = () => {
            console.log(`Listening on ${PORT}`);
        };
    }

    instance.use(helmet());

    instance.use(shrinkRay());
    instance.use('/src/assets', express.static(path.join(__dirname, 'src', 'assets')));
    instance.use('/dist', express.static(path.join(__dirname, 'dist')));

    instance.get('/sw.js', (req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(path.join(__dirname, 'dist', 'sw.js'));
    });
    
    instance.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    instance.get('*', (req, res) => {
        res.redirect('/');
    });
    
    instance.listen(PORT, callbackFn);
};


throng({
    workers: process.env.WEB_CONCURRENCY || 1,
    lifetime: Infinity
}, application);
