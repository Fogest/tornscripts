// ==UserScript==
// @name         TORN: Banker Tools
// @namespace    dekleinekobini.bankertools
// @version      2.1.1
// @author       DeKleineKobini
// @description  Make it easier to be a banker.
// @match        https://www.torn.com/factions.php?step=your*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/banker-tools.js
// @grant        unsafeWindow
// ==/UserScript==

initScript({
    name: "Banker Tools",
    logging: "ALL"
});

const DATA = {
    currentTab: '',
    currentControl: '',
    listCount: 0,
    listIgnore: [],
    balancePlayers: 0
};

runOnEvent(updateTab, "hashchange", true);

xhrIntercept((page, json, uri, xhr) => {
    if (page !== "factions") return;
    if (DATA.currentTab !== "faction-controls") return;

    updateFactionBalance();
    handleInput();
});

function updateTab() {
    const tab = $(".faction-tabs li.ui-state-active").attr("aria-controls");

    DATA.currentTab = tab;
    if (tab !== "faction-controls") return;

    $("#money-user").on("change paste keyup select focus", handleInput);
    $(document).click(handleInput);

    updateControl();

    observeMutations(document, ".control-tabs", true, () => {
        observeMutationsFull($(".control-tabs").get(0), updateControl, { subtree: true, attributes: true, attributeFilter: [ "class" ]});
    }, { childList: true, subtree: true });

}

function handleInput() {
    let inputUser = getInputedUser();

    let text = "Select player:"

    if (inputUser.status === "success") {
        let { name, id } = inputUser;

        let balance = $('.clearfix:has(a[href="/profiles.php?XID=' + id + '"]) .money').html();
        text = `${name} has a balance of ${balance || "$0"}`;
    }

    $('label[for="money-user"]').attr("val", inputUser).text(text);
}

function getInputedUser() {
    let inputUser = $("#money-user").val();

    let status, name, id;
    if (!inputUser || !inputUser.includes("[") || !inputUser.includes("]")) {
        status = "failed";
    } else {
        status = "success";
        name = inputUser.substring(0, inputUser.indexOf(" ["));
        id = inputUser.substring(inputUser.indexOf("[") + 1, inputUser.length - 1);
    }

    return {status, name, id};
}

function getBalance(id) {
    return $(`.clearfix:has(a[href="/profiles.php?XID=${id}"]) .money`).attr("data-value");
}

function updateControl() {
    const control = $(".control-tabs .ui-state-active").attr("aria-controls");

    if (control && (control !== "option-give-to-user" || control === DATA.currentControl)) {
        DATA.currentControl = control;
        return;
    }
    DATA.currentControl = control;

    observeMutations(document, "#faction-controls .money-wrap .input-money-symbol", true, () => {
        dkklog.trace("found money symbol");
        $('#faction-controls .money-wrap .input-money-symbol').click((event) => {
            dkklog.trace("fill in cash");

            let inputUser = getInputedUser();
            if (inputUser.status != "success") return;

            let { id } = inputUser;

            let balance = getBalance(id);

            dkklog.debug("balance", balance, id);
            let toChange = true;
            let field = $('.count.input-money[type="text"]:eq(0)');
            field.on("change", () => {
                if (!toChange) return;

                toChange = false;
                field.val(balance).click();
            });
        });
    }, { childList: true, subtree: true });

    $("button[aria-label='Give points']").click(() => {
        DATA.listIgnore.push(DATA.listCount + 1);
    });
}

function updateFactionBalance(list) {
    showFactionBalance();

    let total = $("span[data-faction-money]").attr("data-faction-money");
    let totalPlayer = 0;

    if (list && false) {
        list.forEach((item, index) => totalPlayer += item.balance);
        dkklog.debug("updateFactionBalance", totalPlayer);
        _set();
    } else {
        if ($(".money[data-value]").length) _update();
        else observeMutations(document, ".money[data-value]", true, _update, { childList: true, subtree: true });

        function _update() {
            $(".money[data-value]").each((index, value) => totalPlayer += Number($(value).attr("data-value")));
            _set();
        }
    }

    function _set() {
        let totalFaction = total - totalPlayer;
        $("#totalFaction").text("$" + totalFaction.format());
    }
}

function showFactionBalance() {
    if ($("#totalFaction").length) return;

    let factionimg = $(".factionWrap img").length ? $(".factionWrap img:first").attr("src") : $(".factionWrap a:first").text();
    let hasHonors = factionimg && factionimg.includes("http");

    dkklog.debug("factionimg", !!factionimg);

    $(".user-info-list-wrap").eq(0).prepend('<li class="depositor">' +
                                            '<div class="clearfix">' +
                                            '<div class="user name btFaction" style="width: 147px;">' +
                                            (hasHonors ? `<img src='${factionimg}' border="0"></img>` : `<span>${factionimg}</span>`) +
                                            '</div>' +
                                            '<div class="amount">' +
                                            '<div class="show">' +
                                            '<span class="money" id="totalFaction"></span>' +
                                            '</div>' +
                                            '</div>' +
                                            '</div>' +
                                            '</li>');

    if(!factionimg) observeMutations(document, ".factionWrap a", true, () => {
        let factionimg = $(".factionWrap img").length ? $(".factionWrap img:first").attr("src") : $(".factionWrap a:first").text();
        let hasHonors = factionimg && factionimg.includes("http");
        dkklog.debug("observeMutations", factionimg);

        let html = (hasHonors ? `<img src='${factionimg}' border="0"></img>` : `<span>${factionimg}</span>`);
        dkklog.debug("observeMutations html", html);

        $(".btFaction").html(html);
        // $("#factionImage").attr("src", $(".factionWrap img").attr("src"));
    }, { childList: true, subtree: true });
}