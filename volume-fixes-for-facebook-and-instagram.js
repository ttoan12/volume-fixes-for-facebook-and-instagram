// ==UserScript==
// @name        Volume fixes for Facebook and Instagram
// @namespace   https://github.com/ttoan12/volume-fixes-for-facebook-and-instagram
// @match       http*://*.facebook.com/*
// @match       http*://*.instagram.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @version     0.0.1
// @author      Toan Tran
// @description Fix the loudness from those Facebook and Instagram, especially those reels which you can't change the volume level.
// @license     MIT
// @run-at      document-end
// ==/UserScript==

var volume = GM_getValue('volume', 0.5);
var registeredElements = [];
var interval = null;
var volChangeFn = null;
var isVolumeUpdating = false;

function findUnRegisteredVideoElements() {
  return document.body.querySelectorAll('video:not([data-volumefix])');
}

function registerVolumeFix(element) {
  element.addEventListener('playing', onPlaying);
  element.addEventListener('volumechange', onVolumeChange);
  element.setAttribute('data-volumefix', 'false');
  registeredElements.push(element);
}

function setVolume(element) {
  return element.volume = volume;
}

function updateVolume(newValue) {
  if (isVolumeUpdating) return;
  isVolumeUpdating = true;

  volume = newValue;
  GM_setValue('volume', volume);

  registeredElements.forEach(element => setVolume(element));

  isVolumeUpdating = false;
}

function debounce(func, timeout = 300){
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

function onVolumeChange(event) {
  if (isVolumeUpdating || !event.target || !volChangeFn) return;

  if (event.target.getAttribute('data-volumefix') === 'false') {
    event.target.setAttribute('data-volumefix', 'true');
    return;
  }

  volChangeFn(event.target.volume);
}

function onPlaying(event) {
  if (!event.target) return;
  event.stopPropagation();

  event.target.volume = volume;
}

function activateVolumeFix() {
  volChangeFn = debounce(updateVolume);
  interval = setInterval(() => {
    findUnRegisteredVideoElements().forEach(registerVolumeFix);
  }, 500);

  console.log('Volume fix activated.');
}

activateVolumeFix();
