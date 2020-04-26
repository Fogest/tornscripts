// ==UserScript==
// @name         TORN: Stock Trader
// @namespace    dekleinekobini.stocktrader
// @version      2.1.3
// @author       DeKleineKobini
// @description  Helper for stock trading.
// @match        https://www.torn.com/stockexchange.php*
// @match        https://www.torn.com/laptop.php*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/stock-trader.js
// @connect      api.torn.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

initScript({ name: "Stock Trader" });

addCSS("sst",
       "#dkk-stocks > .dkk-widget_body { padding: 6px 8px; }"
       + ".wording { text-decoration: underline; }"
       + ".profit { color: green; }"
       + ".break-even { color: blue; }"
       + ".loss { color: red; }"
      );

(function() {
    let url = new URL(window.location.href);
    let step = url.searchParams.get("step");


    const path = window.location.pathname;
    if (path.includes("/stockexchange.php")) {
        const step = new URL(window.location.href).searchParams.get("step");

        if (step === "portfolio") { // isPortfolio
            checkPage();

            xhrIntercept((page, json, uri, xhr) => {
                if (page !== "stockexchange" || !uri) return;

                checkPage();
            });
        }

        function checkPage() {
            if ($(".item-wrap.last").length) updatePortfolio(false);
            else observeMutations(document, ".item-wrap.last", true, () => updatePortfolio(false), { childList: true, subtree: true });
        }
    } else if (path.includes("/laptop.php")) {
        xhrIntercept((page, json, uri, xhr) => {
            if (page !== "stockexchange" || !uri) return;

            const searchParams = new URL(xhr.responseURL).searchParams;
            if (searchParams.get("step") === "portfolio" || searchParams.get("portfolio")) { // isPortfolio
                if ($(".item-wrap").length) updatePortfolio(true);
                 else observeMutations($(".computer-frame-wrap").get(0), ".item-wrap.last", true, () => updatePortfolio(true), { childList: true, subtree: true });
            }
        });
    }
})();

function updatePortfolio(isLaptop) {
    const stocks = $(".item-wrap");

    const total = {
        shares: 0,
        bought: 0,
        worth: 0,
    };
    stocks.each((i, el) => {
        const stock = $(el);

        let sharesBought = parseInt(formatNumber(stock.find(".b-price-wrap .first-row").eq(0).html().split("\n")[2]));
        let priceEachBought = parseFloat(formatNumber(stock.find(".c-price-wrap .second-row span").eq(0).eq(0).html().split("\n")[2]));
        let priceCurrent = parseFloat(formatNumber(stock.find(".c-price-wrap .first-row span").attr("title").split(" ")[1]));
        let profit = priceCurrent - (sharesBought * priceEachBought);

        total.shares += sharesBought;
        total.bought += sharesBought * priceEachBought;
        total.worth += priceCurrent;

        if (!stock.find(".qualify-wrap .worth").length) {
            let html;
            if (!_isMobile()) {
                html = "You bought at $<span class='bold worth'>0</span> worth and <span class='wording'>break-even</span> <span class='bold number break-even'><span class='char'>+</span> $<span class='value'>0</span></span>";
            } else {
                html = "Bought $<span class='bold worth'>0</span> / <span class='wording'>break-even</span> <span class='bold number break-even'><span class='char'>+</span> $<span class='value'>0</span></span>";
            }
             stock.find(".qualify-wrap").html(html);
        }

        let wording = profit === 0 ? "break-even" : profit > 0 ? "profit" : "loss";
        let char = profit < 0 ? "-" : "+";

        stock.find(".qualify-wrap .worth").text((sharesBought * priceEachBought).format(0));
        stock.find(".qualify-wrap .wording").text(wording);
        stock.find(".qualify-wrap .number").addClass(wording);
        if (wording !== "profit") stock.find(".qualify-wrap .number").removeClass("profit");
        if (wording !== "break-even") stock.find(".qualify-wrap .number").removeClass("break-even");
        if (wording !== "loss") stock.find(".qualify-wrap .number").removeClass("loss");
        stock.find(".qualify-wrap .number .char").text(char);
        stock.find(".qualify-wrap .number .value").text(Math.abs(profit).format(0));
    });

    updateTotal();

    function updateTotal() {
        if (!$("#dkk-stocks").length) {
            $(".title-black").before(
                "<div><article class='dkk-widget' id='dkk-stocks'><header class='dkk-widget_green'><span class='dkk-widget_title'>Stocks</span></header>"
                + "<div class='dkk-widget_body dkk-round-bottom'>You have a total&nbsp;<span class='wording'>break-even</span>&nbsp;of&nbsp;<span class='bold number break-even'><span class='char'>+</span> $<span class='value'>0</span></span></div>"
                + "</article></div><div class='clear'></div><div class='clear'></div><br/>"
            );
        }

        total.profit = total.worth - total.bought;
        total.isProfit = total.profit > 0;

        let wording = total.profit === 0 ? "break-even" : total.profit > 0 ? "profit" : "loss";
        let char = total.profit < 0 ? "-" : "+";

        $("#dkk-stocks .wording").text(wording);
        $("#dkk-stocks .number").addClass(wording);
        if (wording !== "profit") $("#dkk-stocks .number").removeClass("profit");
        if (wording !== "break-even") $("#dkk-stocks .number").removeClass("break-even");
        if (wording !== "loss") $("#dkk-stocks .number").removeClass("loss");
        $("#dkk-stocks .number .char").text(char);
        $("#dkk-stocks .number .value").text(Math.abs(total.profit).format(0));
    }
}

function formatNumber(number) {
    return number.replaceAll("$", "").replaceAll(",", "");
}