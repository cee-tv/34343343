let jwPlayerInstance = null,
  activeIndex = -1
const channels = [
    {
        number: 1,
        name: 'Bilyonaryoch',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bilyonaryoch/default/index.mpd',
    },
    {
        number: 2,
        name: 'CNN Philippines',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cnn_rptv_prod_hd/default/index.mpd',
    },
    {
        number: 3,
        name: 'True FM TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/truefm_tv/default/index.mpd',
    },
    {
        number: 4,
        name: 'Hits Now',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hitsnow/default/index.mpd',
    },
    {
        number: 5,
        name: 'HBO HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbohd/default/index.mpd',
    },
    {
        number: 6,
        name: 'TV Maria',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tvmaria_prd/default/index.mpd',
    },
    {
        number: 7,
        name: 'HBO Family',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbofam/default/index.mpd',
    },
    {
        number: 8,
        name: 'Cinemax',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_cinemax/default/index.mpd',
    },
    {
        number: 9,
        name: 'Lotus Macau',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/lotusmacau_prd/default/index.mpd',
    },
    {
        number: 10,
        name: 'HBO Signature',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbosign/default/index.mpd',
    },
    {
        number: 11,
        name: 'HBO Hits',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_hbohits/default/index.mpd',
    },
    {
        number: 12,
        name: 'TVN Movie',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnmovie/default/index.mpd',
    },
    {
        number: 13,
        name: 'DreamWorks',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_dreamworktag/default/index.mpd',
    },
    {
        number: 14,
        name: 'TVN Premier',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tvnpre/default/index.mpd',
    },
    {
        number: 15,
        name: 'Tagalog Movie Channel',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tagalogmovie/default/index.mpd',
    },
    {
        number: 16,
        name: 'Kapatid',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kapatid_hd/default/index.mpd',
    },
    {
        number: 17,
        name: 'Global Trekker',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/globaltrekker/default/index.mpd',
    },
    {
        number: 18,
        name: 'CGTN',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgtn/default/index.mpd',
    },
    {
        number: 19,
        name: 'NBA TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cgnl_nba/default/index.mpd',
    },
    {
        number: 20,
        name: 'Vibe TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/tv5_hd/default1/index.mpd',
    },
    {
        number: 21,
        name: 'Cartoon Network HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cartoonnetworkhd/default/index.mpd',
    },
    {
        number: 22,
        name: 'CNN HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_cnnhd/default/index.mpd',
    },
    {
        number: 23,
        name: 'A2Z',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_a2z/default/index.mpd',
    },
    {
        number: 24,
        name: 'DreamWorks HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_dreamworks_hd1/default/index.mpd',
    },
    {
        number: 25,
        name: 'Animal Planet',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_animal_planet_sd/default/index.mpd',
    },
    {
        number: 26,
        name: 'SPOTV HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_spotvhd/default/index.mpd',
    },
    {
        number: 27,
        name: 'PTV 4',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_ptv4_sd/default/index.mpd',
    },
    {
        number: 28,
        name: 'Premier Sports HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_ps_hd1/default/index.mpd',
    },
    {
        number: 29,
        name: 'Rock Extreme',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockextreme/default/index.mpd',
    },
    {
        number: 30,
        name: 'Tap Sports',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tapsports/default/index.mpd',
    },
    {
        number: 31,
        name: 'BBC Earth HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_bbcearth_hd1/default/index.mpd',
    },
    {
        number: 32,
        name: 'One Sports Plus HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_onesportsplus_hd1/default/index.mpd',
    },
    {
        number: 33,
        name: 'SPOTV 2 HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_spotv2hd/default/index.mpd',
    },
    {
        number: 34,
        name: 'Rock Entertainment',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_rockentertainment/default/index.mpd',
    },
    {
        number: 35,
        name: 'Discovery Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/discovery/default/index.mpd',
    },
    {
        number: 36,
        name: 'CCTV 4',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_cctv4/default/index.mpd',
    },
    {
        number: 37,
        name: 'PBA Rush HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_pbarush_hd1/default/index.mpd',
    },
    {
        number: 38,
        name: 'Arirang',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/arirang_sd/default/index.mpd',
    },
    {
        number: 39,
        name: 'KBS World',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kbsworld/default/index.mpd',
    },
    {
        number: 40,
        name: 'One News HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/onenews_hd1/default/index.mpd',
    },
    {
        number: 41,
        name: 'KIX HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/kix_hd1/default/index.mpd',
    },
    {
        number: 42,
        name: 'Lifetime',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_lifetime/default/index.mpd',
    },
    {
        number: 43,
        name: 'BBC World News',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bbcworld_news_sd/default/index.mpd',
    },
    {
        number: 44,
        name: 'HGTV HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hgtv_hd1/default/index.mpd',
    },
    {
        number: 45,
        name: 'UAAP Varsity Channel',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_uaap_cplay_sd/default/index.mpd',
    },
    {
        number: 46,
        name: 'Travel Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/travel_channel_sd/default/index.mpd',
    },
    {
        number: 47,
        name: 'Premier Sports 2 HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/premiersports2hd/default/index.mpd',
    },
    {
        number: 48,
        name: 'Hits HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hits_hd1/default/index.mpd',
    },
    {
        number: 49,
        name: 'Al Jazeera',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_aljazeera/default/index.mpd',
    },
    {
        number: 50,
        name: 'One PH',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/oneph_sd/default/index.mpd',
    },
    {
        number: 51,
        name: 'Food Network HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_foodnetwork_hd1/default/index.mpd',
    },
    {
        number: 52,
        name: 'DepEd TV',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/depedch_sd/default/index.mpd',
    },
    {
        number: 53,
        name: 'History HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_historyhd/default/index.mpd',
    },
    {
        number: 54,
        name: 'Fashion TV HD',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/fashiontvhd/default/index.mpd',
    },
    {
        number: 55,
        name: 'Cinema One Pinoy',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/celmovie_pinoy_sd/default/index.mpd',
    },
    {
        number: 56,
        name: 'Bloomberg',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/bloomberg_sd/default/index.mpd',
    },
    {
        number: 57,
        name: 'NHK Japan',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nhk_japan/default/index.mpd',
    },
    {
        number: 58,
        name: 'Asian Food Network',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/asianfoodnetwork_sd/default/index.mpd',
    },
    {
        number: 59,
        name: 'One Sports HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_onesports_hd/default/index.mpd',
    },
    {
        number: 60,
        name: 'Nick Jr',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickjr/default/index.mpd',
    },
    {
        number: 61,
        name: 'Warner TV HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_warnerhd/default1/index.mpd',
    },
    {
        number: 62,
        name: 'Animax',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_animax_sd_new/default/index.mpd',
    },
    {
        number: 63,
        name: 'IBC 13',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/ibc13_sd_new/default/index.mpd',
    },
    {
        number: 64,
        name: 'AXN',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_axn_sd/default/index.mpd',
    },
    {
        number: 65,
        name: 'TAP Movies HD',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_tapmovies_hd1/default/index.mpd',
    },
    {
        number: 66,
        name: 'Moonbug Kids',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_moonbug_kids_sd/default/index.mpd',
    },
    {
        number: 67,
        name: 'France 24',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/france24/default/index.mpd',
    },
    {
        number: 68,
        name: 'ABC Australia',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/abc_aus/default/index.mpd',
    },
    {
        number: 69,
        name: 'Hits Movies',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/hitsmovies/default/index.mpd',
    },
    {
        number: 70,
        name: 'Channel NewsAsia',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/channelnewsasia/default/index.mpd',
    },
    {
        number: 71,
        name: 'Thrill',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_thrill_sd/default/index.mpd',
    },
    {
        number: 72,
        name: 'Crime & Investigation',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/crime_invest/default/index.mpd',
    },
    {
        number: 73,
        name: 'Buko',
        category: 'Cignal',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/cg_buko_sd/default/index.mpd',
    },
    {
        number: 74,
        name: 'Knowledge Channel',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/knowledge_channel/default/index.mpd',
    },
    {
        number: 75,
        name: 'TV5 Monde',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_tv5_monde/default/index.mpd',
    },
    {
        number: 76,
        name: 'Nickelodeon',
        category: 'MediaQuest',
        type: 'mpd',
        url: 'https://ucdn.mediaquest.com.ph/bpk-tv/dr_nickelodeon/default/index.mpd',
    },
    {
        number: 77,
        name: 'Channel 77',
        category: 'Other',
        type: 'hls',
        url: '/proxy?url=' + encodeURIComponent('http://204.52.191.254/play/live.php?mac=00:1A:79:7b:ab:a5&stream=1548700&extension=m3u8'),
    },
    {
        number: 78,
        name: 'Channel 78',
        category: 'Other',
        type: 'hls',
        url: '/proxy?url=' + encodeURIComponent('http://204.52.191.254/play/live.php?mac=00:1A:79:7b:ab:a5&stream=440523&extension=m3u8'),
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
