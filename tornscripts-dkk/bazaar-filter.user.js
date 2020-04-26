// ==UserScript==
// @name         TORN: Bazaar Filter
// @namespace    dekleinekobini.bazaarfilter
// @version      1.3.1
// @author       DeKleineKobini
// @description  Filter items in a bazaar!
// @match        https://www.torn.com/bazaar.php*
// @match        https://www.torn.com/imarket.php*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/bazaar-filter.js
// @grant        unsafeWindow
// ==/UserScript==

const settings = {
    seperateLink: true
};

initScript({
    name: "Bazaar Filter",
    logging: "ALL"
});

var filter = [];

(function() {
    let path = window.location.pathname;

    let params = new URL(window.location.href).searchParams;
    if (path === "/bazaar.php") {
        if (!params.has("userId")) return;
        dkklog.trace("Loading the bazaar function.")

        if (!params.has("filter")) return;

        dkklog.debug("Found filter: " + params.get("filter"));

        filter.push(params.get("filter"));

        if ($("input[class^='input']").length) filterItems();
        else observeMutations(document, "input[class^='input']", true, filterItems, { childList: true, subtree: true });
    } else if (path === "/imarket.php") {
        dkklog.trace("Loading the market function.")
        xhrIntercept(function(page, json, uri){
            if (page != "imarket" || !uri) return;

            if (params.get("p") === "shop"){
                // No place to add it.
            } else {
                if ($(".buy-item-info-wrap").length == 0) return;

                if ($(".buy-item-info-wrap .items > .private-bazaar").length) addFilterLink();
                else observeMutations($(".buy-item-info-wrap").get(0), ".buy-item-info-wrap .items > .private-bazaar", false, addFilterLink);
            }
        });
    }
})();

function setReactValue(element, value) {
    const oldValue = element.value;
    element._valueTracker.setValue(oldValue);

    const event = new Event("input", {
        bubbles: true,
        target: element,
        data: value,
    });
    event.simulated = true;

    element.value = value;
    element.defaultValue = value;

    element.dispatchEvent(event);
}

function filterItems() {
    dkklog.trace("Filtering the items!");

    $("div[class^='rowItems'] > div[class^='item']").filter(function() {
        return !filter.includes($(this).find("img").attr("alt"));
    }).each(function() {
        $(this).remove();
    });

    $("div[class^='row']").filter(function() {
        return !$(this).find("img").length;
    }).each(function() {
        $(this).remove();
    });

    $("div[class^='row_']").css("top", "0px");

    $("div[class^='item_']").last().after("<button id='unfilter'>Unfilter</button>");
    $(".ReactVirtualized__Grid__innerScrollContainer").css("height", "73px")
    $(document).on("click", "#unfilter", () => window.location.href = removeUrlParameter(window.location.href, "filter"));
}

function removeUrlParameter(url, parameter) {
    var urlParts = url.split('?');

    if (urlParts.length >= 2) {
        // Get first part, and remove from array
        var urlBase = urlParts.shift();

        // Join it back up
        var queryString = urlParts.join('?');

        var prefix = encodeURIComponent(parameter) + '=';
        var parts = queryString.split(/[&;]/g);

        // Reverse iteration as may be destructive
        for (var i = parts.length; i-- > 0; ) {
            // Idiom for string.startsWith
            if (parts[i].lastIndexOf(prefix, 0) !== -1) {
                parts.splice(i, 1);
            }
        }

        url = urlBase + '?' + parts.join('&');
    }

    return url;
}


function addFilterLink() {
    dkklog.trace("Adding the filter link!", $(".act .searchname").text());
    $(".buy-item-info-wrap .items > .private-bazaar")/*.slice(0, 3)*/.each(function() {
        let row = $(this);
        let viewLink = row.find(".view-link").last();
        let link = viewLink.attr("href") + "&filter=" + $(".act .searchname").text();
        var id = $(".act .hover").attr("itemid");

        if (settings.seperateLink) {
            row.find(".cost").prepend("<a href='" + link + "' class='left'>Filter</a>");
        } else {
            viewLink.attr("href", link);
        }
    });
}