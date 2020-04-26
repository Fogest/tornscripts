// ==UserScript==
// @name         TORN: Travel Cooldown
// @namespace    dekleinekobini.travelcooldown
// @version      1.0.2
// @author       DeKleineKobini
// @description  Warn you if your cooldowns are going to expire before return time.
// @match        https://www.torn.com/travelagency.php
// @require      https://greasyfork.org/scripts/390917-dkk-torn-utilities/code/DKK%20Torn%20Utilities.js?version=742363
// @grant        GM_xmlhttpRequest
// ==/UserScript==

setDebug(false);

/* --------------------
CODE - EDIT ON OWN RISK
-------------------- */
initScript("travelcooldown", "Travel Cooldown", "TC", true);

var cooldowns = {};

sendAPIRequest("user", "", "cooldowns").then(function(oData) {
    if (!oData.cooldowns) return callback("ERROR API (" + oData.error.code + ")");
    debug("Loaded information from the api!");

    cooldowns = oData.cooldowns;

    apply();
    load();
});

function load() {
    $(".full-map:not(.empty-tag)").each(function() {
        observeMutations(this, ".full-map[style='display: block;']:not(.empty-tag) .flight-time", false, apply);
    });
}

function apply() {
    if (!$(".full-map[style='display: block;']:not(.empty-tag) .flight-time").length) return;

    let fullMap = $(".full-map[style='display: block;']:not(.empty-tag)");
    let timeHtml = fullMap.find(".flight-time");
    let time = stripHtml(timeHtml.html()).substring("Flight Time - ".length).split(":");
    time.forEach(function(val, index) { time[index] = val * 1; });

    if (!fullMap.hasClass("dkk-tc")) {
        let html = "<div>" +
            "<div class='patter-left'/>" +
            "<div class='travel-wrap'><div style='line-height: 60px !important;'>" +
            "<div class='cd-drugs' style='width: 245px; padding-right: 5px; float: left; text-align: center; font-size: 15; border-right: 1px solid #111;'>Drug</div>" +
            "<div class='cd-boost' style='width: 245px; padding-right: 5px; float: left; text-align: center; font-size: 15; border-right: 1px solid #111; border-left: 1px solid #3D3D3D;'>Booster</div>" +
            "<div class='cd-medic' style='width: 245px; padding-right: 5px; float: left; text-align: center; font-size: 15; border-left: 1px solid #3D3D3D;'>Medical</div>" +
            "</div></div>" +
            "<div class='patter-right'/>" +
            "<div class='clear'/>" +
            "</div>"; // stupid ass html
        $(html).insertBefore(fullMap);

        fullMap.addClass("dkk-tc");
    }

    let timeSecond = ((time[0] * 60) + time[1]) * 60; // hours and minutes to seconds
    timeSecond *= 2; // + return flight

    setColor($(".cd-drugs"), timeSecond >= cooldowns.drug)
    setColor($(".cd-boost"), timeSecond >= cooldowns.booster)
    setColor($(".cd-medic"), timeSecond >= cooldowns.medical)

    // let disable = timeSecond >= cooldowns.drug || timeSecond >= cooldowns.booster || timeSecond >= cooldowns.medical;
    // possible disabling of the button
}

function setColor(element, ily) {
    element.css("color", ily ? "red" : "inherit");
}