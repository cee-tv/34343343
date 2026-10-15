let jwPlayerInstance = null,
  activeIndex = -1

// Base URL for the /proxy endpoint used by HLS channels that need
// server-side proxying (mixed-content + CORS workaround, see server.py).
//
// - When this site is served BY server.py (e.g. on Replit dev/preview),
//   requests use the same origin's relative "/proxy?..." path, since
//   server.py implements that route itself.
// - When this site is exported to a static host with no backend of its own
//   (GitHub Pages), there's no local /proxy route, so requests are sent to
//   the deployed Cloudflare Worker instead (see cloudflare-worker.js),
//   which implements the same proxy logic and also serves the whole site.
// - When the site IS the proxy backend's own deployment (e.g. the Vercel
//   deployment itself, or the Cloudflare Worker), relative "/proxy" already
//   resolves correctly (same origin), so the absolute URL below is only
//   actually needed for hosts with no backend of their own (GitHub Pages).
//
// NOTE: Cloudflare Workers cannot be used as the proxy backend for this
// site -- Cloudflare blocks outbound Worker fetches to bare IP addresses
// like the upstream IPTV hosts here (error 1003, "Direct IP Access Not
// Allowed"). Use Vercel (api/proxy.js + vercel.json in this repo) instead;
// see api/proxy.js header comment for deploy steps.
const STATIC_HOST_PROXY_BASE_URL = 'https://34343343.vercel.app';
const PROXY_BASE_URL = (() => {
    const host = window.location.hostname;
    const hasOwnProxyBackend =
        host.endsWith('.repl.co') ||
        host.endsWith('.replit.dev') ||
        host.endsWith('.vercel.app');
    return hasOwnProxyBackend ? '' : STATIC_HOST_PROXY_BASE_URL;
})();

function proxiedUrl(targetUrl) {
    return PROXY_BASE_URL + '/proxy?url=' + encodeURIComponent(targetUrl);
}

const channels = [
    {
        number: 1,
        name: 'KAPATID CHANNEL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kapatid_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '8f7a2c913d6b4e5a9f127c8d4e6a1b90', key: 'a73d3d1211fb23084c62572706f45397'},
        },
    },
    {
        number: 2,
        name: 'TV5',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tv5_hd/default1/index.mpd',
        drm:
        {
            clearkey: {keyId: '9c3e7a516d824f04a9175b8c2e3d7040', key: '524a9c2cec98272f71c347345a3fd12e'},
        },
    },
    {
        number: 3,
        name: 'STUDIO UNIVERSAL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_studio_universal_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f8391e9130634854b4614f02ec028ea7', key: '9b9640f873cf906b91dd03c02612d5ce'},
        },
    },
    {
        number: 4,
        name: 'NCAA NXT',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbofam/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c6e4b9218f534a709d165c3a7e2f8048', key: '87c0e7cf73324aea32dada7b5f33063d'},
        },
    },
    {
        number: 5,
        name: 'ABANTE NEWS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_abante_news/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e5b2c7091a464d839f25b7c6e018a432', key: '9a933efca0ae690102cc9594b29803bf'},
        },
    },
    {
        number: 6,
        name: 'NBA TV PHILIPPINES',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgnl_nba/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '2f7c9a615d834e40b2188a6d3c7f9042', key: '41d2ade5ff1798859420e925d5d2080d'},
        },
    },
    {
        number: 7,
        name: 'UAAP VARSITY',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_uaap_cplay_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b6c9f4218d734a059e165c3d7a2f8049', key: '948aa5c0d0c15c70efb9257f5b75c379'},
        },
    },
    {
        number: 8,
        name: 'PBA RUSH',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_pbarush_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '91a5e6327c844f09b2186d3a5e7c2041', key: '984beb3aeff3554c1a5acc04d6044e55'},
        },
    },
    {
        number: 9,
        name: 'BBC LIFESTYLE',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_bbclifestyle/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '34880f56627c11ee8c990242ac120002', key: 'c23677c829bb244b79a3dc09ffd88ca0'},
        },
    },
    {
        number: 10,
        name: 'BILYONARYO CHANNEL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bilyonaryoch/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '2e7f9c518a424d30b2165c3e7a9d6041', key: '8c8c0ef924c982bc1dd92348e024cd4c'},
        },
    },
    {
        number: 11,
        name: 'RPTV',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cnn_rptv_prod_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b5d7a6219c434e188f026a3d7c5e9148', key: '28e1244057ff6feae879c1e985ded0fb'},
        },
    },
    {
        number: 12,
        name: 'HITS NOW',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hitsnow/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '24a8e6917c534d809f165b3e6a2d9047', key: '183f05bcb80e9cfcb613b8c767777f27'},
        },
    },
    {
        number: 13,
        name: 'TV MARIA',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tvmaria_prd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '6a2d9f815c744e30b9168f3a7d2c5049', key: 'fb07ec8ca16ffdb8b8a045fa4c8aac74'},
        },
    },
    {
        number: 14,
        name: 'LOTUS MACAU',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/lotusmacau_prd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e2c9a5748b314f60a9276d5e3c1f8042', key: 'c845cc41e3826b6d880b802911eb43f9'},
        },
    },
    {
        number: 15,
        name: 'TVN MOVIES',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnmovie/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e6c9a4215d734f608b197c3e2a5d9048', key: 'ec695ab203cb2258db220b3863e2a7ee'},
        },
    },
    {
        number: 16,
        name: 'DREAMWORKS TAGALIZED',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_dreamworktag/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '6f9c3a218d454b70a2187e5c3d6f9042', key: '337ca7b74b462dd1ba7441553614538a'},
        },
    },
    {
        number: 17,
        name: 'TVN PREMIUM',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnpre/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '3a7f9c615d824e40a9168c5b2d7f3049', key: '2bc91eced1660ecf88299a42e4c0cd91'},
        },
    },
    {
        number: 18,
        name: 'TMC',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tagalogmovie/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '27f6c4818a534d09b2169e5c7a3f6048', key: 'fbd8e319511ff5a1593f5b68da7b81cd'},
        },
    },
    {
        number: 19,
        name: 'GLOBAL TREKKER',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/globaltrekker/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e4b8d2916a534f709c187d3e5a2f6049', key: '85d67d8b52caf380c82dc45b07f26f69'},
        },
    },
    {
        number: 20,
        name: 'CGTN',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgtn/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f2a7d6318c544b099e216d5f3a7c8042', key: '1abff1626a5403fa2ea8964c2f3b9c1d'},
        },
    },
    {
        number: 21,
        name: 'CARTOON NETWORK',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cartoonnetworkhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '53c8e6914d724f30a9168b5e2c7d1043', key: '1e17afbdfff786533796780f3f04aa67'},
        },
    },
    {
        number: 22,
        name: 'CNN',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_cnnhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '1d9f6b828c454a17b2395e7d3f90a621', key: 'c5776d83cbf50c9354f27b1c830e1996'},
        },
    },
    {
        number: 23,
        name: 'A2Z',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_a2z/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f3a8c9126e544d809b312c7f5a8e6140', key: '43f5361983896b47ff01b4f77c5dbf3f'},
        },
    },
    {
        number: 24,
        name: 'DREAMWORKS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_dreamworks_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '1f7c9a425d864e30b2198a3c6f7d5041', key: 'b392ee3cd42686a8cff3070eef614745'},
        },
    },
    {
        number: 25,
        name: 'ANIMAL PLANET',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_animal_planet_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '3c8e5a927d414b069f236a5c8e1d7049', key: 'a9b9198bf7b116b30492aea4dc471122'},
        },
    },
    {
        number: 26,
        name: 'SPOTV',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_spotvhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c5e8a3927d414b609f286a3c5e1d7049', key: '7c5edbd3d090bb6de9a9c3685defa959'},
        },
    },
    {
        number: 27,
        name: 'PTV4',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_ptv4_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f8c2a6915d744b309e186a3f7c2d8049', key: '1ad3243b38c60312caa6ba11f150c19c'},
        },
    },
    {
        number: 28,
        name: 'PREMIER SPORTS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_ps_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '91e4c6725a834d198f602c7b9e3a5148', key: '4185d260443198690be03e294fdc1240'},
        },
    },
    {
        number: 29,
        name: 'ROCK EXTREME',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockextreme/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd9a4f5218c374b069e156f2d7a3c8049', key: '72aa902f471adf15bef2710b6b689ed0'},
        },
    },
    {
        number: 30,
        name: 'TAP SPORTS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tapsports/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a6d4f8912c734b608e159f3a7d5c2046', key: 'ec647e6c500235352a8df03c518e9b23'},
        },
    },
    {
        number: 31,
        name: 'BBC EARTH',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_bbcearth_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '4f9c6e217a354d80b9268e5c3f1a7042', key: '41b33eebbacf91fe6c86bd28081bf3fd'},
        },
    },
    {
        number: 32,
        name: 'ONE SPORTS PLUS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_onesportsplus_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e9c4f7312a854d69b0137f6e8c2a5490', key: '1105fa92173b06885be336b887bc4d26'},
        },
    },
    {
        number: 33,
        name: 'SPOTV2',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_spotv2hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f28d730090f64e229fb255b2afa6e36e', key: '53d432c60f419541c7319dc1b6508e2c'},
        },
    },
    {
        number: 34,
        name: 'ROCK ENTERTAINMENT',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockentertainment/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '86e5c7921a434f60b9287d3c9e5a6041', key: 'fab817af24eab2a73ae89145797cf556'},
        },
    },
    {
        number: 35,
        name: 'DISCOVERY',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/discovery/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd5a7f8219c364e50b2147f6d3a8c9025', key: 'c77d5e56c52c4065c42594422ac85e2c'},
        },
    },
    {
        number: 36,
        name: 'CCTV4',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_cctv4/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '83e5c4917d624b00a2196f3c8a5e2047', key: 'd8fae6a24d5df3fa8e17a8f4a4854426'},
        },
    },
    {
        number: 37,
        name: 'ARIRANG',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/arirang_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '7d4f9c216a834e508b165c3a7d9e2048', key: '9d148906d890053a00f5e581185ac066'},
        },
    },
    {
        number: 38,
        name: 'KBS WORLD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kbsworld/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e8c5d2317a944f06b2186d3a9e7c5042', key: 'ce327be0871677eb1c480d10a73eac34'},
        },
    },
    {
        number: 39,
        name: 'ONE NEWS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/onenews_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd5c8a2914e734b609f127a3d6c5e8048', key: '11368a3b001407d65a85b4edb410ecdd'},
        },
    },
    {
        number: 40,
        name: 'KIX',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kix_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '7f4a9c312e854d67b0198c6f5a3e7240', key: '141f058ad1a6230e7c6f9d302ce378ef'},
        },
    },
    {
        number: 41,
        name: 'LIFETIME',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_lifetime/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b9e6a3214c754f908d165a3c7e2f6048', key: '32300d9517f91a4acb747d360768dd00'},
        },
    },
    {
        number: 42,
        name: 'BBC WORLD NEWS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bbcworld_news_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f1a6e8329c574b048d216e5f3a7c9048', key: '8106237b47f99be13f4e941ca5bd35c5'},
        },
    },
    {
        number: 43,
        name: 'HGTV',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hgtv_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '4e9a6c317d524f808b163c5a2e7d9048', key: '5079e2288b584f47d4bbf8d149b2a986'},
        },
    },
    {
        number: 44,
        name: 'TRAVEL CHANNEL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/travel_channel_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '18c6f9235b744d81a0397e2c9f6a5048', key: '7974c1376447c563f5fdb41be0104ddf'},
        },
    },
    {
        number: 45,
        name: 'PREMIER SPORTS 2',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/premiersports2hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '72e4b9c13f864a52a9178d6c0e5b2394', key: '9390c1edae5ecf680c168daf44bf6a03'},
        },
    },
    {
        number: 46,
        name: 'HITS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hits_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd2e8c4715a634f09b2187c6d3e9a5042', key: '8b11760042654021997fd07a8a0b7acc'},
        },
    },
    {
        number: 47,
        name: 'AL JAZEERA',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_aljazeera/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '73c5f8919d424b06a2186e7c3a5d9040', key: 'bf46e85e8fba9f0eae0931394d478d25'},
        },
    },
    {
        number: 48,
        name: 'ONE PH',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/oneph_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '5e9a3c718d464f20b9157a6c2e4d8031', key: '7bf8a7666a2d572fe111b5f829c99266'},
        },
    },
    {
        number: 49,
        name: 'FOOD NETWORK',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_foodnetwork_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b1f4a8926c374d509e218a7c3f5d6049', key: '15cde0b44b44f38ea936513a99606c1b'},
        },
    },
    {
        number: 50,
        name: 'DEPED CHANNEL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/depedch_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c1a5e8329d644f70b2187a3c6e5d2041', key: '55979431f291f7dff35a43b73b3c2a36'},
        },
    },
    {
        number: 51,
        name: 'HISTORY',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_historyhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f5c7a8219d464e30b2186a3f7c5d9041', key: 'dacc84b7010ca22f8c63a7c290461ed3'},
        },
    },
    {
        number: 52,
        name: 'FASHION TV',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/fashiontvhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c8a4e6917f324d05b9186c5e3a2f7049', key: '92b4ece8c84379145045267b47f183d2'},
        },
    },
    {
        number: 53,
        name: 'CELESTIAL MOVIES PINOY',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/celmovie_pinoy_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '35f8d6917a424b059e166c3a7d5f8049', key: '76830e1bcb5819f76b7c515e9d65cc31'},
        },
    },
    {
        number: 54,
        name: 'BLOOMBERG',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bloomberg_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '19f6c8325a744d90b2618e3f7c2a5049', key: '784fffb38dc4fb6d5b74de822074feb4'},
        },
    },
    {
        number: 55,
        name: 'NHK JAPAN',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nhk_japan/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a3d7f5916c824e09b2158a5c3f7d2046', key: '32d760047f05c233d9dae35083fe0b30'},
        },
    },
    {
        number: 56,
        name: 'ASIAN FOOD NETWORK',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/asianfoodnetwork_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f4b7c8219e364a058d295c6f3e7a1042', key: 'd10c7f2a37c1079e6b83837423c0d6b2'},
        },
    },
    {
        number: 57,
        name: 'ONE SPORTS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_onesports_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '69f5a2318d744c609b125e3a7d8f2046', key: '182523c0bae912e17e916dd4283280e9'},
        },
    },
    {
        number: 58,
        name: 'NICK JR',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickjr/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'ca7e5b318d624f099c246a3e7d5f8140', key: '3175f0646c504fad87e97c7677a85393'},
        },
    },
    {
        number: 59,
        name: 'WARNER TV',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_warnerhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c4a8d5319e624f078b156d3c7a5e2049', key: 'cee9422b4a40d85589f36f1d76fb144f'},
        },
    },
    {
        number: 60,
        name: 'ANIMAX',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_animax_sd_new/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a7d3f5916c844b209e158f3a7d5c2046', key: '021fe5515e7dfb1a00a98d51abd0cb7f'},
        },
    },
    {
        number: 61,
        name: 'IBC13',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/ibc13_sd_new/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f4a8d6216c954e709b187d3a5f2c8049', key: '34710df996a4089ee6f7e8deb7f46586'},
        },
    },
    {
        number: 62,
        name: 'AXN',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_axn_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c7e5a2199d644b318f702a6c4e5d8139', key: '300778996b5a71594db508982256f365'},
        },
    },
    {
        number: 63,
        name: 'TAP MOVIES',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tapmovies_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '65d8c4912f734a90b8163e7c5d9a2041', key: 'fd495b984013da4e26f83b1a921c0a15'},
        },
    },
    {
        number: 64,
        name: 'MOONBUG KIDS',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_moonbug_kids_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '48e7d3219c564f80b2147a5d3e6c2048', key: '23a7b41054c60983ad020652f7ffa06e'},
        },
    },
    {
        number: 65,
        name: 'FRANCE24',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/france24/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '92d8f3416c754b09a2187e5d3a9c6042', key: '4e668d238bc656b7d2c7535757aa9531'},
        },
    },
    {
        number: 66,
        name: 'ABC AUSTRALIA',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/abc_aus/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd6f1a8c29b7e4d5a8f332c1e9d7b6a90', key: '790bd17b9e623e832003a993a2de1d87'},
        },
    },
    {
        number: 67,
        name: 'HITS MOVIES',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hitsmovies/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '45c9e7328b614d059f247a6c3e5d1048', key: '13ef5feae7c84eb06bcc655a225fb01d'},
        },
    },
    {
        number: 68,
        name: 'CHANNEL NEWS ASIA',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/channelnewsasia/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '56d8c4917a234e60b9159f3a6c7d2048', key: 'e6f0a100b6a2fcda66e8554f8c9b510b'},
        },
    },
    {
        number: 69,
        name: 'THRILL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_thrill_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b8c3d5906e424f17a9215d8c7a2e6043', key: '02ce48f1b48f7cbdc3e2703a56e8fa31'},
        },
    },
    {
        number: 70,
        name: 'CRIME + INVESTIGATION',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/crime_invest/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e7a3d5916c824b459f105d8e2c7a3046', key: '616f8ab0c416966e8de415cb60e9e6cf'},
        },
    },
    {
        number: 71,
        name: 'KNOWLEDGE CHANNEL',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/knowledge_channel/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '84d2f6917b354c08a9163e5d8f2a7049', key: '192c69ef479dd7e3fccc908d6c5dbb3a'},
        },
    },
    {
        number: 72,
        name: 'TV5 MONDE',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tv5_monde/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e6b4c8217a954d309f165c8e2a3d7049', key: '1acbc3a347d31fa2236f180574342e71'},
        },
    },
    {
        number: 73,
        name: 'NICKELODEON',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickelodeon/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '81f3e6924c754a08b9215d7e9c3f6048', key: '094cd48e9729cb8bcb0e03e848fc8751'},
        },
    },
    {
        number: 74,
        name: 'PILIPINAS LIVE 1',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '73f8c2915d644e70b2189a3c6d7f2045', key: 'fb199597a99e601c9bc8767a1b20312b'},
        },
    },
    {
        number: 75,
        name: 'PILIPINAS LIVE 2',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi2/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c5a8f3917d424e809b166f3c2a7d9045', key: '6a7f2a17bad0a84674108234403d5fa0'},
        },
    },
    {
        number: 76,
        name: 'PILIPINAS LIVE 3',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi3/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c2f8d6917a354e60b2196d3c5a8f9042', key: '2f593fbabad7a9f968c9fec691d59806'},
        },
    },
    {
        number: 77,
        name: 'PILIPINAS LIVE 4',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi4/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e9a4d6316c854b008f175d3a7e2c9048', key: 'd7e06c12d35cfd2e13d8f3d3094941a3'},
        },
    },
    {
        number: 78,
        name: 'PILIPINAS LIVE 5',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi5/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b4f7c8219d624e30a9156c3a5d7f2048', key: '60391d7d3bb726a4a95e66c4c0af219d'},
        },
    },
    {
        number: 79,
        name: 'PILIPINAS LIVE 6',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi6/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f3d8a6915c724b609e146a7f3c2d8049', key: '20b4724a4d406c3a89c7b0d7084626a0'},
        },
    },
    {
        number: 80,
        name: 'PILIPINAS LIVE 7',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi7/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '5a7e9c316d424b80a2183f5c7d9e2046', key: '746ca1548780fc4d8cc9fc948403a3da'},
        },
    },
    {
        number: 81,
        name: 'PILIPINAS LIVE 8',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi8/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd6c9a4218e534f099b167c3a5d2e8048', key: '980ec0896ae1ba03f46d85453798b708'},
        },
    },
    {
        number: 82,
        name: 'PILIPINAS LIVE 9',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi9/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '1c8e5a927d434f60b2196a3c9e5d8041', key: '33af0fd38e463d1c747a2cb0b203c42e'},
        },
    },
    {
        number: 83,
        name: 'PILIPINAS LIVE 10',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/pl_sdi10/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '63055a8904644407a64a57874703f71e', key: '0fd611777d37a7ff8afce19d9cee2e91'},
        },
    }
]

function setupChannelList() {
  const list = document.getElementById('channelList');
  const countDisplay = document.getElementById('channelCount');
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value || 'all';

  list.innerHTML = '';
  let totalCount = 0;
  let visibleIndex = 0;

  channels.forEach((channel, originalIndex) => {
    const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
    const matchesSearch = channel.name.toLowerCase().includes(searchValue);

    if (matchesCategory && matchesSearch) {
      totalCount++;

      const displayNumber = originalIndex + 1;

      const listItem = document.createElement('li');
      listItem.tabIndex = 0;
      
      // Modified click handler to restart current channel
      listItem.onclick = () => {
        if (activeIndex === originalIndex) {
          // Force restart of current channel
          activeIndex = -1; // Reset to force reload
          loadChannel(originalIndex);
          showChannelInfo(originalIndex);
        } else {
          loadChannel(originalIndex);
          showChannelInfo(originalIndex);
        }
        scrollChannelToMiddle(originalIndex);
      };
      
      listItem.setAttribute('data-number', displayNumber);
      listItem.setAttribute('data-original-index', originalIndex);

      if (originalIndex === activeIndex) {
        listItem.classList.add('active');
        currentChannelIndex = originalIndex;
      }

      listItem.textContent = channel.name + ' ';

      list.appendChild(listItem);
    }
  });

  countDisplay.textContent = `Total: ${totalCount}/${channels.length}`;
      }
