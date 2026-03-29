window.klaroConfig = {
    // https://github.com/kiprotect/klaro/blob/master/src/components/ide/spec.js
    version: 1,
    elementID: 'klaro',
    storageMethod: 'cookie',
    storageName: 'klaro',
    cookieExpiresAfterDays: 365,
    default: false,
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: false,
    htmlTexts: true,
    embedded: false,
    groupByPurpose: true,
    lang: 'hu',
    translations: {
        hu: {
            consentNotice: {
                title: 'Sütibeállítások',
                description: 'Az oldal sütiket használ az alapműködéshez, analitikához és marketinghez. A Google Tag Manager, a Google tag, a Microsoft Clarity, a Hotjar, a Meta Pixel, a LinkedIn Insight Tag, a Pinterest Tag, a TikTok Pixel és a YouTube csak az engedélyezésed után töltődik be.'
            },
            consentModal: {
                title: 'Adatvédelmi beállítások',
                description: 'Itt tudod kezelni, mely szolgáltatásokat engedélyezed.'
            },
            purposes: {
                functional: 'Működéshez szükséges',
                analytics: 'Analitika',
                advertising: 'Hirdetés'
            },
            purposeItem: {
                service: 'szolgáltatás',
                services: 'szolgáltatások'
            },
            ok: 'Rendben',
            save: 'Mentés',
            acceptAll: 'Összes elfogadása',
            declineAll: 'Összes elutasítása',
            decline: 'Elutasítom',
            close: 'Bezárás',
            contextualConsent: {
                acceptAlways: 'Mindig engedélyezem',
                acceptOnce: 'Most engedélyezem'
            },
            service: {
                disableAll: {
                    title: 'Összes szolgáltatás engedélyezése vagy tiltása',
                    description: 'Ezzel a kapcsolóval az összes opcionális szolgáltatást egyszerre kezelheted.'
                },
                optOut: {
                    title: '(kikapcsolható)',
                    description: 'Ez a szolgáltatás alapból engedélyezett, de bármikor kikapcsolható.'
                },
                required: {
                    title: '(kötelező)',
                    description: 'Ez a szolgáltatás az oldal működéséhez szükséges.'
                },
                purposes: 'Célok',
                purpose: 'Cél'
            }
        }
    },
    services: [
        {
            name: 'klaro',
            title: 'Klaro',
            purposes: ['functional'],
            default: true,
            required: true,
            optOut: false,
            onlyOnce: true,
            cookies: [
                'klaro'
            ],
            translations: {
                hu: {
                    title: 'Klaro',
                    description: 'A Klaro menti a sütibeállításaidat, hogy a választásod a következő látogatáskor is megmaradjon.'
                }
            }
        },
        {
            name: 'google-tag-manager',
            title: 'Google Tag Manager',
            purposes: ['analytics'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_ga',
                /^_ga_.*/,
                '_gid',
                /^_gat.*/
            ],
            translations: {
                hu: {
                    title: 'Google Tag Manager',
                    description: 'A Google Tag Manager az analitikai tagek kezelésére szolgál, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'google-tag',
            title: 'Google tag',
            purposes: ['analytics'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_ga',
                /^_ga_.*/,
                '_gid',
                /^_gat.*/
            ],
            translations: {
                hu: {
                    title: 'Google tag',
                    description: 'A Google tag (gtag.js) analitikai mérésekhez használható, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'microsoft-clarity',
            title: 'Microsoft Clarity',
            purposes: ['analytics'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_clck',
                '_clsk'
            ],
            translations: {
                hu: {
                    title: 'Microsoft Clarity',
                    description: 'A Microsoft Clarity viselkedéselemzésre és felvételalapú analitikára szolgál, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'hotjar',
            title: 'Hotjar',
            purposes: ['analytics'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_hjCookieTest',
                '_hjLocalStorageTest',
                '_hjSessionStorageTest',
                '_hjTLDTest',
                /^_hjSessionUser_.*/,
                /^_hjSession_.*/,
                '_hjClosedSurveyInvites',
                '_hjDonePolls',
                '_hjMinimizedPolls',
                '_hjShownFeedbackMessage',
                '_hjSessionTooLarge',
                '_hjSessionRejected',
                '_hjHasCachedUserAttributes',
                '_hjUserAttributesHash'
            ],
            translations: {
                hu: {
                    title: 'Hotjar',
                    description: 'A Hotjar viselkedéselemzésre és használhatósági mérésekre szolgál, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'activecampaign-site-tracking',
            title: 'ActiveCampaign Site Tracking',
            purposes: ['analytics'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                'ac_enable_tracking'
            ],
            translations: {
                hu: {
                    title: 'ActiveCampaign Site Tracking',
                    description: 'Az ActiveCampaign Site Tracking ismert kapcsolatok oldalmegtekintéseit és marketingautomatizációs interakcióit követi, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'meta-pixel',
            title: 'Meta Pixel',
            purposes: ['advertising'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_fbp',
                '_fbc'
            ],
            translations: {
                hu: {
                    title: 'Meta Pixel',
                    description: 'A Meta Pixel marketing- és hirdetési mérésekhez használható, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'linkedin-insight-tag',
            title: 'LinkedIn Insight Tag',
            purposes: ['advertising'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                'li_fat_id',
                'li_giant'
            ],
            translations: {
                hu: {
                    title: 'LinkedIn Insight Tag',
                    description: 'A LinkedIn Insight Tag hirdetési és konverziós mérésekhez használható, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'pinterest-tag',
            title: 'Pinterest Tag',
            purposes: ['advertising'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_pinterest_sess',
                '_pinterest_ct',
                '_pinterest_ct_rt',
                '_epik',
                '_derived_epik',
                '_pin_unauth',
                '_pinterest_ct_ua',
                '_routing_id'
            ],
            translations: {
                hu: {
                    title: 'Pinterest Tag',
                    description: 'A Pinterest Tag hirdetési és konverziós mérésekhez használható, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'tiktok-pixel',
            title: 'TikTok Pixel',
            purposes: ['advertising'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            cookies: [
                '_ttp',
                '_tt_enable_cookie',
                'ttcsid',
                '^ttcsid_.*',
                'ttclid',
                '_pangle'
            ],
            translations: {
                hu: {
                    title: 'TikTok Pixel',
                    description: 'A TikTok Pixel hirdetési és konverziós mérésekhez használható, és csak az engedélyezésed után töltődik be.'
                }
            }
        },
        {
            name: 'youtube',
            title: 'YouTube',
            purposes: ['advertising'],
            default: false,
            required: false,
            optOut: false,
            onlyOnce: true,
            translations: {
                hu: {
                    title: 'YouTube',
                    description: 'A YouTube videók csak az engedélyezésed után töltődnek be, és külső tartalmat jelenítenek meg.'
                }
            }
        }
    ]
};
