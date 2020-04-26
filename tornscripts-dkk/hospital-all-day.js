// ==UserScript==
// @name         TORN: Hospital All Day
// @namespace    dekleinekobini.hospitalallday
// @version      3.0.1
// @author       DeKleineKobini
// @description  Get notified when you are almost out of the hospital.
// @match        https://www.torn.com/*
// @require      https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/dkk-torn-utils.js
// @updateURL    https://github.com/Fogest/tornscripts/raw/master/tornscripts-dkk/hospital-all-day.js
// @connect      api.torn.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_notification
// @grant        unsafeWindow
// ==/UserScript==

const SETTINGS = {
    time: 15, // in minutes
    notify: {
        notifications: true,
        sound: {
            enabled: true,
            sound: "Chirp_1"
        }
    },
    border: true,
    host: {
        enabled: false,
        pages: [ "index.php", "hospital.php", "hospitalview.php", "item.php" ]
    },
    revivecheck: true
};

"use strict";

initScript({
    name: "Hospital All Day",
    logging: "all"
});

if (!window.HashChangeEvent)(function(){
    var lastURL = document.URL;
    window.addEventListener("hashchange", function(event){
        Object.defineProperty(event, "oldURL", {enumerable:true,configurable:true,value:lastURL});
        Object.defineProperty(event, "newURL", {enumerable:true,configurable:true,value:document.URL});
        lastURL = document.URL;
    });
}());

(function() {
    const GM_REVIVE = new Storage("revive", "GM");
    const GM_HOSPITAL = new Storage("hospital", "GM");
    const GM_HOSPITAL_NOTIFY = new Storage("notify", "GM");

    const USER = new CurrentUser();

    addCSS("had",
           ".had-border { border: 10px red solid; } "
           + ".had-border-revivecheck { border-left: 3px orange solid; border-right: 3px orange solid; }"
          );

    if (SETTINGS.revivecheck) {
        GM_REVIVE.get(false).then(showBorder => {
            setReviveBorder(showBorder);
            checkSettings();
        });
        GM_REVIVE.onEdit(setReviveBorder);
    }

    const API = new TornAPI(api => {
        if (isHost()) loadHost(api);
        else loadClient();
    });

    /* Functions */

    function setReviveBorder(showBorder) {
        dkklog.trace("setReviveBorder", showBorder);
        if (showBorder === true || showBorder === "true") $("#mainContainer").addClass("had-border-revivecheck");
        else $("#mainContainer").removeClass("had-border-revivecheck");
    }

    function checkSettings() {
        if (!window.location.pathname.includes("/preferences.php")) return;

        dkklog.trace("checkSettings", window.location.pathname);

        $(document).click(event => {
            if ($(event.target).attr("id") != "step_settings") return;

            updateSetting($('input[name="reviving"]:checked').get(0).id);
        });
    }

    function updateSetting(setting) {
        dkklog.trace("updateSetting", setting, setting == "allow-everyone");

        GM_REVIVE.set(setting == "allow-everyone");
    }

    function isHost() {
        if (!useHostSystem()) return true;

        let page = window.location.pathname;
        page = page.substring(1, page.indexOf(".php") + 4);

        return SETTINGS.host.pages.includes(page);
    }

    function useHostSystem() {
        return SETTINGS.host.enabled;
    }

    function loadHost(api) {
        dkklog.info("Acting as host.");
        if (SETTINGS.notify.sound.enabled) {
            if ($("audio:eq(0)").length) addSound();
            else observeMutations(document, "audio:eq(0)", true, addSound, { childList: true, subtree: true })
        }

        checkHospital(api);
        setInterval(() => checkHospital(API), 30000);
    }

    function loadClient() {
        dkklog.info("Acting as client.");
        GM_HOSPITAL.onEdit(setBorder);
    }

    function addSound() {
        $("audio:eq(0)").after(`<audio id='had-sound' src='/js/chat/sounds/${SETTINGS.notify.sound.sound}.mp3' allow='autoplay'></audio>`);
    }

    function checkHospital(api) {
        dkklog.trace("checkHospital");
        api.sendRequest("user", null, "profile").then(response => {
            let until = response.status.until;

            if (!until || !USER.update().isHospitalized) {
                updateHospital(false);
                return;
            }

            let minutesLeft = (until - (Date.now() / 1000)) / 60;

            dkklog.debug("minutesLeft", minutesLeft);
            updateHospital(minutesLeft <= SETTINGS.time, minutesLeft);
        }, error => {
            dkklog.warn("An error occured during an api call", error);
        });
    }

    function setBorder(showBorder) {
        dkklog.trace("setBorder", showBorder);
        if (showBorder === true || showBorder === "true") $("#mainContainer").addClass("had-border");
        else $("#mainContainer").removeClass("had-border");
    }

    function updateHospital(inHospital, timeLeft) {
        GM_HOSPITAL.set(inHospital);
        if (inHospital) {
            $("#mainContainer").addClass("had-border");

            notify(timeLeft);
        } else {
            $("#mainContainer").removeClass("had-border");

            setShouldNotify(true);
        }
    }

    function notify(timeLeft) {
        dkklog.trace("notify", timeLeft);
        GM_HOSPITAL_NOTIFY.get(false).then(should => {
            if (!should) return;

            if (SETTINGS.notify.sound.enabled) playSound();
            if (SETTINGS.notify.notifications) sendNotification(timeLeft);

            setShouldNotify(false);
        })

    }

    function setShouldNotify(should) {
        dkklog.trace("setShouldNotify", should);
        GM_HOSPITAL_NOTIFY.set(should);
    }

    function playSound() {
        $("#had-sound")[0].play();
        dkklog.trace("Sound played.");
    }

    function sendNotification(timeLeft) {
        GM_notification({
            text: `Almost out of the hospital,\nin ${timeLeft.format(2)} minutes!`,
            title: "Hospital All Day",
            silent: false
        });
        dkklog.trace("Notification showed.");
    }

})();