// ==UserScript==
// @name            TwitchTV-MWV
// @namespace       http://kuchi.be/
// @version         1.6
// @description     Control TwitchTV volume by scroll mouse wheel up and down with saving the volume settings by Kuchi - Soft's
// @author          Kuchi - Soft's
// @defaulticon     https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV-icon.png
// @icon            https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV-icon.png
// @updateURL       https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV.user.js
// @downloadURL     https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV.user.js
// @match           *://*.twitch.tv/*
// @match           *://*.twitch.tv/videos/*
// @run-at          document-end
// @grant           none
// @priority        9000
// ==/UserScript==


(function(window) {
//settings
var TwitchPlayer = document.body.querySelector(".player-video video");
var volume = null;
var SliderVal = null;
var volSlider = document.body.querySelector(".player-slider__left");
var volSliderthumb = document.body.querySelector(".player-volume__slider-thumb");
var volButton = document.body.querySelector("div.player-buttons-left div.pl-flex button");
var UnmuteD = "M18 11.024v7.952c1.208-.913 2-2.348 2-3.976 0-1.628-.792-3.062-2-3.976zM18 7v2.04c2.363 1.06 4 3.325 4 5.96 0 2.634-1.637 4.9-4 5.96V23c3.49-1.17 6-4.309 6-8s-2.51-6.83-6-8zm-2 15a1.002 1.002 0 0 1-1.641.768L8.638 19H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h1.638l5.721-3.768A1.002 1.002 0 0 1 16 8v14z";
var MuteD = "M16 22a1.002 1.002 0 0 1-1.641.768L8.638 19H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h1.638l5.721-3.768A1.002 1.002 0 0 1 16 8v14zm6.414-7l1.293 1.293a1 1 0 0 1-1.414 1.414L21 16.414l-1.293 1.293a.997.997 0 0 1-1.414 0 .999.999 0 0 1 0-1.414L19.586 15l-1.293-1.293a1 1 0 0 1 1.414-1.414L21 13.586l1.293-1.293a1 1 0 0 1 1.414 1.414L22.414 15z";

if(localStorage.getItem('TwitchVolume')){
    volume = localStorage.getItem('TwitchVolume');
    SliderVal = volume * 100;
}
var interval = null;
var VolDivElement = document.createElement("div");
VolDivElement.setAttribute('style', 'display: inline-block; padding: 5px 5px 5px 5px; font-size: 215%; background: rgba(0,0,0,.5); pointer-events: none; border-radius: 3px; text-align: center; height: 70px; color: aliceblue; z-index: 999; font-weight: bolder; font-family: cursive; width: 75px; margin: 18% 0px 0px 49%; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;');
VolDivElement.setAttribute('id', 'VolDiv');
VolDivElement.appendChild(document.createTextNode('Vol: ' + Math.round(volume * 100) + '%'));

var VolDivF = null;
var VolDiv = null;
var VolDivShow = false;
var TimeOutVol = null;


window.addEventListener('wheel', function(e) {
    blockscroll();
  if (e.deltaY < 0) {
    if(e.target.className.includes("player") || e.target.className.includes("pl-") || 'extension-taskbar' == e.target.className || 'extension-frame' == e.target.className || 'loading' == e.target.className || e.target.className.includes("extension-") || e.target.className.includes("extension-container") || e.target.className.includes("overlay") || e.target.className.includes("js-paused-overlay")){
        TwitchPlayer = document.body.querySelector(".player-video video");
        TwitchPlayer.muted = false;
        volSlider = document.body.querySelector("div.player-volume__slider-container div.player-slider__left");
        volSliderthumb = document.body.querySelector(".player-volume__slider-thumb");
        volButton = document.body.querySelector("div.player-buttons-left div.pl-flex button");
        volButton.querySelector("span").className = "mute-button";
        volButton.querySelector("span span").setAttribute("data-tip", "Mute");
        volButton.querySelector("span svg").setAttribute("id", "icon_volumefull");
        volButton.querySelector("span svg path").setAttribute("d", UnmuteD);

        if(TwitchPlayer.volume >= 0.99){
            TwitchPlayer.volume = 1;
            SliderVal = 100;
            volSliderthumb.style.left = SliderVal + "%";
            volSlider.style.width = SliderVal + "%";
            console.log('Twitch Volume Set To Max');
        }else{
            TwitchPlayer.volume = TwitchPlayer.volume + 0.01;
            SliderVal = TwitchPlayer.volume * 100;
            volSliderthumb.style.left = SliderVal + "%";
            volSlider.style.width = SliderVal + "%";
            console.log('Twitch Volume Set To:' + TwitchPlayer.volume);
        }
        volume = TwitchPlayer.volume;
        localStorage.setItem('TwitchVolume', TwitchPlayer.volume);

        console.log(TwitchPlayer.volume);
    }
  }

  if (e.deltaY > 0) {
    if(e.target.className.includes("player") || e.target.className.includes("pl-") || 'extension-taskbar' == e.target.className || 'extension-frame' == e.target.className || 'loading' == e.target.className || e.target.className.includes("extension-") || e.target.className.includes("extension-container") || e.target.className.includes("overlay") || e.target.className.includes("js-paused-overlay")){
        TwitchPlayer = document.body.querySelector(".player-video video");
        volSlider = document.body.querySelector("div.player-volume__slider-container div.player-slider__left");
        volSliderthumb = document.body.querySelector(".player-volume__slider-thumb");
        volButton = document.body.querySelector("div.player-buttons-left div.pl-flex button");
        if(TwitchPlayer.volume >= 0.01){
            TwitchPlayer.muted = false;
            TwitchPlayer.volume = TwitchPlayer.volume - 0.01;
            SliderVal = TwitchPlayer.volume * 100;
            volSliderthumb.style.left = SliderVal + "%";
            volSlider.style.width = SliderVal + "%";
            console.log('Twitch Volume Set To:' + TwitchPlayer.volume);
        }else{
            TwitchPlayer.volume = 0;
            TwitchPlayer.muted = true;
            volButton.querySelector("span").className = "unmute-button";
            volButton.querySelector("span span").setAttribute("data-tip", "Unmute");
            volButton.querySelector("span svg").setAttribute("id", "icon_volumemute");
            console.log(volButton.querySelector("span svg").className);
            volButton.querySelector("span svg path").setAttribute("d", MuteD);
            SliderVal = 0;
            volSliderthumb.style.left = SliderVal + "%";
            volSlider.style.width = SliderVal + "%";
            console.log('Twitch Volume Set To: Mute');
        }
        volume = TwitchPlayer.volume;
        localStorage.setItem('TwitchVolume', TwitchPlayer.volume);

        console.log(TwitchPlayer.volume);
    }
  }
    if(VolDivF !== null){
        VolDivF.style.opacity = "1";
        VolDivShow = true;
        VolDiv.innerHTML = 'Vol: ' + Math.round(volume * 100) + '%';
        if(VolDivShow){
            clearInterval(TimeOutVol);
            TimeOutVol = setTimeout(function(){ VolDivF.style.opacity = "0"; VolDivShow = false;}, 3000);
        }
    }

}, false);

window.addEventListener("keydown",function(e){
  if (e.key === ' ' || e.key === 'Spacebar') {
    blockscroll();
  }

}, false);



function blockscroll() {
    if(document.querySelector('div.extension-container') !== null){
        document.querySelector('div.extension-container').style.display = "none";
    }

    if(document.querySelector('div.player-overlay') !== null){
        document.querySelector('div.player-overlay').setAttribute("id", "TopPlayer");
        document.querySelector('div.player-overlay').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.extension-container') !== null){
        document.querySelector('div.extension-container').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.player-overlay player-play-overlay js-paused-overlay') !== null){
        document.querySelector('div.player-overlay player-play-overlay js-paused-overlay').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.player-alert muted-alert-on-ui') !== null){
        document.querySelector('div.player-alert muted-alert-on-ui').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.js-paused-overlay') !== null){
        document.querySelector('div.js-paused-overlay').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.player-alert') !== null){
        document.querySelector('div.player-alert').onwheel = function(){ return false; }
    }

    if(document.querySelector('div.pl-controls-bottom') !== null){
        document.querySelector('div.pl-controls-bottom').onwheel = function(){ return false; }
    }

    if(document.querySelector('iframe') !== null){
        document.getElementsByTagName("iframe").onwheel = function(){ return false; }
    }

    if(document.querySelector('iframe') !== null){
        document.getElementsByTagName("iframe").onwheel = function(){ return false; }
    }
}

    interval = setInterval (function() {
    if('complete' == document.readyState){
        blockscroll();
        TwitchPlayer = document.body.querySelector(".player-video video");
        TwitchPlayer.addEventListener("pause", blockscroll);
        document.querySelector('div.player-overlay').appendChild(VolDivElement);
        VolDivF = document.querySelector('div.player-overlay');
        VolDiv = document.getElementById('VolDiv');
        volSlider = document.body.querySelector("div.player-volume__slider-container div.player-slider__left");
        volSliderthumb = document.body.querySelector(".player-volume__slider-thumb");
        volButton = document.body.querySelector("div.player-buttons-left div.pl-flex button");
        if(TwitchPlayer.volume !== null){clearInterval(interval);}
        if (volume !== null){
            TwitchPlayer.volume = volume;
        }else{
            volume = TwitchPlayer.volume;
        }
console.log("trying ...");

    }
}
                 , 500);
})(window);



