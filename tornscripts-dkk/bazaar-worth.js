// ==UserScript==
// @run-at       document-start
// @name         TORN: Bazaar Worth
// @namespace    dekleinekobini.bazaarworth
// @version      1.1.1
// @author       DeKleineKobini
// @description  Show the total value the selected item in the bazaars.
// @match        https://www.torn.com/imarket.php*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/bazaar-worth.js
// @grant        none
// ==/UserScript==

const settings = {
    bazaarfilter: true
};

setDebug(false);

/* --------------------
CODE - EDIT ON OWN RISK
-------------------- */
initScript("bazaarworth", "Bazaar Worth", "BW", false);

(function() {
    let path = window.location.pathname;

    var specialParams = new URLSearchParams(getSpecialSearch());

    xhrIntercept(function(page, json, uri){
        if (page != "imarket" || !uri) return;

        if (specialParams.get("p") != "market") return;
        if ($(".buy-item-info-wrap").length == 0) return;

        observeMutations($(".buy-item-info-wrap").get(0), ".private-bazaar", false, () => {
            $(".buy-item-info-wrap .items > .private-bazaar").slice(0, 3).each((index, element) => {
                let row = $(element);

                let price = replaceAll(row.find(".cost-price").html().substring(1), ",", "") * 1;
                let amount = row.find(".cost-amount").html();
                amount = replaceAll(amount.substring(1, amount.indexOf(" ")), ",", "") * 1;

                let total = price * amount;

                if (settings.bazaarfilter && row.find(".cost > a").length) {
                    row.find(".cost > a").html(`$${total.format()}`);
                } else {
                    row.find(".cost").prepend(`<span class='left'>$${total.format()}</span>`);
                }
            });
        });
    });
})();