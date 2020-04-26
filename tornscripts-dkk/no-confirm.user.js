// ==UserScript==
// @name         TORN: No Confirm
// @namespace    dekleinekobini.noconfirm
// @version      4.6.4
// @author       DeKleineKobini
// @description  No confirm message.
// @match        https://www.torn.com/imarket.php*
// @match        https://www.torn.com/bazaar.php*
// @match        https://www.torn.com/item.php*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/no-confirm.js
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

const SETTINGS = {
    pages: {
        itemmarket: true,
        bazaar: true,
        items: {
            send: false,
            usage: true,
            equip: true
        }
    },
    itemBlacklist: [
        373, 374, 375, 376 // parcel and presents
    ],
    compability: {
        bazaarfilter: true // only work on filtered pages
    }
}

initScript({
    name: "No Confirm",
    logging: "ALL"
});

let location = window.location.href;
let params = (new URL(location)).searchParams;
let paramsSpecial = new URLSearchParams(getSpecialSearch());

if (location.includes("/imarket.php")) {
    dkklog.debug("Detected item market!");
    if (SETTINGS.pages.itemmarket) {
        xhrIntercept((page, json, uri) => {
            if (page !== "imarket" || !uri) return;

            dkklog.info("Started to check in 'itemmarket'.");

            if (paramsSpecial.get("p") == "shop") observeMutations(document, ".buy-link", true, updateIcons, { childList: true, subtree: true });
            else if ($(".buy-item-info-wrap").length) observeMutations($(".buy-item-info-wrap").get(0), ".buy-link", false, updateIcons, { childList: true, subtree: true })

            function updateIcons() {
                dkklog.debug("Replacing icons with instant buy link.");
                $(".buy-link").each((index, el) => $(el).parent().html("<a class='yes-buy t-blue h bold' href='#' data-action='buyItemConfirm' data-id='" +  $(el).attr("data-id") + "' data-item='0'><span class='buy-icon'></span></a>"));
                dkklog.trace("Replaced icons with instant buy link.");
            }
        });
    }
} else if (location.includes("/bazaar.php")) {
    dkklog.debug("Detected bazaar!");
    if (SETTINGS.pages.bazaar) {
        interceptFetch("bazaar.php", (json, url) => {
            if (SETTINGS.loaded) return;
            if (!url.includes("step=getBazaarItems")) return;

            if (SETTINGS.compability.bazaarfilter && unsafeWindow.scripts.ids.includes("bazaarfilter") && !params.has("filter")) {
                dkklog.warn("Not checking in 'bazaar' due to bazaar filter compability!.");
                SETTINGS.loaded = true;
                return;
            }

            observeMutations(document, "div[class*='itemsContainner']", true, (mutations, observer) => {
                dkklog.info("Started to check in 'bazaar'.");
                observeMutations($("div[class*='itemsContainner']")[0], "div[class^='buyConfirmation']", false, (mutations, observer) => {
                    let confirmButton = $("div[class^='buyConfirmation'] > div > button:eq(0)");

                    dkklog.debug("Clicking confirm button.", confirmButton);
                    confirmButton.click();
                    dkklog.trace("Clicked confirm button.");
                }, { childList: true, subtree: true });
                SETTINGS.loaded = true;
            }, { childList: true, subtree: true });
        });
    }
} else if (location.includes("/item.php")) {
    dkklog.debug("Detected inventory!", $(".category-wrap").length);

    let checks = [];
    if (SETTINGS.pages.items.send) {
        dkklog.info("Going to check for item sending.");
        checks.push(".send-act[style*='display: block'] .next-act");
    }
    if (SETTINGS.pages.items.usage) {
        dkklog.info("Going to check for item using.");
        checks.push(".use-act[style*='display: block'] .next-act[aria-labelledby]");
    }
    if (SETTINGS.pages.items.equip) {
        dkklog.info("Going to check for item equiping.");
        checks.push(".unequipped-act[style*='display: block'] .next-act[aria-labelledby]");
    }

    let check = checks.join(", ");
    if ($(".category-wrap").length) startObserving();
    else observeMutations(document, ".category-wrap", true, startObserving, { childList: true, subtree: true });

    function startObserving() {
        dkklog.trace("startObserving");

        observeMutations($(".category-wrap").get(0), check, false, () => {
            let button = unsafeWindow.$(check);

            let id = parseInt(button.attr("data-item"));

            if (SETTINGS.itemBlacklist.includes(id)) {
                dkklog.debug(`Ignoring item with the id ${id}.`);
                return;
            } else {
                dkklog.debug(`Not ignoring item with the id ${id}.`, SETTINGS.itemBlacklist, typeof id, typeof SETTINGS.itemBlacklist[0]);
            };

            button.click();
        }, { childList: true, subtree: true });
    }
}