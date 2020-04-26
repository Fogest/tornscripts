// ==UserScript==
// @name         TORN: Item Value
// @namespace    dekleinekobini.itemvalue
// @version      2.1.3
// @author       DeKleineKobini
// @description  Show the value for your items.
// @match        https://www.torn.com/item.php
// @match        https://www.torn.com/shops.php*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/item-value.js
// @connect      api.torn.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

const settings = {
    pages: {
        items: true,
        shops: true
    }
};

setDebug(false);

/* --------------------
CODE - EDIT ON OWN RISK
-------------------- */
initScript("itemvalue", "Item Value", "IV", true);

var apiItems = {};

getCache("tornapi_items", false).then(cache => {
    if (cache) {
        debug("Loaded items from the cache!");
        apiItems = cache;
        run();
    } else {
        sendAPIRequest("torn", "", "items").then(json => {
            if (json && json.items) {
                debug("Loaded items from the api!");
                apiItems = json.items;
                setCache("tornapi_items", json.items, getMillisUntilNewDay());
                run();
            }
            else debug("Error during load", json);
        }, reject => {
            log("Rejected api response! " + reject);
        });
    }
}, reject => {
    log("Rejected cache response!");
});

function run() {
    let page = window.location.pathname.substring(1);
    if (page == "item.php" && settings.pages.items) {
        const _load = () => load("ul[aria-hidden=false]", "li[data-category]", ".qty:eq(1)", ".name-wrap");

        if ($(".last-row").length) _load();
        else observeMutations(document, ".last-row", true, _load, { childList: true, subtree: true });

        ajax((page, json, uri) => {
            if(page != "item" || !json) return;

            setTimeout(_load, 100);
        });
    } else if (page == "shops.php" && settings.pages.shops) {
        const _load = () => load(".sell-items-list", "li[data-item]", ".count:first()", ".desc");

        if ($(".sell-items-list")) _load();
        else observeMutations(document, ".sell-items-list", true, _load, { childList: true, subtree: true });
    }
}

function load(listSelector, itemSelector, amountSelector, wrapSelector, start, end) {
    debug("call load");
    var total = 0;

    let list = $(listSelector);
    list.find(itemSelector).each((index, element) => {
        let row = $(element);

        let id = row.attr("data-item");

        let value = apiItems[id].market_value;
        let amount = row.find(amountSelector).html();

        if (id == 261) debug("amount= " + id, amount)
        if (amount) amount = amount.substring(1);
        else amount = 1;
        if (id == 261) debug("amount 2= " + id, amount)

        if (value > 0) {
            let wrap = row.find(wrapSelector);
            wrap.not(".itemValue").append("(value: <span class='id-" + id + "'></span>)");
            wrap.addClass("itemValue");
        }

        $(".id-" + id).html(formatCurrency(value * amount));
        total += amount * value;
    });

    list.not(".total").prepend("<li style='line-height: 30px;'>Total Value <span class='totalValue'>$0</span></li>");
    list.addClass("total");
    if (total > 0) $(".totalValue").html(formatCurrency(total));
}

function formatCurrency(value, decimals, currency) {
    if (!decimals) decimals = 0;
    if (!currency) currency = "$";

    return currency + value.format(decimals);
}