// Requires ECMAScript 5 (ES5) syntax support.
(function () {
    'use strict';

    var SERVICE_NAMES = {
        gtm: 'google-tag-manager',
        gtag: 'google-tag',
        clarity: 'microsoft-clarity',
        activeCampaign: 'activecampaign-site-tracking',
        metaPixel: 'meta-pixel',
        linkedinInsightTag: 'linkedin-insight-tag',
        pinterestTag: 'pinterest-tag',
        tiktokPixel: 'tiktok-pixel',
        hotjar: 'hotjar',
        youtube: 'youtube'
    };

    var SERVICE_DATA_ATTRIBUTES = {
        gtm: 'data-gtm-id',
        gtag: 'data-gtag-id',
        // data-gtag-ids is parsed separately because it supports comma-separated values.
        clarity: 'data-clarity-project-id',
        activeCampaign: 'data-activecampaign-account-id',
        metaPixel: 'data-meta-pixel-id',
        linkedinInsightTag: 'data-linkedin-partner-id',
        pinterestTag: 'data-pinterest-tag-id',
        tiktokPixel: 'data-tiktok-pixel-id',
        hotjar: 'data-hotjar-id'
    };

    function getServiceOptionName(serviceName) {
        var serviceKey;

        for (serviceKey in SERVICE_NAMES) {
            if (SERVICE_NAMES[serviceKey] !== serviceName) {
                continue;
            }

            if (serviceKey === 'youtube') {
                return null;
            }

            if (serviceKey === 'clarity') {
                return 'clarityProjectId';
            }

            if (serviceKey === 'activeCampaign') {
                return 'activeCampaignAccountId';
            }

            if (serviceKey === 'linkedinInsightTag') {
                return 'linkedinPartnerId';
            }

            return serviceKey + 'Id';
        }

        return null;
    }

    function trimString(value) {
        return value.replace(/^\s+|\s+$/g, '');
    }

    function parseAttributeList(value) {
        var values = [];
        var parts;
        var index;
        var part;

        if (typeof value !== 'string') {
            return values;
        }

        parts = value.split(',');
        for (index = 0; index < parts.length; index += 1) {
            part = trimString(parts[index]);
            if (part) {
                values.push(part);
            }
        }

        return values;
    }

    function buildUniqueIdList(primaryValue, values) {
        var ids = [];
        var seen = Object.create(null);
        var index;
        var value;

        function addId(id) {
            if (typeof id !== 'string') {
                return;
            }

            id = trimString(id);
            if (!id || seen[id]) {
                return;
            }

            seen[id] = true;
            ids.push(id);
        }

        addId(primaryValue);

        for (index = 0; values && index < values.length; index += 1) {
            value = values[index];
            addId(value);
        }

        return ids;
    }

    function getBootstrapOptions(script) {
        var options = {
            settingsButtonMode: script ? script.getAttribute('data-settings-button') : null,
            dataLayerName: script ? script.getAttribute('data-layer-name') : null,
            hotjarVersion: script ? script.getAttribute('data-hotjar-version') : null,
            youtubeConsentTargetName: script ? script.getAttribute('data-youtube-service') : null,
            gtagIds: parseAttributeList(script ? script.getAttribute('data-gtag-ids') : null)
        };
        var serviceKey;
        var serviceName;
        var optionName;

        for (serviceKey in SERVICE_DATA_ATTRIBUTES) {
            serviceName = SERVICE_NAMES[serviceKey];
            optionName = getServiceOptionName(serviceName);

            if (!optionName) {
                continue;
            }

            options[optionName] = script ? script.getAttribute(SERVICE_DATA_ATTRIBUTES[serviceKey]) : null;
        }

        if (options.gtagId === null && options.gtagIds && options.gtagIds.length > 0) {
            options.gtagId = options.gtagIds[0];
        }

        return options;
    }

    function isServiceEnabledFromOptions(service, options) {
        var optionName;
        var serviceName = service && service.name;

        if (service && service.required) {
            return true;
        }

        if (serviceName === 'klaro') {
            return true;
        }

        if (!options) {
            return false;
        }

        optionName = getServiceOptionName(serviceName);
        return !!optionName && options[optionName] !== null;
    }

    function installKlaroConfigFilter(script, context) {
        var currentConfig = window.klaroConfig;

        function applyFilter(config) {
            var filteredServices = [];
            var requestedTargetName;
            var youtubeService = null;
            var hasMatchingService = false;
            var hasMatchingPurpose = false;
            var index;
            var service;

            if (!context) {
                return config;
            }

            context.options = getBootstrapOptions(script);
            requestedTargetName = context.options.youtubeConsentTargetName;
            context.youtubeConsentTargetName = requestedTargetName === null
                ? null
                : (requestedTargetName || SERVICE_NAMES.youtube);

            if (!config || !config.services) {
                return config;
            }

            for (index = 0; index < config.services.length; index++) {
                service = config.services[index];

                if (service.name === SERVICE_NAMES.youtube) {
                    youtubeService = service;
                    continue;
                }

                if (!isServiceEnabledFromOptions(service, context.options)) {
                    continue;
                }

                filteredServices.push(service);

                if (!requestedTargetName || context.youtubeConsentTargetName === SERVICE_NAMES.youtube) {
                    continue;
                }

                if (service.name === requestedTargetName) {
                    hasMatchingService = true;
                    continue;
                }

                if (serviceMatchesPurpose(service, requestedTargetName)) {
                    hasMatchingPurpose = true;
                }
            }

            if (requestedTargetName !== null
                && context.youtubeConsentTargetName !== SERVICE_NAMES.youtube
                && !hasMatchingService
                && !hasMatchingPurpose) {
                context.youtubeConsentTargetName = SERVICE_NAMES.youtube;
            }

            if (youtubeService && context.youtubeConsentTargetName === SERVICE_NAMES.youtube) {
                filteredServices.push(youtubeService);
            }

            config.services = filteredServices;
            return config;
        }

        if (currentConfig) {
            window.klaroConfig = applyFilter(currentConfig);
            return;
        }

        Object.defineProperty(window, 'klaroConfig', {
            configurable: true,
            enumerable: true,
            get: function () {
                return currentConfig;
            },
            set: function (value) {
                currentConfig = applyFilter(value);
            }
        });
    }

    function getFirstScriptParent() {
        var firstScript = document.getElementsByTagName('script')[0];

        if (firstScript && firstScript.parentNode) {
            return {
                parent: firstScript.parentNode,
                before: firstScript
            };
        }

        if (document.head) {
            return {
                parent: document.head,
                before: null
            };
        }

        if (document.body) {
            return {
                parent: document.body,
                before: null
            };
        }

        return null;
    }

    function insertScript(scriptElement) {
        var target = getFirstScriptParent();

        if (!target) {
            console.warn('CMP bootstrap: could not find a DOM node for script injection');
            return false;
        }

        if (target.before) {
            target.parent.insertBefore(scriptElement, target.before);
        } else {
            target.parent.appendChild(scriptElement);
        }

        return true;
    }

    function createVendorRegistry() {
        var vendors = Object.create(null);

        return {
            register: function (vendor) {
                vendors[vendor.serviceName] = vendor;
                if (typeof vendor.init === 'function') {
                    vendor.init();
                }
            },
            applyManagerState: function (manager) {
                Object.keys(vendors).forEach(function (serviceName) {
                    var vendor = vendors[serviceName];
                    var consent = typeof vendor.isActive === 'function'
                        ? vendor.isActive(manager)
                        : isServiceActive(manager, serviceName);

                    vendor.syncConsent(consent);
                });
            }
        };
    }

    function createConsentAwareVendor(serviceName, hooks) {
        var hasConsent = false;

        return {
            serviceName: serviceName,
            syncConsent: function (consent) {
                if (consent) {
                    if (!hasConsent) {
                        hooks.grant();
                        hasConsent = true;
                    }
                    return;
                }

                if (hasConsent) {
                    hooks.revoke();
                    hasConsent = false;
                }
            }
        };
    }

    function createKlaroBridge(registry) {
        var maxAttempts = 40;
        var delayMs = 250;
        var isBound = false;
        var uiHelpers = Array.prototype.slice.call(arguments, 1);

        var watcher = {
            update: function (manager, type) {
                if (type === 'applyConsents') {
                    registry.applyManagerState(manager);
                    syncUiHelpers(manager);
                }
            }
        };

        function syncUiHelpers(manager) {
            var index;

            for (index = 0; index < uiHelpers.length; index++) {
                if (uiHelpers[index] && typeof uiHelpers[index].syncManager === 'function') {
                    uiHelpers[index].syncManager(manager);
                }
            }
        }

        function bindManager(manager) {
            if (!manager || isBound) {
                return;
            }

            manager.watch(watcher);
            isBound = true;
            registry.applyManagerState(manager);
            syncUiHelpers(manager);
        }

        function tryBind(attempt) {
            var manager;

            if (attempt >= maxAttempts) {
                console.warn('CMP bootstrap: Klaro did not become available in time');
                return;
            }

            if (!window.klaro || typeof window.klaro.getManager !== 'function') {
                window.setTimeout(function () {
                    tryBind(attempt + 1);
                }, delayMs);
                return;
            }

            try {
                manager = window.klaro.getManager();
            } catch (error) {
                console.warn('CMP bootstrap: failed to access Klaro manager');
                return;
            }

            if (!manager) {
                window.setTimeout(function () {
                    tryBind(attempt + 1);
                }, delayMs);
                return;
            }

            bindManager(manager);
        }

        return {
            start: function () {
                tryBind(0);
            }
        };
    }

    function createSettingsButton(options) {
        var mode = options.mode;
        var manager = null;
        var button = null;
        var observer = null;
        var observedRoot = null;
        var isInjected = false;
        var intervalStarted = false;
        var updateQueued = false;
        var hiddenClassName = 'cmp-cookie-settings-trigger-hidden';
        var buttonClassName = 'cmp-cookie-settings-trigger';

        function isEnabled() {
            return mode === 'floating';
        }

        function getLabel() {
            var config = window.klaroConfig;
            var lang;
            var translations;

            if (!config || !config.translations) {
                return 'Cookie settings';
            }

            lang = config.lang || 'en';
            translations = config.translations[lang] || config.translations.en;

            if (translations && translations.consentModal && translations.consentModal.title) {
                return translations.consentModal.title;
            }

            if (translations && translations.consentNotice && translations.consentNotice.title) {
                return translations.consentNotice.title;
            }

            return 'Cookie settings';
        }

        function getKlaroRoot() {
            var config = window.klaroConfig;
            var elementId = config && config.elementID ? config.elementID : 'klaro';

            return document.getElementById(elementId);
        }

        function isUiOpen() {
            var root = getKlaroRoot();

            if (!root || !root.querySelector) {
                return false;
            }

            return !!root.querySelector('.cookie-modal, .cookie-notice:not(.cookie-notice-hidden)');
        }

        function updateVisibility() {
            var shouldShow;

            if (!button) {
                return;
            }

            shouldShow = !!(manager && manager.confirmed && !isUiOpen());

            if (shouldShow) {
                button.classList.remove(hiddenClassName);
                button.removeAttribute('aria-hidden');
                return;
            }

            button.classList.add(hiddenClassName);
            button.setAttribute('aria-hidden', 'true');
        }

        function queueVisibilityUpdate() {
            if (updateQueued) {
                return;
            }

            updateQueued = true;
            window.setTimeout(function () {
                updateQueued = false;
                updateVisibility();
            }, 0);
        }

        function openSettings(event) {
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }

            if (window.klaro && typeof window.klaro.show === 'function') {
                window.klaro.show(window.klaroConfig, true);
                queueVisibilityUpdate();
            }
        }

        function ensureButton() {
            var icon;
            var label;

            if (!isEnabled() || isInjected || !document.body) {
                return;
            }

            label = getLabel();
            button = document.createElement('button');
            button.type = 'button';
            button.className = buttonClassName + ' ' + hiddenClassName;
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);

            icon = document.createElement('span');
            icon.className = 'cmp-cookie-settings-icon';
            icon.setAttribute('aria-hidden', 'true');
            button.appendChild(icon);

            button.addEventListener('click', openSettings);
            document.body.appendChild(button);
            isInjected = true;
            updateVisibility();
        }

        function bindUiObserver() {
            var root;

            if (!isEnabled()) {
                return;
            }

            root = getKlaroRoot();

            if (typeof MutationObserver === 'function' && root) {
                if (observedRoot === root) {
                    return;
                }

                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }

                observer = new MutationObserver(queueVisibilityUpdate);
                observer.observe(root, {
                    attributes: true,
                    attributeFilter: ['class'],
                    childList: true,
                    subtree: true
                });
                observedRoot = root;
                return;
            }

            if (!intervalStarted) {
                intervalStarted = true;
                window.setInterval(queueVisibilityUpdate, 300);
            }
        }

        return {
            init: function () {
                if (!isEnabled()) {
                    return;
                }

                if (document.body) {
                    ensureButton();
                } else {
                    document.addEventListener('DOMContentLoaded', ensureButton);
                }

                bindUiObserver();
            },
            syncManager: function (currentManager) {
                if (!isEnabled()) {
                    return;
                }

                manager = currentManager;
                ensureButton();
                bindUiObserver();
                updateVisibility();
            }
        };
    }

    function isServiceActive(manager, serviceName) {
        var service;
        var consent;
        var required;
        var optOut;
        var globalOptOut;
        var confirmed;

        if (!manager || !manager.consents) {
            return false;
        }

        consent = !!manager.consents[serviceName];
        service = typeof manager.getService === 'function'
            ? manager.getService(serviceName)
            : null;
        required = !!(service && service.required);
        optOut = !!(service && service.optOut);
        globalOptOut = !!(manager.config && manager.config.optOut);
        confirmed = !!manager.confirmed || optOut || globalOptOut;

        return required || (consent && confirmed);
    }

    function serviceMatchesPurpose(service, purposeName) {
        var index;
        var purposes;

        if (!service || !service.purposes || !purposeName) {
            return false;
        }

        purposes = service.purposes;

        for (index = 0; index < purposes.length; index++) {
            if (purposes[index] === purposeName) {
                return true;
            }
        }

        return false;
    }

    function getConfiguredServices(manager) {
        return manager && manager.config && manager.config.services
            ? manager.config.services
            : [];
    }

    function getServiceByName(manager, serviceName) {
        if (!manager || typeof manager.getService !== 'function') {
            return null;
        }

        return manager.getService(serviceName) || null;
    }

    function isPurposeActive(manager, purposeName) {
        var services;
        var index;
        var service;

        services = getConfiguredServices(manager);

        for (index = 0; index < services.length; index++) {
            service = services[index];

            if (serviceMatchesPurpose(service, purposeName) && isServiceActive(manager, service.name)) {
                return true;
            }
        }

        return false;
    }

    function isConsentTargetActive(manager, targetName) {
        return getServiceByName(manager, targetName)
            ? isServiceActive(manager, targetName)
            : isPurposeActive(manager, targetName);
    }

    function updateConsentTarget(manager, targetName, consent) {
        var services;
        var index;
        var changed = false;

        if (!manager || typeof manager.updateConsent !== 'function') {
            return false;
        }

        if (getServiceByName(manager, targetName)) {
            manager.updateConsent(targetName, consent);
            return true;
        }

        services = getConfiguredServices(manager);

        for (index = 0; index < services.length; index++) {
            if (serviceMatchesPurpose(services[index], targetName)) {
                manager.updateConsent(services[index].name, consent);
                changed = true;
            }
        }

        return changed;
    }

    function ensureGoogleTagRuntime(dataLayerName) {
        window[dataLayerName] = window[dataLayerName] || [];

        if (typeof window.gtag !== 'function') {
            window.gtag = function () {
                window[dataLayerName].push(arguments);
            };
        }
    }

    function buildGoogleConsentState(consent) {
        return {
            analytics_storage: consent ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        };
    }

    function updateGoogleTagConsent(dataLayerName, consent) {
        ensureGoogleTagRuntime(dataLayerName);
        window.gtag('consent', 'update', buildGoogleConsentState(consent));
    }

    function buildGoogleDataLayerParam(dataLayerName) {
        return dataLayerName !== 'dataLayer'
            ? '&l=' + encodeURIComponent(dataLayerName)
            : '';
    }

    function createGtmVendor(options) {
        var serviceName = SERVICE_NAMES.gtm;
        var gtmId = options.gtmId;
        var dataLayerName = options.dataLayerName || 'dataLayer';
        var hasLoaded = false;

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureGoogleTagRuntime(dataLayerName);
            window.gtag('consent', 'default', buildGoogleConsentState(false));
            window[dataLayerName].push({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js'
            });

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://www.googletagmanager.com/gtm.js?id='
                + encodeURIComponent(gtmId)
                + buildGoogleDataLayerParam(dataLayerName);

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                if (hasLoaded) {
                    updateGoogleTagConsent(dataLayerName, true);
                }
            },
            revoke: function () {
                if (hasLoaded) {
                    updateGoogleTagConsent(dataLayerName, false);
                }
            }
        });
    }

    function createGtagVendor(options) {
        var serviceName = SERVICE_NAMES.gtag;
        var gtagIds = buildUniqueIdList(options.gtagId, options.gtagIds);
        var gtagId = gtagIds.length > 0 ? gtagIds[0] : null;
        var dataLayerName = options.dataLayerName || 'dataLayer';
        var hasLoaded = false;
        var hasConfigured = false;

        function load() {
            var scriptElement;

            if (hasLoaded || gtagId === null) {
                return;
            }

            ensureGoogleTagRuntime(dataLayerName);
            window.gtag('consent', 'default', buildGoogleConsentState(false));
            window.gtag('js', new Date());

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://www.googletagmanager.com/gtag/js?id='
                + encodeURIComponent(gtagId)
                + buildGoogleDataLayerParam(dataLayerName);

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        function configure() {
            var idIndex;

            if (hasConfigured) {
                return;
            }

            ensureGoogleTagRuntime(dataLayerName);
            for (idIndex = 0; idIndex < gtagIds.length; idIndex += 1) {
                window.gtag('config', gtagIds[idIndex]);
            }
            hasConfigured = true;
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                if (hasLoaded) {
                    updateGoogleTagConsent(dataLayerName, true);
                    configure();
                }
            },
            revoke: function () {
                if (hasLoaded) {
                    updateGoogleTagConsent(dataLayerName, false);
                }
            }
        });
    }

    function createMetaPixelVendor(options) {
        var serviceName = SERVICE_NAMES.metaPixel;
        var pixelId = options.pixelId;
        var hasLoaded = false;
        var hasInitialized = false;

        function ensureRuntime() {
            var fbq;

            if (typeof window.fbq === 'function') {
                return;
            }

            fbq = function () {
                if (fbq.callMethod) {
                    fbq.callMethod.apply(fbq, arguments);
                } else {
                    fbq.queue.push(arguments);
                }
            };

            if (!window._fbq) {
                window._fbq = fbq;
            }

            fbq.push = fbq;
            fbq.loaded = true;
            fbq.version = '2.0';
            fbq.queue = [];
            window.fbq = fbq;
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://connect.facebook.net/en_US/fbevents.js';

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        function initialize() {
            if (!hasInitialized && typeof window.fbq === 'function') {
                window.fbq('set', 'autoConfig', false, pixelId);
                window.fbq('init', pixelId);
                hasInitialized = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                initialize();

                if (typeof window.fbq === 'function') {
                    window.fbq('consent', 'grant');
                    window.fbq('track', 'PageView');
                }
            },
            revoke: function () {
                if (hasInitialized && typeof window.fbq === 'function') {
                    window.fbq('consent', 'revoke');
                }
            }
        });
    }

    function createClarityVendor(options) {
        var serviceName = SERVICE_NAMES.clarity;
        var projectId = options.projectId;
        var hasLoaded = false;

        function ensureRuntime() {
            if (typeof window.clarity === 'function') {
                return;
            }

            window.clarity = function () {
                (window.clarity.q = window.clarity.q || []).push(arguments);
            };
        }

        function updateConsent(consent) {
            if (typeof window.clarity !== 'function') {
                return;
            }

            window.clarity('consentv2', {
                ad_Storage: 'denied',
                analytics_Storage: consent ? 'granted' : 'denied'
            });

            if (!consent) {
                window.clarity('consent', false);
            }
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(projectId);

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                updateConsent(true);
            },
            revoke: function () {
                if (hasLoaded) {
                    updateConsent(false);
                }
            }
        });
    }

    function createLinkedInInsightTagVendor(options) {
        var serviceName = SERVICE_NAMES.linkedinInsightTag;
        var partnerId = options.partnerId;
        var hasLoaded = false;

        function clearAdsId(storage) {
            if (!storage || typeof storage.removeItem !== 'function') {
                return;
            }

            try {
                storage.removeItem('li_adsid');
            } catch (error) {
            }
        }

        function ensureRuntime() {
            if (!window._linkedin_data_partner_ids) {
                window._linkedin_data_partner_ids = [];
            }

            if (window._linkedin_data_partner_ids.indexOf(partnerId) === -1) {
                window._linkedin_data_partner_ids.push(partnerId);
            }

            if (typeof window.lintrk !== 'function') {
                window.lintrk = function (action, data) {
                    window.lintrk.q.push([action, data]);
                };
                window.lintrk.q = [];
            }
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
            },
            revoke: function () {
                clearAdsId(window.localStorage);
                clearAdsId(window.sessionStorage);
            }
        });
    }

    function createPinterestTagVendor(options) {
        var serviceName = SERVICE_NAMES.pinterestTag;
        var tagId = options.tagId;
        var hasLoaded = false;
        var hasInitialized = false;

        function ensureRuntime() {
            var pintrk;

            if (typeof window.pintrk === 'function') {
                return;
            }

            pintrk = function () {
                pintrk.queue.push(Array.prototype.slice.call(arguments));
            };
            pintrk.queue = [];
            pintrk.version = '3.0';
            window.pintrk = pintrk;
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://s.pinimg.com/ct/core.js';

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        function initialize() {
            if (!hasInitialized && typeof window.pintrk === 'function') {
                window.pintrk('load', tagId);
                hasInitialized = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                initialize();

                if (typeof window.pintrk === 'function') {
                    window.pintrk('setconsent', true);
                    window.pintrk('page');
                }
            },
            revoke: function () {
                if (hasInitialized && typeof window.pintrk === 'function') {
                    window.pintrk('setconsent', false);
                }
            }
        });
    }

    function createTikTokPixelVendor(options) {
        var serviceName = SERVICE_NAMES.tiktokPixel;
        var pixelId = options.pixelId;
        var hasLoaded = false;

        function clearStorage(storage, key) {
            if (!storage || typeof storage.removeItem !== 'function') {
                return;
            }

            try {
                storage.removeItem(key);
            } catch (error) {
            }
        }

        function ensureRuntime() {
            var ttq;
            var methods;
            var index;

            if (window.ttq && typeof window.ttq.load === 'function' && typeof window.ttq.instance === 'function') {
                return;
            }

            methods = [
                'page',
                'track',
                'identify',
                'instances',
                'debug',
                'on',
                'off',
                'once',
                'ready',
                'alias',
                'group',
                'enableCookie',
                'disableCookie'
            ];

            window.TiktokAnalyticsObject = 'ttq';
            ttq = window.ttq = window.ttq || [];
            ttq.methods = methods;
            ttq.setAndDefer = function (target, methodName) {
                target[methodName] = function () {
                    target.push([methodName].concat(Array.prototype.slice.call(arguments, 0)));
                };
            };

            for (index = 0; index < methods.length; index++) {
                ttq.setAndDefer(ttq, methods[index]);
            }

            ttq.instance = function (instanceId) {
                var instance = ttq._i[instanceId] || [];
                var methodIndex;

                for (methodIndex = 0; methodIndex < methods.length; methodIndex++) {
                    ttq.setAndDefer(instance, methods[methodIndex]);
                }

                return instance;
            };

            ttq.load = function (instanceId, config) {
                var scriptElement;
                var firstScript;
                var baseUrl = 'https://analytics.tiktok.com/i18n/pixel/events.js';

                ttq._i = ttq._i || {};
                ttq._i[instanceId] = ttq._i[instanceId] || [];
                ttq._i[instanceId]._u = baseUrl;
                ttq._t = ttq._t || {};
                ttq._t[instanceId] = +new Date();
                ttq._o = ttq._o || {};
                ttq._o[instanceId] = config || {};

                scriptElement = document.createElement('script');
                scriptElement.type = 'text/javascript';
                scriptElement.async = true;
                scriptElement.src = baseUrl
                    + '?sdkid='
                    + encodeURIComponent(instanceId)
                    + '&lib=ttq';

                firstScript = document.getElementsByTagName('script')[0];

                if (firstScript && firstScript.parentNode) {
                    firstScript.parentNode.insertBefore(scriptElement, firstScript);
                    return;
                }

                if (document.head) {
                    document.head.appendChild(scriptElement);
                }
            };
        }

        function load() {
            if (hasLoaded) {
                return;
            }

            ensureRuntime();
            if (window.ttq && typeof window.ttq.load === 'function') {
                window.ttq.load(pixelId);
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();

                if (window.ttq && typeof window.ttq.page === 'function') {
                    window.ttq.page();
                }
            },
            revoke: function () {
                clearStorage(window.sessionStorage, 'tt_pixel_session_index');
                clearStorage(window.sessionStorage, 'tt_appInfo');
                clearStorage(window.sessionStorage, 'tt_sessionId');
            }
        });
    }

    function createHotjarVendor(options) {
        var serviceName = SERVICE_NAMES.hotjar;
        var siteId = options.siteId;
        var scriptVersion = options.scriptVersion || 6;
        var hasLoaded = false;

        function clearStorage(storage, key) {
            if (!storage || typeof storage.removeItem !== 'function') {
                return;
            }

            try {
                storage.removeItem(key);
            } catch (error) {
            }
        }

        function ensureRuntime() {
            if (typeof window.hj === 'function') {
                return;
            }

            window.hj = function () {
                window.hj.q.push(arguments);
            };
            window.hj.q = [];
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();
            window._hjSettings = {
                hjid: Number(siteId),
                hjsv: Number(scriptVersion)
            };

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://static.hotjar.com/c/hotjar-'
                + encodeURIComponent(siteId)
                + '.js?sv='
                + encodeURIComponent(scriptVersion);

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
            },
            revoke: function () {
                clearStorage(window.localStorage, '_hjUserAttributes');
                clearStorage(window.localStorage, 'hjActiveViewportIds');
                clearStorage(window.sessionStorage, 'hjViewportId');
            }
        });
    }

    function createActiveCampaignVendor(options) {
        var serviceName = SERVICE_NAMES.activeCampaign;
        var accountId = options.accountId;
        var hasLoaded = false;

        function ensureRuntime() {
            if (typeof window.vgo === 'function') {
                return;
            }

            window.visitorGlobalObjectAlias = 'vgo';
            window.vgo = window.vgo || function () {
                (window.vgo.q = window.vgo.q || []).push(arguments);
            };
            window.vgo.l = (new Date()).getTime();
        }

        function configureRuntime() {
            if (typeof window.vgo !== 'function') {
                return;
            }

            window.vgo('setAccount', accountId);
            window.vgo('setTrackByDefault', false);
        }

        function setConsentCookie(enabled) {
            var expires = enabled
                ? new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30)
                : null;
            var cookie = 'ac_enable_tracking=' + (enabled ? '1' : '');

            cookie += '; path=/';

            if (enabled) {
                cookie += '; expires=' + expires.toUTCString();
            } else {
                cookie += '; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';
            }

            document.cookie = cookie + '; SameSite=None; Secure';
            document.cookie = cookie;
        }

        function load() {
            var scriptElement;

            if (hasLoaded) {
                return;
            }

            ensureRuntime();
            configureRuntime();

            scriptElement = document.createElement('script');
            scriptElement.async = true;
            scriptElement.src = 'https://diffuser-cdn.app-us1.com/diffuser/diffuser.js';

            if (insertScript(scriptElement)) {
                hasLoaded = true;
            }
        }

        return createConsentAwareVendor(serviceName, {
            grant: function () {
                load();
                configureRuntime();
                setConsentCookie(true);

                if (typeof window.vgo === 'function') {
                    window.vgo('process');
                    window.vgo('process', 'allowTracking');
                }
            },
            revoke: function () {
                configureRuntime();
                setConsentCookie(false);
            }
        });
    }

    function createYouTubeVendor(options) {
        var defaultConsentTargetName = options.consentTargetName || SERVICE_NAMES.youtube;
        var consentGranted = false;
        var observer = null;
        var tokenCounter = 0;
        var entries = Object.create(null);
        var placeholderCopy = {
            title: 'YouTube video',
            description: 'This video loads from YouTube only after consent.',
            button: 'Load video'
        };

        function getConsentTargetName() {
            if (typeof options.getConsentTargetName === 'function') {
                return options.getConsentTargetName() || defaultConsentTargetName;
            }

            return defaultConsentTargetName;
        }

        function getManager() {
            if (!window.klaro || typeof window.klaro.getManager !== 'function') {
                return null;
            }

            try {
                return window.klaro.getManager();
            } catch (error) {
                return null;
            }
        }

        function grantContextualConsent() {
            var manager = getManager();

            if (!manager) {
                return false;
            }

            if (!updateConsentTarget(manager, getConsentTargetName(), true)) {
                return false;
            }

            manager.saveAndApplyConsents('contextual');

            return true;
        }

        function appendCssUnit(value) {
            return /^\d+$/.test(value) ? value + 'px' : value;
        }

        function getIframeSource(iframe) {
            if (!iframe || iframe.tagName !== 'IFRAME') {
                return null;
            }

            return iframe.getAttribute('data-cmp-src')
                || iframe.getAttribute('data-src')
                || iframe.getAttribute('src');
        }

        function parseYouTubeUrl(src) {
            var url;
            var match;

            if (!src) {
                return null;
            }

            url = document.createElement('a');
            url.href = src.indexOf('//') === 0 ? window.location.protocol + src : src;

            if (!/(^|\.)(youtube\.com|youtube-nocookie\.com)$/.test(url.hostname)) {
                return null;
            }

            match = /^\/embed\/([^/?#]+)/.exec(url.pathname);

            if (!match) {
                return null;
            }

            return {
                videoId: decodeURIComponent(match[1]),
                query: url.search ? url.search.slice(1) : ''
            };
        }

        function buildYouTubeSrc(entry) {
            return 'https://www.youtube-nocookie.com/embed/'
                + encodeURIComponent(entry.videoId)
                + (entry.query ? '?' + entry.query : '');
        }

        function buildThumbnailUrl(entry) {
            return 'https://i.ytimg.com/vi/'
                + encodeURIComponent(entry.videoId)
                + '/hqdefault.jpg';
        }

        function applyPresentation(entry, element) {
            if (entry.className) {
                element.className += ' ' + entry.className;
            }

            if (entry.styleText) {
                element.setAttribute('style', entry.styleText);
            }

            if (entry.widthAttr) {
                element.style.width = appendCssUnit(entry.widthAttr);
            }

            if (entry.heightAttr) {
                element.style.height = appendCssUnit(entry.heightAttr);
            }

            if (entry.widthNumber && entry.heightNumber && !entry.heightAttr) {
                element.style.aspectRatio = entry.widthNumber + ' / ' + entry.heightNumber;
            }
        }

        function replaceCurrentElement(entry, newElement) {
            if (entry.currentElement && entry.currentElement.parentNode) {
                entry.currentElement.parentNode.replaceChild(newElement, entry.currentElement);
            }

            entry.currentElement = newElement;
        }

        function activateEntry(entry) {
            var iframe = document.createElement('iframe');

            iframe.className = 'cmp-youtube-embed';
            iframe.setAttribute('data-cmp-youtube-token', entry.token);
            iframe.setAttribute('src', buildYouTubeSrc(entry));
            iframe.setAttribute('title', entry.title || placeholderCopy.title);
            iframe.setAttribute('frameborder', entry.frameBorder || '0');
            iframe.setAttribute('allow', entry.allow || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            iframe.setAttribute('referrerpolicy', entry.referrerPolicy || 'strict-origin-when-cross-origin');
            iframe.setAttribute('loading', entry.loading || 'lazy');

            if (entry.allowFullscreen) {
                iframe.setAttribute('allowfullscreen', '');
            }

            applyPresentation(entry, iframe);
            replaceCurrentElement(entry, iframe);
        }

        function deactivateEntry(entry) {
            var placeholder;
            var content;
            var description;
            var title;
            var body;
            var button;

            placeholder = document.createElement('button');
            placeholder.type = 'button';
            placeholder.className = 'cmp-youtube-placeholder';
            placeholder.setAttribute('data-cmp-youtube-token', entry.token);
            placeholder.setAttribute('aria-label', (entry.title || placeholderCopy.title) + ': ' + placeholderCopy.button);
            placeholder.style.backgroundImage = 'linear-gradient(180deg, rgba(9, 12, 17, 0.18) 0%, rgba(9, 12, 17, 0.86) 100%), url("'
                + buildThumbnailUrl(entry)
                + '")';

            applyPresentation(entry, placeholder);

            content = document.createElement('span');
            content.className = 'cmp-youtube-placeholder-content';

            description = document.createElement('span');
            description.className = 'cmp-youtube-placeholder-copy';
            title = document.createElement('strong');
            title.appendChild(document.createTextNode(entry.title || placeholderCopy.title));
            body = document.createElement('span');
            body.appendChild(document.createTextNode(placeholderCopy.description));
            description.appendChild(title);
            description.appendChild(body);

            button = document.createElement('span');
            button.className = 'cmp-youtube-placeholder-button';
            button.appendChild(document.createTextNode(placeholderCopy.button));

            content.appendChild(description);
            content.appendChild(button);
            placeholder.appendChild(content);
            placeholder.addEventListener('click', function () {
                if (!grantContextualConsent() && typeof window.klaro !== 'undefined' && typeof window.klaro.show === 'function') {
                    window.klaro.show(window.klaroConfig, true);
                }
            });

            replaceCurrentElement(entry, placeholder);
        }

        function processIframe(iframe) {
            var parsed;
            var widthNumber;
            var heightNumber;
            var token;
            var entry;

            if (!iframe || iframe.tagName !== 'IFRAME' || iframe.getAttribute('data-cmp-youtube-token')) {
                return;
            }

            parsed = parseYouTubeUrl(getIframeSource(iframe));

            if (!parsed) {
                return;
            }

            widthNumber = parseInt(iframe.getAttribute('width'), 10);
            heightNumber = parseInt(iframe.getAttribute('height'), 10);
            token = String(tokenCounter++);
            entry = {
                token: token,
                videoId: parsed.videoId,
                query: parsed.query,
                title: iframe.getAttribute('title'),
                className: iframe.className || '',
                styleText: iframe.getAttribute('style') || '',
                widthAttr: iframe.getAttribute('width'),
                heightAttr: iframe.getAttribute('height'),
                widthNumber: isNaN(widthNumber) ? null : widthNumber,
                heightNumber: isNaN(heightNumber) ? null : heightNumber,
                allow: iframe.getAttribute('allow'),
                referrerPolicy: iframe.getAttribute('referrerpolicy'),
                loading: iframe.getAttribute('loading'),
                frameBorder: iframe.getAttribute('frameborder'),
                allowFullscreen: iframe.hasAttribute('allowfullscreen'),
                currentElement: iframe
            };

            entries[token] = entry;

            if (consentGranted) {
                activateEntry(entry);
            } else {
                deactivateEntry(entry);
            }
        }

        function scanNode(node) {
            var iframes;
            var index;

            if (!node || node.nodeType !== 1) {
                return;
            }

            if (node.tagName === 'IFRAME') {
                processIframe(node);
            }

            iframes = node.querySelectorAll ? node.querySelectorAll('iframe') : [];

            for (index = 0; index < iframes.length; index++) {
                processIframe(iframes[index]);
            }
        }

        function scanDocument() {
            scanNode(document.body || document.documentElement);
        }

        return {
            serviceName: SERVICE_NAMES.youtube,
            isActive: function (manager) {
                return isConsentTargetActive(manager, getConsentTargetName());
            },
            init: function () {
                if (typeof MutationObserver === 'function' && document.documentElement) {
                    observer = new MutationObserver(function (mutations) {
                        var mutationIndex;
                        var nodeIndex;

                        for (mutationIndex = 0; mutationIndex < mutations.length; mutationIndex++) {
                            for (nodeIndex = 0; nodeIndex < mutations[mutationIndex].addedNodes.length; nodeIndex++) {
                                scanNode(mutations[mutationIndex].addedNodes[nodeIndex]);
                            }
                        }
                    });

                    observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                    });
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', scanDocument);
                } else {
                    scanDocument();
                }
            },
            syncConsent: function (consent) {
                var token;

                consentGranted = consent;
                scanDocument();

                for (token in entries) {
                    if (consentGranted) {
                        activateEntry(entries[token]);
                    } else {
                        deactivateEntry(entries[token]);
                    }
                }
            }
        };
    }

    function buildRegistry(context) {
        var registry = createVendorRegistry();
        var options = context ? context.options : null;
        var dataLayerName = options ? options.dataLayerName : null;
        var gtmId = options ? options.gtmId : null;
        var gtagId = options ? options.gtagId : null;
        var gtagIds = options && options.gtagIds ? options.gtagIds : [];
        var clarityProjectId = options ? options.clarityProjectId : null;
        var activeCampaignAccountId = options ? options.activeCampaignAccountId : null;
        var metaPixelId = options ? options.metaPixelId : null;
        var linkedinPartnerId = options ? options.linkedinPartnerId : null;
        var pinterestTagId = options ? options.pinterestTagId : null;
        var tiktokPixelId = options ? options.tiktokPixelId : null;
        var hotjarId = options ? options.hotjarId : null;
        var hotjarVersion = options ? options.hotjarVersion : null;
        var youtubeConsentTargetName = context ? context.youtubeConsentTargetName : null;

        if (gtmId !== null) {
            registry.register(createGtmVendor({
                gtmId: gtmId,
                dataLayerName: dataLayerName || 'dataLayer'
            }));
        }

        if (gtagId !== null || gtagIds.length > 0) {
            registry.register(createGtagVendor({
                gtagId: gtagId,
                gtagIds: gtagIds,
                dataLayerName: dataLayerName || 'dataLayer'
            }));
        }

        if (clarityProjectId !== null) {
            registry.register(createClarityVendor({
                projectId: clarityProjectId
            }));
        }

        if (activeCampaignAccountId !== null) {
            registry.register(createActiveCampaignVendor({
                accountId: activeCampaignAccountId
            }));
        }

        if (metaPixelId !== null) {
            registry.register(createMetaPixelVendor({
                pixelId: metaPixelId
            }));
        }

        if (linkedinPartnerId !== null) {
            registry.register(createLinkedInInsightTagVendor({
                partnerId: linkedinPartnerId
            }));
        }

        if (pinterestTagId !== null) {
            registry.register(createPinterestTagVendor({
                tagId: pinterestTagId
            }));
        }

        if (tiktokPixelId !== null) {
            registry.register(createTikTokPixelVendor({
                pixelId: tiktokPixelId
            }));
        }

        if (hotjarId !== null) {
            registry.register(createHotjarVendor({
                siteId: hotjarId,
                scriptVersion: hotjarVersion || 6
            }));
        }

        if (youtubeConsentTargetName !== null) {
            registry.register(createYouTubeVendor({
                consentTargetName: youtubeConsentTargetName || SERVICE_NAMES.youtube,
                getConsentTargetName: function () {
                    return context ? context.youtubeConsentTargetName : null;
                }
            }));
        }

        return registry;
    }

    var currentScript = document.currentScript;
    var bootstrapContext = {
        options: getBootstrapOptions(currentScript),
        youtubeConsentTargetName: null
    };

    if (bootstrapContext.options.youtubeConsentTargetName !== null) {
        bootstrapContext.youtubeConsentTargetName = bootstrapContext.options.youtubeConsentTargetName || SERVICE_NAMES.youtube;
    }

    installKlaroConfigFilter(currentScript, bootstrapContext);
    var registry = buildRegistry(bootstrapContext);
    var settingsButton = createSettingsButton({
        mode: bootstrapContext.options ? bootstrapContext.options.settingsButtonMode : null
    });
    var klaroBridge = createKlaroBridge(registry, settingsButton);

    settingsButton.init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            klaroBridge.start();
        });
    } else {
        klaroBridge.start();
    }
})();
