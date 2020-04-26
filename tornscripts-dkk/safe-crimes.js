// ==UserScript==
// @name         TORN: Safe Crimes
// @namespace    dekleinekobini.safecrimes
// @version      1.1.1
// @author       DeKleineKobini
// @description  Help with doing safe crimes.
// @match        https://www.torn.com/crimes.php*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/safe-crimes.js
// @grant        unsafeWindow
// ==/UserScript==

"use strict";

var SETTINGS = {
    onlySafe: true
};

initScript({
    name: "Safe Crimes",
    logging: "ALL"
});

const SAFE_CRIMES = {
    shoplift: { clothesshop: [ "jacket" ] },
    pickpocket: [ "kid", "oldwoman", "businessman" ],
    robsweetshop: [ "thoroughrobbery" ],
    virus: [ "stealthvirus" ],
    assasination: [ "murdermobboss" ],
    arson: [ "warehouse" ],
    gta: [ "parkedcar" ],
    kidnapping: [ "napmayor" ],
}

const NERVE_CRIMES = {
    2: 'searchstreets',
    3: 'sellcopiedcds',
    4: 'shoplift',
    5: 'pickpocket',
    6: 'larceny',
    7: 'robsweetshop',
    8: 'transportdrugs',
    9: 'virus',
    10: 'assasination',
    11: 'arson',
    12: 'gta',
    13: 'pawnshop',
    14: 'counterfeiting',
    15: 'kidnapping',
    16: 'armstraffic',
    17: 'bombings',
    18: 'hacking',
}

const MENU_TEXT = {
    'Which item would you like to steal from the clothes shop?': "clothesshop"
}

observeMutations(document, ".specials-cont", true, (mut, obs) => {
    applySafeCrimes();

    observeMutations($(".content-wrapper").get(0), ".specials-cont", false, applySafeCrimes);
}, { childList: true, subtree: true });

function applySafeCrimes() {
    dkklog.debug("Starting the checks.");
    let action = $("form[name='crimes']:not([class])").attr("action");
    action = action.substring(action.indexOf("step=") + 5);

    if (action == "docrime") {
        $(".specials-cont > li").each(function() {
            let row = $(this).find("ul");
            let crime = row.find(".choice-container > input").attr("value");
            let safe = SAFE_CRIMES.hasOwnProperty(crime);

            doAction(row, safe);
        });
    } else if (action == "docrime2") {
        dkklog.debug("No safe crimes here.");
    } else if (action == "docrime3") {
        let nerve = $(".specials-cont-wrap input[name='nervetake']").attr("value")
        let crime = NERVE_CRIMES[nerve];
        let crimesSafe = SAFE_CRIMES[crime];

       $(".specials-cont > li").each(function() {
            let row = $(this).find("ul");
            let subcrime = row.find(".choice-container > input").attr("value");
            let safe = crimesSafe.hasOwnProperty(subcrime);

            doAction(row, safe);
        });
    } else if (action == "docrime4") {
        let nerve = $(".specials-cont-wrap input[name='nervetake']").attr("value")
        let crime = NERVE_CRIMES[nerve];
        let crimesSafe = SAFE_CRIMES[crime];

        if (!Array.isArray(crimesSafe)) {
            let menu = MENU_TEXT[$(".info-msg .msg").html().split("\n")[1]];
            crimesSafe = crimesSafe[menu];
        }

        $(".specials-cont > li").each(function() {
            let row = $(this).find("ul");
            let subcrime = row.find(".choice-container > input").attr("value");
            let safe = crimesSafe && crimesSafe.includes(subcrime);

            doAction(row, safe);
        });
    }
}

function doAction(row, safe) {
    if (SETTINGS.onlySafe && !safe) {
        row.parent().hide();
    } else if (!SETTINGS.onlySafe && safe){
        row.css("background-color", "green");
    }
}