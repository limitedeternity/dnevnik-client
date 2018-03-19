#!/usr/bin/env bash

if [[ $NODE_ENV == production ]]; then 
    cross-env NODE_ENV=production webpack --progress --hide-modules
    workbox generateSW workbox-config.prod.js
fi;

prune
