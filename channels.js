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
        name: 'Channel 77',
        category: 'Other',
        type: 'hls',
        url: proxiedUrl('http://204.52.191.254/play/live.php?mac=00:1A:79:7b:ab:a5&stream=1548700&extension=m3u8'),
    },
    {
        number: 2,
        name: 'Channel 78',
        category: 'Other',
        type: 'hls',
        url: proxiedUrl('http://204.52.191.254/play/live.php?mac=00:1A:79:7b:ab:a5&stream=440523&extension=m3u8'),
    },
    {
        number: 3,
        name: 'True FM TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/truefm_tv/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '8c4e9a516d724f30b2187a3c5e9d6041', key: 'e25c167573772b510ff8e5282560a349'},
        },
    },
    {
        number: 4,
        name: 'Hits Now',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hitsnow/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '24a8e6917c534d809f165b3e6a2d9047', key: '183f05bcb80e9cfcb613b8c767777f27'},
        },
    },
    {
        number: 5,
        name: 'HBO HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbohd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd7f3c8215a944e068b176c9d2a5f3048', key: '93c0a798243d6443864d1a7ff3e42c05'},
        },
    },
    {
        number: 6,
        name: 'TV Maria',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tvmaria_prd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '6a2d9f815c744e30b9168f3a7d2c5049', key: 'fb07ec8ca16ffdb8b8a045fa4c8aac74'},
        },
    },
    {
        number: 7,
        name: 'HBO Family',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbofam/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c6e4b9218f534a709d165c3a7e2f8048', key: '87c0e7cf73324aea32dada7b5f33063d'},
        },
    },
    {
        number: 8,
        name: 'Cinemax',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_cinemax/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd7a9c5215e364b809f148c2d6a7e3045', key: 'c92a3b4a7fe9fab97c130468260b963f'},
        },
    },
    {
        number: 9,
        name: 'Lotus Macau',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/lotusmacau_prd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e2c9a5748b314f60a9276d5e3c1f8042', key: 'c845cc41e3826b6d880b802911eb43f9'},
        },
    },
    {
        number: 10,
        name: 'HBO Signature',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbosign/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '74d8f5916c234b80a9179e5d3c7a2046', key: 'f8d2753ff54579efc01d3373acf21f96'},
        },
    },
    {
        number: 11,
        name: 'HBO Hits',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbohits/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '3e8c5a917d424f06b2196a5c9e2d8043', key: '516c47ccef00a12421d9805c8c1c6c1d'},
        },
    },
    {
        number: 12,
        name: 'TVN Movie',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnmovie/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e6c9a4215d734f608b197c3e2a5d9048', key: 'ec695ab203cb2258db220b3863e2a7ee'},
        },
    },
    {
        number: 13,
        name: 'DreamWorks',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_dreamworktag/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '6f9c3a218d454b70a2187e5c3d6f9042', key: '337ca7b74b462dd1ba7441553614538a'},
        },
    },
    {
        number: 14,
        name: 'TVN Premier',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnpre/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '3a7f9c615d824e40a9168c5b2d7f3049', key: '2bc91eced1660ecf88299a42e4c0cd91'},
        },
    },
    {
        number: 15,
        name: 'Tagalog Movie Channel',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tagalogmovie/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '27f6c4818a534d09b2169e5c7a3f6048', key: 'fbd8e319511ff5a1593f5b68da7b81cd'},
        },
    },
    {
        number: 16,
        name: 'Kapatid',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kapatid_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '8f7a2c913d6b4e5a9f127c8d4e6a1b90', key: 'a73d3d1211fb23084c62572706f45397'},
        },
    },
    {
        number: 17,
        name: 'Global Trekker',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/globaltrekker/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e4b8d2916a534f709c187d3e5a2f6049', key: '85d67d8b52caf380c82dc45b07f26f69'},
        },
    },
    {
        number: 18,
        name: 'CGTN',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgtn/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f2a7d6318c544b099e216d5f3a7c8042', key: '1abff1626a5403fa2ea8964c2f3b9c1d'},
        },
    },
    {
        number: 19,
        name: 'NBA TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgnl_nba/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '2f7c9a615d834e40b2188a6d3c7f9042', key: '41d2ade5ff1798859420e925d5d2080d'},
        },
    },
    {
        number: 20,
        name: 'Vibe TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tv5_hd/default1/index.mpd',
        drm:
        {
            clearkey: {keyId: '9c3e7a516d824f04a9175b8c2e3d7040', key: '524a9c2cec98272f71c347345a3fd12e'},
        },
    },
    {
        number: 21,
        name: 'Cartoon Network HD',
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
        name: 'CNN HD',
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
        name: 'DreamWorks HD',
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
        name: 'Animal Planet',
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
        name: 'SPOTV HD',
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
        name: 'PTV 4',
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
        name: 'Premier Sports HD',
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
        name: 'Rock Extreme',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockextreme/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd9a4f5218c374b069e156f2d7a3c8049', key: '72aa902f471adf15bef2710b6b689ed0'},
        },
    },
    {
        number: 30,
        name: 'Tap Sports',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tapsports/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a6d4f8912c734b608e159f3a7d5c2046', key: 'ec647e6c500235352a8df03c518e9b23'},
        },
    },
    {
        number: 31,
        name: 'BBC Earth HD',
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
        name: 'One Sports Plus HD',
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
        name: 'SPOTV 2 HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_spotv2hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b2d8f6315c494e07a8129f6a3d5c2048', key: '6b4247def21bbd0d08629a3cb4c62ee9'},
        },
    },
    {
        number: 34,
        name: 'Rock Entertainment',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockentertainment/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '86e5c7921a434f60b9287d3c9e5a6041', key: 'fab817af24eab2a73ae89145797cf556'},
        },
    },
    {
        number: 35,
        name: 'Discovery Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/discovery/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd5a7f8219c364e50b2147f6d3a8c9025', key: 'c77d5e56c52c4065c42594422ac85e2c'},
        },
    },
    {
        number: 36,
        name: 'CCTV 4',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_cctv4/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '83e5c4917d624b00a2196f3c8a5e2047', key: 'd8fae6a24d5df3fa8e17a8f4a4854426'},
        },
    },
    {
        number: 37,
        name: 'PBA Rush HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_pbarush_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '91a5e6327c844f09b2186d3a5e7c2041', key: '984beb3aeff3554c1a5acc04d6044e55'},
        },
    },
    {
        number: 38,
        name: 'Arirang',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/arirang_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '7d4f9c216a834e508b165c3a7d9e2048', key: '9d148906d890053a00f5e581185ac066'},
        },
    },
    {
        number: 39,
        name: 'KBS World',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kbsworld/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e8c5d2317a944f06b2186d3a9e7c5042', key: 'ce327be0871677eb1c480d10a73eac34'},
        },
    },
    {
        number: 40,
        name: 'One News HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/onenews_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd5c8a2914e734b609f127a3d6c5e8048', key: '11368a3b001407d65a85b4edb410ecdd'},
        },
    },
    {
        number: 41,
        name: 'KIX HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kix_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '7f4a9c312e854d67b0198c6f5a3e7240', key: '141f058ad1a6230e7c6f9d302ce378ef'},
        },
    },
    {
        number: 42,
        name: 'Lifetime',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_lifetime/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b9e6a3214c754f908d165a3c7e2f6048', key: '32300d9517f91a4acb747d360768dd00'},
        },
    },
    {
        number: 43,
        name: 'BBC World News',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bbcworld_news_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f1a6e8329c574b048d216e5f3a7c9048', key: '8106237b47f99be13f4e941ca5bd35c5'},
        },
    },
    {
        number: 44,
        name: 'HGTV HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hgtv_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '4e9a6c317d524f808b163c5a2e7d9048', key: '5079e2288b584f47d4bbf8d149b2a986'},
        },
    },
    {
        number: 45,
        name: 'UAAP Varsity Channel',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_uaap_cplay_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b6c9f4218d734a059e165c3d7a2f8049', key: '948aa5c0d0c15c70efb9257f5b75c379'},
        },
    },
    {
        number: 46,
        name: 'Travel Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/travel_channel_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '18c6f9235b744d81a0397e2c9f6a5048', key: '7974c1376447c563f5fdb41be0104ddf'},
        },
    },
    {
        number: 47,
        name: 'Premier Sports 2 HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/premiersports2hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '72e4b9c13f864a52a9178d6c0e5b2394', key: '9390c1edae5ecf680c168daf44bf6a03'},
        },
    },
    {
        number: 48,
        name: 'Hits HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hits_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'd2e8c4715a634f09b2187c6d3e9a5042', key: '8b11760042654021997fd07a8a0b7acc'},
        },
    },
    {
        number: 49,
        name: 'Al Jazeera',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_aljazeera/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '73c5f8919d424b06a2186e7c3a5d9040', key: 'bf46e85e8fba9f0eae0931394d478d25'},
        },
    },
    {
        number: 50,
        name: 'One PH',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/oneph_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '5e9a3c718d464f20b9157a6c2e4d8031', key: '7bf8a7666a2d572fe111b5f829c99266'},
        },
    },
    {
        number: 51,
        name: 'Food Network HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_foodnetwork_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b1f4a8926c374d509e218a7c3f5d6049', key: '15cde0b44b44f38ea936513a99606c1b'},
        },
    },
    {
        number: 52,
        name: 'DepEd TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/depedch_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c1a5e8329d644f70b2187a3c6e5d2041', key: '55979431f291f7dff35a43b73b3c2a36'},
        },
    },
    {
        number: 53,
        name: 'History HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_historyhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f5c7a8219d464e30b2186a3f7c5d9041', key: 'dacc84b7010ca22f8c63a7c290461ed3'},
        },
    },
    {
        number: 54,
        name: 'Fashion TV HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/fashiontvhd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c8a4e6917f324d05b9186c5e3a2f7049', key: '92b4ece8c84379145045267b47f183d2'},
        },
    },
    {
        number: 55,
        name: 'Cinema One Pinoy',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/celmovie_pinoy_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '35f8d6917a424b059e166c3a7d5f8049', key: '76830e1bcb5819f76b7c515e9d65cc31'},
        },
    },
    {
        number: 56,
        name: 'Bloomberg',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bloomberg_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '19f6c8325a744d90b2618e3f7c2a5049', key: '784fffb38dc4fb6d5b74de822074feb4'},
        },
    },
    {
        number: 57,
        name: 'NHK Japan',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nhk_japan/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a3d7f5916c824e09b2158a5c3f7d2046', key: '32d760047f05c233d9dae35083fe0b30'},
        },
    },
    {
        number: 58,
        name: 'Asian Food Network',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/asianfoodnetwork_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f4b7c8219e364a058d295c6f3e7a1042', key: 'd10c7f2a37c1079e6b83837423c0d6b2'},
        },
    },
    {
        number: 59,
        name: 'One Sports HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_onesports_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '69f5a2318d744c609b125e3a7d8f2046', key: '182523c0bae912e17e916dd4283280e9'},
        },
    },
    {
        number: 60,
        name: 'Nick Jr',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickjr/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'ca7e5b318d624f099c246a3e7d5f8140', key: '3175f0646c504fad87e97c7677a85393'},
        },
    },
    {
        number: 61,
        name: 'Warner TV HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_warnerhd/default1/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c4a8d5319e624f078b156d3c7a5e2049', key: 'cee9422b4a40d85589f36f1d76fb144f'},
        },
    },
    {
        number: 62,
        name: 'Animax',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_animax_sd_new/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'a7d3f5916c844b209e158f3a7d5c2046', key: '021fe5515e7dfb1a00a98d51abd0cb7f'},
        },
    },
    {
        number: 63,
        name: 'IBC 13',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/ibc13_sd_new/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'f4a8d6216c954e709b187d3a5f2c8049', key: '34710df996a4089ee6f7e8deb7f46586'},
        },
    },
    {
        number: 64,
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
        number: 65,
        name: 'TAP Movies HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tapmovies_hd1/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '65d8c4912f734a90b8163e7c5d9a2041', key: 'fd495b984013da4e26f83b1a921c0a15'},
        },
    },
    {
        number: 66,
        name: 'Moonbug Kids',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_moonbug_kids_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '48e7d3219c564f80b2147a5d3e6c2048', key: '23a7b41054c60983ad020652f7ffa06e'},
        },
    },
    {
        number: 67,
        name: 'France 24',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/france24/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '92d8f3416c754b09a2187e5d3a9c6042', key: '4e668d238bc656b7d2c7535757aa9531'},
        },
    },
    {
        number: 68,
        name: 'ABC Australia',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/abc_aus/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'ab3d7e816f254c9490185d2a8f7e3640', key: 'a3bbc044cac690469a243c43f642c467'},
        },
    },
    {
        number: 69,
        name: 'Hits Movies',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hitsmovies/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '45c9e7328b614d059f247a6c3e5d1048', key: '13ef5feae7c84eb06bcc655a225fb01d'},
        },
    },
    {
        number: 70,
        name: 'Channel NewsAsia',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/channelnewsasia/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '56d8c4917a234e60b9159f3a6c7d2048', key: 'e6f0a100b6a2fcda66e8554f8c9b510b'},
        },
    },
    {
        number: 71,
        name: 'Thrill',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_thrill_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b8c3d5906e424f17a9215d8c7a2e6043', key: '02ce48f1b48f7cbdc3e2703a56e8fa31'},
        },
    },
    {
        number: 72,
        name: 'Crime & Investigation',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/crime_invest/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e7a3d5916c824b459f105d8e2c7a3046', key: '616f8ab0c416966e8de415cb60e9e6cf'},
        },
    },
    {
        number: 73,
        name: 'Buko',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_buko_sd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'c8b1d5f42a674e93b8016f2d9c7a5e34', key: '168bbf02d7eca252a61a402e25cb33f5'},
        },
    },
    {
        number: 74,
        name: 'Knowledge Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/knowledge_channel/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '84d2f6917b354c08a9163e5d8f2a7049', key: '192c69ef479dd7e3fccc908d6c5dbb3a'},
        },
    },
    {
        number: 75,
        name: 'TV5 Monde',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tv5_monde/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'e6b4c8217a954d309f165c8e2a3d7049', key: '1acbc3a347d31fa2236f180574342e71'},
        },
    },
    {
        number: 76,
        name: 'Nickelodeon',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickelodeon/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '81f3e6924c754a08b9215d7e9c3f6048', key: '094cd48e9729cb8bcb0e03e848fc8751'},
        },
    },
    {
        number: 77,
        name: 'Bilyonaryoch',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bilyonaryoch/default/index.mpd',
        drm:
        {
            clearkey: {keyId: '2e7f9c518a424d30b2165c3e7a9d6041', key: '8c8c0ef924c982bc1dd92348e024cd4c'},
        },
    },
    {
        number: 78,
        name: 'CNN Philippines',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cnn_rptv_prod_hd/default/index.mpd',
        drm:
        {
            clearkey: {keyId: 'b5d7a6219c434e188f026a3d7c5e9148', key: '28e1244057ff6feae879c1e985ded0fb'},
        },
    },
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
