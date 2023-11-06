// ==UserScript==
// @name        Volume fixes for Facebook and Instagram
// @namespace   https://github.com/ttoan12/volume-fixes-for-facebook-and-instagram
// @match       http*://*.facebook.com/*
// @match       http*://*.instagram.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @version     0.0.3
// @author      Toan Tran
// @description Fix the loudness from those Facebook and Instagram, especially those reels which you can't change the volume level.
// @license     MIT
// @run-at      document-end
// ==/UserScript==

var volume = GM_getValue('volume', 0.5);
var registeredElements = [];
var isVolumeUpdating = false;
var timeout = null;

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

  registeredElements.forEach(setVolume);

  isVolumeUpdating = false;
}

function onVolumeChange(event) {
  if (isVolumeUpdating) return;

  // Prevent Facebook/Instagram's jump scare with 100% volume on video first plays.
  if (event.target.volume === 1) {
    return setVolume(event.target);
  }

  // Prevent un-neecessary update on first plays due to the setVolume.
  if (event.target.getAttribute('data-volumefix') === 'registered') {
    return event.target.setAttribute('data-volumefix', 'fixed');
  }

  clearTimeout(timeout);
  timeout = setTimeout(() => updateVolume(event.target.volume), 300);
}

function registerVolumeFix(element) {
  setVolume(element);
  element.addEventListener('volumechange', onVolumeChange);
  element.setAttribute('data-volumefix', 'registered');
  registeredElements.push(element);
}

var observeDOM = (function(){
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

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
    }
  }
})()

observeDOM(document.body, () => findUnRegisteredVideoElements().forEach(registerVolumeFix));
