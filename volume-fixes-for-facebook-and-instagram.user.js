// ==UserScript==
// @name        Volume fixes for Facebook and Instagram
// @namespace   https://github.com/ttoan12/volume-fixes-for-facebook-and-instagram
// @match       http*://*.facebook.com/*
// @match       http*://*.instagram.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @version     0.0.2
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

  // This is to prevent the volume from changing to 100% when the video first plays
  if (event.target.getAttribute('data-volumefix') === 'registered') {
    event.stopPropagation();
    event.target.setAttribute('data-volumefix', 'fixed');
    return;
  }

  volChangeFn(event.target.volume);
}

function onPlaying(event) {
  if (!event.target) return;
  event.stopPropagation();
  setVolume(event.target);
}

function registerVolumeFix(element) {
  element.addEventListener('playing', onPlaying);
  element.addEventListener('volumechange', onVolumeChange);
  element.setAttribute('data-volumefix', 'registered');
  setVolume(element);
  registeredElements.push(element);
}

var observeDOM = (function(){
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  volChangeFn = debounce(updateVolume);
  findUnRegisteredVideoElements().forEach(registerVolumeFix);
  console.log("Volume fix started.");

  return function( obj, callback ){
    if( !obj || obj.nodeType !== 1 ) return;

    if( MutationObserver ){
      // define a new observer
      var mutationObserver = new MutationObserver(callback)

      // have the observer observe for changes in children
      mutationObserver.observe( obj, { childList:true, subtree:true })
      return mutationObserver
    }

    // browser support fallback
    else if( window.addEventListener ){
      obj.addEventListener('DOMNodeInserted', callback, false)
      obj.addEventListener('DOMNodeRemoved', callback, false)
    }
  }
})()

observeDOM(document.body, () => findUnRegisteredVideoElements().forEach(registerVolumeFix));
