// Add click handler for video player to hide remote control
function addVideoPlayerClickHandler() {
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.addEventListener('click', (e) => {
            // Only hide if remote is visible and not clicking on remote itself
            if (remoteControl && !remoteControl.classList.contains('hidden') &&
                !e.target.closest('.remote-control') &&
                !e.target.closest('.remote-control-toggle')) {
                remoteControl.classList.add('hidden');
                // Update localStorage
                localStorage.setItem('remoteControlHidden', 'true');

                // Hide keyboard guide if open
                if (keyboardGuide && keyboardGuide.classList.contains('show')) {
                    keyboardGuide.classList.remove('show');
                    isKeyboardGuideVisible = false;
                }
            }
        });
    }
}

// Add startup functionality
document.addEventListener('DOMContentLoaded', () => {
    const startupOverlay = document.getElementById('startupOverlay');
    const startBtn = document.getElementById('startWatchingBtn');

    // Add startup mode to body
    document.body.classList.add('startup-mode');

    // Handle fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    startBtn.addEventListener('click', async () => {
        try {
            // Request fullscreen
            const container = document.documentElement;
            if (container.requestFullscreen) {
                await container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                await container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                await container.msRequestFullscreen();
            }

            // Attempt to lock landscape orientation
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
            }

            // Hide startup overlay
            startupOverlay.classList.add('hidden');
            document.body.classList.remove('startup-mode');
            hideFallbackMessage();

            // Hide remote control initially
            if (remoteControl) {
                remoteControl.classList.add('hidden');
            }

            // Collapse sidebar after startup
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            sidebar.classList.add('collapsed');
            const arrow = sidebarToggle.querySelector('.arrow-icon');
            if (arrow) arrow.textContent = '☰';

            // Initialize the app
            setTimeout(() => {
                startupOverlay.style.display = 'none';
                // Auto-play channel 1 after startup
                loadChannel(0); // Channel index starts at 0 (channel 1)
            }, 500);

        } catch (error) {
            console.log('Fullscreen/landscape not supported, continuing...');
            startupOverlay.classList.add('hidden');
            document.body.classList.remove('startup-mode');
            hideFallbackMessage();

            // Hide remote control initially
            if (remoteControl) {
                remoteControl.classList.add('hidden');
            }

            // Collapse sidebar after startup
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            sidebar.classList.add('collapsed');
            const arrow = sidebarToggle.querySelector('.arrow-icon');
            if (arrow) arrow.textContent = '☰';

            setTimeout(() => {
                startupOverlay.style.display = 'none';
                // Auto-play channel 1 after startup
                loadChannel(0); // Channel index starts at 0 (channel 1)
            }, 500);
        }
    });

    // Add video player click handler after DOM loads
    setTimeout(() => {
        addVideoPlayerClickHandler();
    }, 1000);
});

function handleFullscreenChange() {
    // Force a reflow to recalculate heights
    const listContainer = document.querySelector('.list-container');
    if (listContainer) {
        listContainer.style.height = 'auto';
        setTimeout(() => {
            const viewportHeight = window.innerHeight;
            // Removed theme toggle height (was 180px, now closer to 130px or less depending on gap)
            const controlsHeight = 130;
            listContainer.style.height = `calc(${viewportHeight}px - ${controlsHeight}px)`;
        }, 100);
    }
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString();
}

function populateCategoryDropdown() {
  const dropdown = document.getElementById('categoryFilter');
  const categories = [...new Set(channels.map(ch => ch.category))].sort();

  // Add "All" option first
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Channels';
  dropdown.appendChild(allOption);

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    dropdown.appendChild(option);
  });
}

// Add these variables for multi-digit channel input
let channelInputBuffer = '';
let channelInputTimeout = null;
const CHANNEL_INPUT_DELAY = 2000; // 2 seconds to complete input

// Add these variables after the existing global variables
let remoteControl = null;
let keyboardGuide = null;
let channelDisplay = null;
let currentChannelIndex = 0;
let isKeyboardGuideVisible = false;

// Add remote control toggle functionality
function createRemoteControlToggle() {
    const remoteToggle = document.createElement('button');
    remoteToggle.className = 'remote-control-toggle';
    // Add 'toggle-icon' class to the SVG for proper styling
    remoteToggle.innerHTML = '<svg class="toggle-icon" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" width="256px" height="256px" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:none;stroke:#ffffff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} </style> <path class="st0" d="M21,31H11c-1.1,0-2-0.9-2-2V3c0-1.1,0.9-2,2-2h10c1.1,0,2,0.9,2,2v26C23,30.1,22.1,31,21,31z"></path> <line class="st0" x1="16" y1="22" x2="16" y2="21"></line> <line class="st0" x1="16" y1="27" x2="16" y2="26"></line> <line class="st0" x1="14" y1="24" x2="13" y2="24"></line> <line class="st0" x1="19" y1="24" x2="18" y2="24"></line> <line class="st0" x1="14" y1="17" x2="13" y2="17"></line> <line class="st0" x1="19" y1="17" x2="18" y2="17"></line> <circle cx="13" cy="8" r="1"></circle> <circle cx="13" cy="5" r="1"></circle> <circle cx="16" cy="8" r="1"></circle> <circle cx="19" cy="8" r="1"></circle> <circle cx="13" cy="11" r="1"></circle> <circle cx="16" cy="11" r="1"></circle> <circle cx="19" cy="11" r="1"></circle> <circle cx="13" cy="14" r="1"></circle> <circle cx="16" cy="14" r="1"></circle> <circle cx="19" cy="14" r="1"></circle> </g></svg>';
    remoteToggle.title = 'Toggle Remote Control';
    document.body.appendChild(remoteToggle);

    remoteToggle.addEventListener('click', () => {
        remoteControl.classList.toggle('hidden');
        const isHidden = remoteControl.classList.contains('hidden');
        localStorage.setItem('remoteControlHidden', isHidden);
    });

    // Load saved state
    const savedState = localStorage.getItem('remoteControlHidden');
    if (savedState === 'true') {
        remoteControl.classList.add('hidden');
    }
}

// Update the remote control creation function to include toggle
const originalCreateRemoteControl = createRemoteControl;
createRemoteControl = function() {
    originalCreateRemoteControl.call(this);
    createRemoteControlToggle();
};

function createRemoteControl() {
    // Create remote control container
    remoteControl = document.createElement('div');
    remoteControl.className = 'remote-control';

    // Update the remote control layout to use grid positioning
    remoteControl.innerHTML = `
        <div class="remote-buttons">
            <button class="remote-btn" data-action="up" title="Previous Channel">▲</button>
            <button class="remote-btn" data-action="left" title="Toggle Sidebar">◀</button>
            <button class="remote-btn" data-action="right" title="Show Guide">▶</button>
            <button class="remote-btn" data-action="down" title="Next Channel">▼</button>
        </div>
        <div class="number-pad">
            <button class="num-btn" data-num="1">1</button>
            <button class="num-btn" data-num="2">2</button>
            <button class="num-btn" data-num="3">3</button>
            <button class="num-btn" data-num="4">4</button>
            <button class="num-btn" data-num="5">5</button>
            <button class="num-btn" data-num="6">6</button>
            <button class="num-btn" data-num="7">7</button>
            <button class="num-btn" data-num="8">8</button>
            <button class="num-btn" data-num="9">9</button>
            <button class="num-btn" data-num="0" style="grid-column: span 3;">0</button>
        </div>
    `;
    document.body.appendChild(remoteControl);

    // Create keyboard guide
    keyboardGuide = document.createElement('div');
    keyboardGuide.className = 'keyboard-guide';
    keyboardGuide.innerHTML = `
        <h3>Keyboard Controls</h3>
        <div class="key-item">
            <span>↑ / ↓</span>
            <span>Navigate channels</span>
        </div>
        <div class="key-item">
            <span>←</span>
            <span>Toggle channel list</span>
        </div>
        <div class="key-item">
            <span>→</span>
            <span>Show this guide</span>
        </div>
        <div class="key-item">
            <span>Enter / Space</span>
            <span>Play selected channel</span>
        </div>
        <div class="key-item">
            <span>0-9</span>
            <span>Jump to channel by number</span>
        </div>
        <button class="close-guide">Close</button>
    `;
    document.body.appendChild(keyboardGuide);

    // Create channel display overlay
    channelDisplay = document.createElement('div');
    channelDisplay.className = 'channel-display';
    document.body.appendChild(channelDisplay);

    // Add event listeners
    addRemoteControlEvents();
}

function addRemoteControlEvents() {
    // Remote button clicks
    remoteControl.querySelectorAll('.remote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            handleRemoteAction(action);
        });
    });

    // Number pad clicks
    remoteControl.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const num = parseInt(e.target.dataset.num);
            jumpToChannel(num);
        });
    });

    // Close guide button
    keyboardGuide.querySelector('.close-guide').addEventListener('click', () => {
        hideKeyboardGuide();
    });
}

function handleRemoteAction(action) {
    const sidebar = document.getElementById('sidebar');
    const channelItems = Array.from(document.querySelectorAll('#channelList li'));

    switch(action) {
        case 'up':
            const currentUpIndex = channelItems.findIndex(item => parseInt(item.getAttribute('data-original-index')) === activeIndex);
            if (currentUpIndex > 0) {
                const prevItem = channelItems[currentUpIndex - 1];
                const prevIndex = parseInt(prevItem.getAttribute('data-original-index'));
                loadChannel(prevIndex);
                showChannelInfo(prevIndex);
                scrollChannelToMiddle(prevIndex);
            }
            break;
        case 'down':
            const currentDownIndex = channelItems.findIndex(item => parseInt(item.getAttribute('data-original-index')) === activeIndex);
            if (currentDownIndex < channelItems.length - 1 && currentDownIndex !== -1) {
                const nextItem = channelItems[currentDownIndex + 1];
                const nextIndex = parseInt(nextItem.getAttribute('data-original-index'));
                loadChannel(nextIndex);
                showChannelInfo(nextIndex);
                scrollChannelToMiddle(nextIndex);
            }
            break;
        case 'left':
            sidebar.classList.toggle('collapsed');
            const arrow = document.querySelector('#sidebarToggle .arrow-icon');
            if (arrow) arrow.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
            break;
        case 'right':
            toggleKeyboardGuide();
            break;
    }
}

function updateChannelSelection() {
    const channelItems = document.querySelectorAll('#channelList li');
    channelItems.forEach((item, index) => {
        item.classList.toggle('active', index === currentChannelIndex);
    });

    // Scroll to selected channel
    channelItems[currentChannelIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function jumpToChannel(number) {
    const maxChannels = channels.length;

    // Clear previous timeout
    if (channelInputTimeout) {
        clearTimeout(channelInputTimeout);
    }

    // Add digit to buffer
    channelInputBuffer += number.toString();

    // Show only the number while typing
    showChannelInput(channelInputBuffer, true);

    // Set timeout to complete input
    channelInputTimeout = setTimeout(() => {
        const targetNumber = parseInt(channelInputBuffer);
        const targetIndex = Math.min(targetNumber - 1, maxChannels - 1);

        if (targetIndex >= 0 && targetNumber <= maxChannels) {
            currentChannelIndex = targetIndex;
            updateChannelSelection();

            // Check if this is the same channel as currently playing
            if (targetIndex === activeIndex) {
                // Auto-restart the same channel by forcing a reload
                activeIndex = -1; // Reset activeIndex to force reload
                loadChannel(targetIndex);
                showChannelInfo(targetIndex);
            } else {
                // Get visible channel items and find the one with matching original index
                const channelItems = document.querySelectorAll('#channelList li');
                channelItems.forEach(item => {
                    if (parseInt(item.getAttribute('data-original-index')) === targetIndex) {
                        item.click();
                        showChannelInfo(targetIndex);
                    }
                });
            }
        }

        // Clear buffer after processing
        channelInputBuffer = '';
        hideChannelInput();
    }, CHANNEL_INPUT_DELAY);
}

// Add function to show channel input feedback
function showChannelInput(input, showOnlyNumber = false) {
    const channelDisplay = document.querySelector('.channel-display');
    if (channelDisplay) {
        if (showOnlyNumber) {
            channelDisplay.innerHTML = `
                <div class="channel-info">
                    <div class="channel-number">${input}</div>
                </div>
            `;
        } else {
            channelDisplay.innerHTML = `
                <div class="channel-info">
                    <div class="channel-number">${input}</div>
                    <div class="channel-name">Channel ${input}</div>
                </div>
            `;
        }
        channelDisplay.classList.add('show');
    }
}

// Add function to hide channel input
function hideChannelInput() {
    const channelDisplay = document.querySelector('.channel-display');
    if (channelDisplay) {
        setTimeout(() => {
            channelDisplay.classList.remove('show');
        }, 1000);
    }
}

function showChannelInfo(index) {
    const channel = channels[index];
    if (channel) {
        channelDisplay.innerHTML = `
            <div class="channel-info">
                <div class="channel-number">${index + 1}</div>
                <div class="channel-name">${channel.name}</div>
            </div>
        `;
        channelDisplay.classList.add('show');

        setTimeout(() => {
            channelDisplay.classList.remove('show');
        }, 2000);
    }
}

function toggleKeyboardGuide() {
    isKeyboardGuideVisible = !isKeyboardGuideVisible;
    keyboardGuide.classList.toggle('show', isKeyboardGuideVisible);
}

function hideKeyboardGuide() {
    isKeyboardGuideVisible = false;
    keyboardGuide.classList.remove('show');
}

// Add function to scroll channel to middle of visible area
function scrollChannelToMiddle(index) {
    const list = document.getElementById('channelList');
    const listContainer = document.querySelector('.list-container');
    if (!list || !listContainer) return;

    const channelItem = list.querySelector(`li[data-original-index="${index}"]`);
    if (!channelItem) return;

    const containerHeight = listContainer.clientHeight;
    const itemHeight = channelItem.offsetHeight;
    const itemOffset = channelItem.offsetTop;
    const scrollTop = itemOffset - (containerHeight / 2) + (itemHeight / 2);

    listContainer.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
    });
}

// Keyboard event handler
function handleKeyboardEvents(e) {
    if (e.target.tagName === 'INPUT') return;

    const sidebar = document.getElementById('sidebar');
    const channelItems = Array.from(document.querySelectorAll('#channelList li'));

    // Handle number keys 0-9
    const num = parseInt(e.key);
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        jumpToChannel(parseInt(e.key));
        return;
    }

    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            const currentUpIndex = channelItems.findIndex(item => parseInt(item.getAttribute('data-original-index')) === activeIndex);
            if (currentUpIndex > 0) {
                const prevItem = channelItems[currentUpIndex - 1];
                const prevIndex = parseInt(prevItem.getAttribute('data-original-index'));
                loadChannel(prevIndex);
                showChannelInfo(prevIndex);
                scrollChannelToMiddle(prevIndex);
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            const currentDownIndex = channelItems.findIndex(item => parseInt(item.getAttribute('data-original-index')) === activeIndex);
            if (currentDownIndex < channelItems.length - 1 && currentDownIndex !== -1) {
                const nextItem = channelItems[currentDownIndex + 1];
                const nextIndex = parseInt(nextItem.getAttribute('data-original-index'));
                loadChannel(nextIndex);
                showChannelInfo(nextIndex);
                scrollChannelToMiddle(nextIndex);
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            sidebar.classList.toggle('collapsed');
            const arrow = document.querySelector('#sidebarToggle .arrow-icon');
            if (arrow) arrow.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
            break;
        case 'ArrowRight':
            e.preventDefault();
            toggleKeyboardGuide();
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            const activeItem = document.querySelector('#channelList li.active');
            if (activeItem) {
                // Already auto-played by up/down, just ensure sidebar closes
                if (!sidebar.classList.contains('collapsed')) {
                    sidebar.classList.add('collapsed');
                    const arrow = document.querySelector('#sidebarToggle .arrow-icon');
                    if (arrow) arrow.textContent = '☰';
                }
            } else {
                // Fallback - play first visible channel if none active
                const firstChannel = document.querySelector('#channelList li');
                if (firstChannel) {
                    firstChannel.click();
                    if (!sidebar.classList.contains('collapsed')) {
                        sidebar.classList.add('collapsed');
                        const arrow = document.querySelector('#sidebarToggle .arrow-icon');
                        if (arrow) arrow.textContent = '☰';
                    }
                }
            }
            break;
        case 'Escape':
            e.preventDefault();
            hideChannelInput();
            channelInputBuffer = '';
            if (channelInputTimeout) {
                clearTimeout(channelInputTimeout);
            }
            break;
    }
}

// Add keyboard event listener
document.addEventListener('keydown', handleKeyboardEvents);

// Update setupChannelList to maintain channel index
const originalSetupChannelList = setupChannelList;
setupChannelList = function() {
    originalSetupChannelList();
    const channelItems = document.querySelectorAll('#channelList li');
    if (channelItems.length > 0) {
        currentChannelIndex = Math.min(currentChannelIndex, channelItems.length - 1);
        updateChannelSelection();
    }
};

function setupChannelList() {
  const list = document.getElementById('channelList');
  const countDisplay = document.getElementById('channelCount');
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value;

  list.innerHTML = '';
  let totalCount = 0;
  let visibleIndex = 0;

  channels.forEach((channel, originalIndex) => {
    const matchesCategory = selectedCategory === 'all' || channel.category === selectedCategory;
    const matchesSearch = channel.name.toLowerCase().includes(searchValue);

    if (matchesCategory && matchesSearch) {
      totalCount++;

      // Use originalIndex + 1 for unique, persistent channel numbers
      const displayNumber = originalIndex + 1;

      const listItem = document.createElement('li');
      listItem.tabIndex = 0;
      listItem.onclick = () => loadChannel(originalIndex);
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

// Add reconnection state
let reconnectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 0; // 0 means infinite retries
const RECONNECT_DELAY = 3000;
const HEALTH_CHECK_INTERVAL = 10000;
let healthCheckInterval = null;
let reconnectTimeout = null;
let isReconnecting = false;

// Add channel health monitoring
function startHealthCheck() {
    if (healthCheckInterval) clearInterval(healthCheckInterval);

    healthCheckInterval = setInterval(async () => {
        if (activeIndex >= 0 && !isReconnecting) {
            // FIX: the previous HEAD/no-cors check fired false "reconnecting"
            // events on most streaming CDNs. Use the player's own state as the
            // source of truth instead — it knows when the stream actually stalls.
            try {
                const state = jwPlayerInstance && jwPlayerInstance.getState && jwPlayerInstance.getState();
                if (state === 'playing' || state === 'buffering' || state === 'paused' || state === 'idle') {
                    hideFallbackMessage();
                }
            } catch (_) {}
        }
    }, HEALTH_CHECK_INTERVAL);
}

function attemptReconnection() {
    isReconnecting = true;
    reconnectionAttempts++;

    // Show reconnection message (will show infinite attempt)
    showReconnectionMessage(reconnectionAttempts);

    // Clear previous timeout
    if (reconnectTimeout) clearTimeout(reconnectTimeout);

    // Attempt to reconnect
    reconnectTimeout = setTimeout(async () => {
        // Check if internet is back by testing a lightweight endpoint
        try {
            await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors'
            });

            // Internet is back - restart connection
            if (activeIndex >= 0) {
                loadChannel(activeIndex);
            }

            setTimeout(() => {
                if (jwPlayerInstance && jwPlayerInstance.getState() === 'playing') {
                    reconnectionAttempts = 0;
                    isReconnecting = false;
                    hideReconnectionMessage();
                }
            }, 2000);

        } catch (error) {
            // Internet still down - continue retrying indefinitely
            // No maximum retry limit, just continue
            attemptReconnection();
        }
    }, RECONNECT_DELAY);
}

function showReconnectionMessage(attempt) {
    const fallbackMsg = document.getElementById('fallbackMessage');
    fallbackMsg.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <div>📡</div>
            <div>Reconnecting... #${attempt}</div>
            <div style="font-size: 11px; opacity: 0.8;">Attempting to restore connection</div>
        </div>
    `;
    fallbackMsg.style.display = 'block';
}

function hideReconnectionMessage() {
    hideFallbackMessage();
}

function manualReconnect() {
    reconnectionAttempts = 0;
    isReconnecting = false;
    if (activeIndex >= 0) {
        loadChannel(activeIndex);
    }
}

// Update loading indicator creation with new styling
function createLoadingIndicator() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9998;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-container';
    loadingContainer.style.cssText = `
        position: relative;
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    `;

    const percentage = document.createElement('div');
    percentage.className = 'loading-percentage';
    percentage.style.cssText = `
        font-size: 20px;
        font-weight: bold;
        color: white;
        font-family: 'Century Gothic', sans-serif;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    `;
    percentage.textContent = '0%';

    loadingContainer.appendChild(percentage);
    loadingOverlay.appendChild(loadingContainer);
    document.body.appendChild(loadingOverlay);

    return { overlay: loadingOverlay, percentage };
}

let loadingIndicator = null;

// Initialize loading indicator
document.addEventListener('DOMContentLoaded', () => {
    loadingIndicator = createLoadingIndicator();
});

function showLoading() {
    if (loadingIndicator) {
        loadingIndicator.overlay.style.opacity = '1';
        loadingIndicator.overlay.style.pointerEvents = 'auto';
    }
}

function hideLoading() {
    if (loadingIndicator) {
        loadingIndicator.overlay.style.opacity = '0';
        loadingIndicator.overlay.style.pointerEvents = 'none';
    }
}

// Update loading progress update function
function updateLoadingProgress(percent) {
    if (loadingIndicator) {
        loadingIndicator.percentage.textContent = `${Math.round(percent)}%`;
    }
}

// Update loadChannel function to use loading indicator
// FIX: attach listeners AFTER originalLoadChannel runs, because the underlying
// loadChannel may call jwplayer().setup() again, which DESTROYS the previous
// instance — any listeners attached beforehand would be lost and the progress
// indicator would get stuck at 95% forever (black screen + frozen %).
const originalLoadChannel = loadChannel;
let __loadProgressInterval = null;
let __loadSafetyTimeout = null;
loadChannel = function(index) {
    // Cancel any in-flight previous load
    if (__loadProgressInterval) { clearInterval(__loadProgressInterval); __loadProgressInterval = null; }
    if (__loadSafetyTimeout) { clearTimeout(__loadSafetyTimeout); __loadSafetyTimeout = null; }

    showLoading();
    updateLoadingProgress(0);
    let progress = 0;

    __loadProgressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 95) {
            progress = 95;
            clearInterval(__loadProgressInterval);
            __loadProgressInterval = null;
        }
        updateLoadingProgress(progress);
    }, 100);

    // Trigger the actual channel load FIRST — this may rebuild the player
    originalLoadChannel(index);

    // Now (re)bind listeners on the CURRENT jwPlayerInstance
    if (jwPlayerInstance) {
        const cleanup = () => {
            if (__loadProgressInterval) { clearInterval(__loadProgressInterval); __loadProgressInterval = null; }
            if (__loadSafetyTimeout) { clearTimeout(__loadSafetyTimeout); __loadSafetyTimeout = null; }
            try {
                jwPlayerInstance.off('firstFrame', onPlay);
                jwPlayerInstance.off('play', onPlay);
                jwPlayerInstance.off('playAttemptFailed', onFail);
                jwPlayerInstance.off('error', onFail);
                jwPlayerInstance.off('setupError', onFail);
            } catch (_) {}
        };
        const onPlay = () => {
            cleanup();
            updateLoadingProgress(100);
            setTimeout(hideLoading, 200);
        };
        const onFail = () => {
            cleanup();
            hideLoading();
        };
        try {
            jwPlayerInstance.on('firstFrame', onPlay);
            jwPlayerInstance.on('play', onPlay);
            jwPlayerInstance.on('playAttemptFailed', onFail);
            jwPlayerInstance.on('error', onFail);
            jwPlayerInstance.on('setupError', onFail);
        } catch (_) {}

        // Safety net: if neither play nor error fires within 20s, drop the indicator
        // so the UI never gets stuck at 95% on a silently-failing stream.
        __loadSafetyTimeout = setTimeout(() => {
            cleanup();
            hideLoading();
        }, 20000);
    } else {
        // Player wasn't ready — drop indicator after a short delay
        __loadSafetyTimeout = setTimeout(() => {
            if (__loadProgressInterval) { clearInterval(__loadProgressInterval); __loadProgressInterval = null; }
            hideLoading();
        }, 5000);
    }
};

function initPlayer() {
    jwPlayerInstance = jwplayer('player').setup({
        width: '100%',
        height: '100%',
        autostart: false,
        stretching: 'exactfit',
        aspectratio: '16:9',
        primary: 'html5',
        hlshtml: true,
        displaytitle: false,
        logo: { hide: true },
    });

    jwPlayerInstance.on('error', (error) => {
        console.error('Player error:', error);
        if (!isReconnecting) {
            attemptReconnection();
        }
    });

    jwPlayerInstance.on('play', () => {
        reconnectionAttempts = 0;
        isReconnecting = false;
        hideReconnectionMessage();
        startHealthCheck();
    });

    jwPlayerInstance.on('pause', () => {
        // Don't check health when paused
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            healthCheckInterval = null;
        }
    });

    jwPlayerInstance.on('complete', () => {
        // Auto-play next channel or restart current
        if (activeIndex < channels.length - 1) {
            loadChannel(activeIndex + 1);
        } else {
            loadChannel(0);
        }
    });
}

// Update the loadChannel function to not auto-close sidebar
function loadChannel(index) {
    if (activeIndex === index && !isReconnecting) return;

    activeIndex = index;
    setupChannelList();
    showChannelInfo(index);

    // Reset reconnection state
    reconnectionAttempts = 0;
    isReconnecting = false;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (healthCheckInterval) clearInterval(healthCheckInterval);

    const channel = channels[index];
    // FIX: normalize type. JW Player expects 'dash' for MPEG-DASH, not 'mpd'.
    const normalizedType = channel.type === 'mpd' ? 'dash' : channel.type;
    const source = {
        file: channel.url,
        type: normalizedType,
    };
    if ((channel.type === 'mpd' || channel.type === 'dash') && channel.drm) {
        source.drm = channel.drm;
    }
    const item = { sources: [source] };
    if (channel.drm) item.drm = channel.drm; // also at item-level for older JW builds

    hideReconnectionMessage();

    // FIX: always rebuild the player via setup() per channel.
    // Why: switching between HLS and DRM-protected DASH on the same instance
    // frequently leaves the player in a bad state (black screen, no firstFrame
    // event), which is what was making the loading indicator stick at 95%.
    // A clean setup() per channel is the most reliable cross-stream path.
    try { jwPlayerInstance && jwPlayerInstance.remove(); } catch (_) {}
    jwPlayerInstance = jwplayer('player').setup({
        width: '100%',
        height: '100%',
        autostart: true,
        stretching: 'exactfit',
        aspectratio: '16:9',
        primary: 'html5',
        hlshtml: true,
        displaytitle: false,
        logo: { hide: true },
        playlist: [item],
    });

    // Re-attach the persistent handlers from initPlayer() since we rebuilt.
    jwPlayerInstance.on('error', (err) => {
        console.error('Player error:', err);
        if (!isReconnecting) attemptReconnection();
    });
    jwPlayerInstance.on('setupError', (err) => {
        console.error('Player setup error:', err);
        if (!isReconnecting) attemptReconnection();
    });
    jwPlayerInstance.on('play', () => {
        reconnectionAttempts = 0;
        isReconnecting = false;
        hideReconnectionMessage();
        startHealthCheck();
    });
    jwPlayerInstance.on('pause', () => {
        if (healthCheckInterval) { clearInterval(healthCheckInterval); healthCheckInterval = null; }
    });
    jwPlayerInstance.on('complete', () => {
        if (activeIndex < channels.length - 1) loadChannel(activeIndex + 1);
        else loadChannel(0);
    });

    // Start monitoring connection
    startHealthCheck();
}

function showFallbackMessage() {
    document.getElementById('fallbackMessage').style.display = 'block';
}

function hideFallbackMessage() {
    document.getElementById('fallbackMessage').style.display = 'none';
}

// Move the initialization code into the existing load event listener
window.addEventListener('load', () => {
    // Move sidebar toggle button after video container
    const container = document.querySelector('.container');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // Ensure toggle button is on top of sidebar when open
    container.appendChild(sidebarToggle);

    initPlayer();
    populateCategoryDropdown();
    setupChannelList();
    updateClock();
    setInterval(updateClock, 1000);

    // Update sidebar toggle functionality to work as floating overlay
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Update toggle button icon
        const arrow = sidebarToggle.querySelector('.arrow-icon');
        arrow.textContent = sidebar.classList.contains('collapsed') ? '☰' : '✕';
    });
}, { once: true }); // Ensure this runs after startup

// Disable right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Prevent developer tools shortcuts
function ctrlShiftKey(e, key) {
    return e.ctrlKey && e.shiftKey && e.keyCode === key.charCodeAt(0);
}

document.onkeydown = e => {
    if (
        e.keyCode === 123 || // F12
        ctrlShiftKey(e, 'I') || // Ctrl+Shift+I
        ctrlShiftKey(e, 'J') || // Ctrl+Shift+J
        ctrlShiftKey(e, 'C') || // Ctrl+Shift+C
        (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0)) // Ctrl+U
    ) {
        return false;
    }
};

// Stop health check when leaving
window.addEventListener('beforeunload', () => {
    if (healthCheckInterval) clearInterval(healthCheckInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    jwPlayerInstance?.remove();
});

// Handle visibility change (tab switching)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause monitoring when tab is hidden
        if (healthCheckInterval) {
            clearInterval(healthCheckInterval);
            healthCheckInterval = null;
        }
    } else {
        // Resume monitoring when tab is visible
        if (activeIndex >= 0 && !isReconnecting) {
            startHealthCheck();
        }
    }
});

// Initialize remote control after DOM loads
document.addEventListener('DOMContentLoaded', createRemoteControl);
