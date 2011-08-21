var techtxtdetector = (function() {
    var appcontent = null,
        initialized = false,
        icon = null,
        prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch).getBranch('techtxtdetector.');

    var publicFunctions = {
        'handleBtn': handleBtn
    };

    /**
     * Wrapper method for all findUrl* methods. Once a suitable method
     * returns an URL or no tech.txt is found at all, callback is executed
     * with the URL or "undefined" as argument.
     *
     */
    function findUrl(window, doc, tab, callback) {
        var url = getTechUrl(doc);
        if (url === null) {
            if (prefs.getBoolPref('methods.headlink') === true) { 
                url = findUrlInDom(window.content.document);
            }
            if ((url === null || url === false) && prefs.getBoolPref('methods.domainfile') === true) {
                findUrlOnDomain(doc, function(foundUrl) {
                    setTechUrl(doc, foundUrl);
                    callback(foundUrl, window, doc, tab);
                });
                return;
            }
            setTechUrl(doc, url);
        }
        callback(url, window, doc, tab);
    }

    /**
     * Checks the DOM for a reference to a tech.txt file and returns it if
     * found. Otherwise false is returned.
     */
    function findUrlInDom(doc) {
        var links = doc.querySelectorAll('head>link'),
            linkCnt = links.length,
            link = null;
        for (var i = 0; i < linkCnt; i++) {
            link = links[0];
            if (link.getAttribute('rel') === 'tech.txt') {
                return link.getAttribute('href');
            }
        }
        return false;
    }

    function findUrlOnDomain(doc, callback) {
        var loc = window.content.location,
            url = loc.protocol + '//' + loc.host + '/tech.txt',
            req = new XMLHttpRequest(),
            lockKey = 'techtxt-lookup-in-progress';
        // Don't do a lookup on file://
        if (loc.protocol === 'file:') return callback(false);
        // Make sure that the XHR is only done once per document
        if (doc.getUserData(lockKey) !== null) return;
        doc.setUserData(lockKey, true, null);
        req.open('HEAD', url, true);
        req.onreadystatechange = function(evt) {
            if (req.readyState === 4) {
                doc.setUserData(lockKey, null, null);
                if (req.status < 400 && req.status >= 200) {
                    callback(url);
                } else {
                    callback(false);
                }
            }
        };
        req.send(null);
    }

    function handleBtn(evt) {
        gBrowser.selectedTab = gBrowser.addTab(getTechUrl(window.content.document));
    }

    /**
     * @return any cached tech url in the current document
     */
    function getTechUrl(doc) {
        return doc.getUserData('techtxt-url');
    }

    /**
     * Caches the given URL in the current document.
     *
     * @param url The found url to be cached for the current document
     */
    function setTechUrl(doc, url) {
        doc.setUserData('techtxt-url', url, null);
    }
    
    /**
     * Executed whenever the current tab or its content changes in order
     * to update the status icon in the address bar.
     *
     * Once this is executed on a document, getTechUrl() will return any
     * found tech.txt.
     */
    function handlePageLoad(evt) {
        var tab = gBrowser.selectedTab,
            doc = window.content.document;
        if (window.content.location.protocol === 'about:') {
            icon.setAttribute('hidden', true);
            return;
        }
        findUrl(window, doc, tab, function(url, window_, doc_, tab_) {
            if (tab_ !== tab) {
                return;
            }
            if (url !== null && url !== false) {
                icon.setAttribute('hidden', false);
            } else {
                icon.setAttribute('hidden', true);
            }
        });
    }

    function init() {
        if (initialized) {
            return;
        }
        document.getElementById('techtxt-icon').setAttribute('hidden', true);
        appcontent = document.getElementById('appcontent');
        //appcontent.addEventListener('pageshow', handlePageLoad, false);
        gBrowser.addEventListener('DOMContentLoaded', handlePageLoad, false);
        gBrowser.tabContainer.addEventListener('TabSelect', handlePageLoad, false);
        icon = document.getElementById('techtxt-icon');
    }
    window.addEventListener('load', init, false);
    return publicFunctions;
})();
