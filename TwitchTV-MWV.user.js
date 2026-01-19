// ==UserScript==
// @name            TwitchTV-MWV v2.0
// @namespace       http://kuchi.be/
// @version         2.0
// @description     Smooth linear volume control with overlay - Crisp icons, refined design, 5% steps with mouse wheel
// @author          Kuchi - Soft's
// @defaulticon     https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV-icon.png
// @icon            https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV-icon.png
// @updateURL       https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV.user.js
// @downloadURL     https://github.com/KuchiSofts/TwitchTV-MWV/raw/master/TwitchTV-MWV.user.js
// @match           *://*.twitch.tv/*
// @match           *://player.twitch.tv/*
// @run-at          document-start
// @grant           GM_addStyle
// @grant           GM_getValue
// @grant           GM_setValue
// @noframes        false
// ==/UserScript==


(function() {
    'use strict';

    // ============================================
    // 🎮 CONFIGURATION
    // ============================================
    const CONFIG = {
        // ============================================
        // 🎚️ VOLUME STEP SETTINGS (USER CONFIGURABLE)
        // ============================================
        defaultWheelStep: 0.05,     // 5% - Default mouse wheel step (CHANGE THIS!)
        fineVolumeStep: 0.01,       // 1% - Fine control (hold no keys)
        fastVolumeStep: 0.05,       // 5% - Fast control (hold Shift or Arrow keys)
        boostVolumeStep: 0.10,      // 10% - Boost control (hold Ctrl/Cmd)

        // ============================================
        // 🎮 BEHAVIOR SETTINGS
        // ============================================
        autoMuteAtZero: true,       // Auto-mute when volume reaches 0%
        autoUnmuteOnVolumeUp: true, // Auto-unmute when increasing volume from 0%
        ignoreHorizontalScroll: true,
        overlayTimeout: 1500,
        showDirectionIndicator: true,
        showModeIndicator: true,
        doubleClickToMute: true,
        middleClickReset: true,

        // ============================================
        // 💾 STORAGE SETTINGS
        // ============================================
        defaultVolume: 0.5,
        storageKey: 'TwitchMWV_Volume',
        channelVolumeKey: 'TwitchMWV_ChannelVolumes',
        rememberPerChannel: true,    // Remember volume per channel
        autoSaveInterval: 1500,      // Save after 1.5s of no activity

        // ============================================
        // ⚡ PERFORMANCE SETTINGS
        // ============================================
        wheelThrottleMs: 50,         // Throttle wheel events

        // ============================================
        // ⌨️ KEYBOARD SHORTCUTS
        // ============================================
        shortcuts: {
            mute: 'm',    // M = toggle mute (needs player focus)
            reset: 'r'    // R = reset to 50% (needs player focus)
            // Arrow Up/Down = ±5% volume (GLOBAL, always works)
        },

        debug: true
    };

    // ============================================
    // 🎨 STYLES (Ultra-Premium Design)
    // ============================================
    const STYLES = `
        #twitch-mwv-overlay {
            position: absolute !important;
            top: 40px !important;
            left: 50% !important;
            transform: translate(-50%, 0) scale(0.92) !important;
            z-index: 99999 !important;
            pointer-events: none !important;
            opacity: 0;
            transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: opacity, transform;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.25));
        }
        #twitch-mwv-overlay.visible {
            opacity: 1 !important;
            transform: translate(-50%, 0) scale(1) !important;
        }
        .mwv-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 14px;
            padding: 14px 22px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.88) 0%, rgba(10, 10, 15, 0.85) 100%);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow:
                0 0 0 1px rgba(255, 255, 255, 0.03) inset,
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 2px 8px rgba(0, 0, 0, 0.3);
            user-select: none;
            min-width: 130px;
            position: relative;
            /* Scale applied via JS based on player size */
        }
        .mwv-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 20px;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%);
            pointer-events: none;
        }
        .mwv-icon-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
        }
        .mwv-icon-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            backdrop-filter: blur(10px);
            flex-shrink: 0;
        }
        .mwv-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .mwv-icon {
            width: 22px;
            height: 22px;
            fill: #ffffff;
            flex-shrink: 0;
            filter: none;
            shape-rendering: geometricPrecision;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        .mwv-percentage {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.92) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            font-variant-numeric: tabular-nums;
            letter-spacing: -0.8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            min-width: 60px;
            text-align: left;
            position: relative;
        }
        .mwv-percentage::after {
            content: attr(data-text);
            position: absolute;
            left: 0;
            top: 0;
            z-index: -1;
            background: linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.92) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            filter: blur(8px);
            opacity: 0.6;
        }
        .mwv-percentage.muted {
            background: linear-gradient(180deg, #ff6b6b 0%, #ff4757 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .mwv-mode {
            font-size: 9px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 2px;
        }
        .mwv-mode.fine { color: rgba(74, 222, 128, 0.7); }
        .mwv-mode.fast { color: rgba(250, 204, 21, 0.7); }
        .mwv-mode.boost { color: rgba(248, 113, 113, 0.7); }
        .mwv-bar-container {
            width: 90px;
            height: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2) inset;
            position: relative;
        }
        .mwv-bar-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
            border-radius: 3px 3px 0 0;
        }
        .mwv-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.95) 100%);
            border-radius: 3px;
            transition: width 0.12s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: width;
            box-shadow:
                0 0 12px rgba(255, 255, 255, 0.4),
                0 0 4px rgba(255, 255, 255, 0.6),
                0 1px 2px rgba(255, 255, 255, 0.3) inset;
            position: relative;
        }
        .mwv-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
            border-radius: 3px 3px 0 0;
        }
        .mwv-bar-fill.muted {
            background: linear-gradient(90deg, #ff6b6b 0%, #ff4757 100%);
            box-shadow:
                0 0 12px rgba(255, 71, 87, 0.5),
                0 0 4px rgba(255, 71, 87, 0.7),
                0 1px 2px rgba(255, 107, 107, 0.3) inset;
        }
        .mwv-toast {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.92) 0%, rgba(10, 10, 15, 0.9) 100%);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            color: white;
            padding: 12px 24px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            font-weight: 600;
            opacity: 0;
            transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 999999;
            pointer-events: none;
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.4),
                0 2px 8px rgba(0, 0, 0, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }
        .mwv-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `;

    // ============================================
    // 🔊 SVG ICONS
    // ============================================
    const ICONS = {
        muted: `<svg class="mwv-icon" viewBox="0 0 24 24"><path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/></svg>`,
        low: `<svg class="mwv-icon" viewBox="0 0 24 24"><path d="M7 9v6h4l5 5V4l-5 5H7z"/></svg>`,
        medium: `<svg class="mwv-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`,
        high: `<svg class="mwv-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
    };

    // ============================================
    // 📦 STATE (Optimized)
    // ============================================
    const state = {
        volume: CONFIG.defaultVolume,
        volumeBeforeMute: CONFIG.defaultVolume,
        isMuted: false,
        currentMode: 'fine',
        overlay: null,
        hideTimeout: null,
        initialized: false,
        currentChannel: null,
        lastClickTime: 0,
        toast: null,
        unmuteAttempts: 0,
        maxUnmuteAttempts: 5,
        isUnmuting: false,
        lastWheelTime: 0,
        pendingRAF: null,
        cachedVideo: null,
        cachedMuteBtn: null,
        cachedContainer: null,
        lastCacheTime: 0,
        cacheLifetime: 5000,
        hasUserGesture: false,
        userGestureTimeout: null
    };

    // ============================================
    // 🛠 UTILITIES
    // ============================================
    const log = (...args) => CONFIG.debug && console.log('[TwitchMWV]', ...args);
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // Throttle function for wheel events
    const throttle = (func, delay) => {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    };

    const getCurrentChannel = () => {
        const match = window.location.pathname.match(/^\/([^\/]+)/);
        if (match) {
            const channel = match[1].toLowerCase();
            const excluded = ['directory', 'videos', 'settings', 'subscriptions', 'inventory', 'wallet', 'drops'];
            return excluded.includes(channel) ? null : channel;
        }
        return null;
    };

    // ============================================
    // 💾 STORAGE (Optimized)
    // ============================================
    const storage = {
        get(key, defaultValue = null) {
            try {
                const val = localStorage.getItem(key);
                return val !== null ? JSON.parse(val) : defaultValue;
            } catch {
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                log('Storage error:', e);
            }
        },

        getChannelData(channel) {
            const allData = this.get(CONFIG.channelVolumeKey, {});
            const data = allData[channel];
            if (data) {
                return {
                    volume: typeof data.volume === 'number' ? data.volume : CONFIG.defaultVolume,
                    isMuted: data.isMuted === true,
                    volumeBeforeMute: typeof data.volumeBeforeMute === 'number' ? data.volumeBeforeMute : CONFIG.defaultVolume
                };
            }
            return {
                volume: CONFIG.defaultVolume,
                isMuted: false,
                volumeBeforeMute: CONFIG.defaultVolume
            };
        },

        setChannelData(channel, data) {
            const allData = this.get(CONFIG.channelVolumeKey, {});
            allData[channel] = {
                volume: typeof data.volume === 'number' ? data.volume : CONFIG.defaultVolume,
                isMuted: data.isMuted === true,
                volumeBeforeMute: typeof data.volumeBeforeMute === 'number' ? data.volumeBeforeMute : data.volume
            };
            this.set(CONFIG.channelVolumeKey, allData);
        },

        save() {
            const channel = getCurrentChannel();
            const data = {
                volume: state.volume,
                isMuted: state.isMuted === true,
                volumeBeforeMute: state.volumeBeforeMute
            };

            if (CONFIG.rememberPerChannel && channel) {
                this.setChannelData(channel, data);
            } else {
                this.set(CONFIG.storageKey, data);
            }

            log('Saved:', data);
        },

        load() {
            const channel = getCurrentChannel();
            let data;

            if (CONFIG.rememberPerChannel && channel) {
                data = this.getChannelData(channel);
            } else {
                data = this.get(CONFIG.storageKey, {
                    volume: CONFIG.defaultVolume,
                    isMuted: false,
                    volumeBeforeMute: CONFIG.defaultVolume
                });
            }

            state.volume = typeof data.volume === 'number' ? data.volume : CONFIG.defaultVolume;
            state.isMuted = data.isMuted === true;
            state.volumeBeforeMute = typeof data.volumeBeforeMute === 'number' ? data.volumeBeforeMute : state.volume;

            if (state.volumeBeforeMute <= 0) {
                state.volumeBeforeMute = CONFIG.defaultVolume;
            }

            log('Loaded:', { volume: state.volume, isMuted: state.isMuted, volumeBeforeMute: state.volumeBeforeMute });
        }
    };

    // ============================================
    // 🎬 PLAYER (Cached & Optimized)
    // ============================================
    const player = {
        invalidateCache() {
            state.cachedVideo = null;
            state.cachedMuteBtn = null;
            state.cachedContainer = null;
            state.lastCacheTime = 0;
        },

        getVideo() {
            const now = Date.now();
            if (state.cachedVideo && (now - state.lastCacheTime < state.cacheLifetime)) {
                if (document.contains(state.cachedVideo)) {
                    return state.cachedVideo;
                }
            }

            // Try multiple selectors for video
            state.cachedVideo = document.querySelector('video') ||
                               document.querySelector('.video-player video') ||
                               document.querySelector('[data-a-target="video-player"] video');

            state.lastCacheTime = now;
            return state.cachedVideo;
        },

        getContainer() {
            const now = Date.now();

            // Check if we're in fullscreen mode
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement);

            // In fullscreen, use the fullscreen element itself
            if (isFullscreen) {
                const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement;
                log('Using fullscreen element as container');
                state.cachedContainer = fullscreenEl;
                return fullscreenEl;
            }

            // Check cache (only in non-fullscreen mode)
            if (state.cachedContainer && (now - state.lastCacheTime < state.cacheLifetime)) {
                if (document.contains(state.cachedContainer)) {
                    return state.cachedContainer;
                }
            }

            // Try common player container selectors
            const selectors = [
                '[data-a-target="video-player"]',
                '.video-player__container',
                '.persistent-player',
                'div[class*="video-player"]',
                '.player-overlay-background'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el) {
                    log(`Found container: ${sel}`);
                    state.cachedContainer = el;
                    state.lastCacheTime = now;
                    return el;
                }
            }

            // Fallback: find video and walk up to find player container
            const video = this.getVideo();
            if (video) {
                let current = video.parentElement;
                while (current && current !== document.body) {
                    const className = current.className;
                    if (typeof className === 'string' &&
                        (className.includes('player') || className.includes('video'))) {
                        log('Found container by walking up from video');
                        state.cachedContainer = current;
                        state.lastCacheTime = now;
                        return current;
                    }
                    current = current.parentElement;
                }
                // If nothing found, use video parent
                state.cachedContainer = video.parentElement;
                return video.parentElement;
            }

            return null;
        },

        isPlayerElement(element) {
            if (!element) return false;

            // Check if we're in fullscreen mode
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement);

            if (isFullscreen) {
                // In fullscreen, everything except chat is the player
                const nonPlayerSelectors = ['.chat-shell', '.stream-chat', '.right-column', '.chat-input', '.chat-list'];
                for (const sel of nonPlayerSelectors) {
                    if (element.closest(sel)) return false;
                }
                log('Fullscreen mode detected - treating as player element');
                return true;
            }

            // Normal mode - check if element is chat/excluded
            const nonPlayerSelectors = ['.chat-shell', '.stream-chat', '.right-column', '.chat-input'];
            for (const sel of nonPlayerSelectors) {
                if (element.closest(sel)) return false;
            }

            // Check element class names (like old code did)
            let current = element;
            while (current && current !== document.body) {
                const className = current.className;
                if (typeof className === 'string') {
                    // Check for player-related classes
                    if (className.includes('player') ||
                        className.includes('video') ||
                        className.includes('overlay') ||
                        className.includes('tw-absolute') ||
                        className.includes('extension-') ||
                        className.includes('pl-')) {
                        return true;
                    }
                }
                current = current.parentElement;
            }

            // Fallback to container check
            const container = this.getContainer();
            return container?.contains(element) || false;
        },

        getMuteButton() {
            const now = Date.now();
            if (state.cachedMuteBtn && (now - state.lastCacheTime < state.cacheLifetime)) {
                if (document.contains(state.cachedMuteBtn)) {
                    return state.cachedMuteBtn;
                }
            }
            state.cachedMuteBtn = document.querySelector('[data-a-target="player-mute-unmute-button"]');
            return state.cachedMuteBtn;
        },

        isTwitchMuted() {
            const video = this.getVideo();
            if (video && video.muted) return true;
            const muteBtn = this.getMuteButton();
            if (muteBtn) {
                const label = muteBtn.getAttribute('aria-label')?.toLowerCase() || '';
                return label.includes('unmute');
            }
            return false;
        },

        syncUI(volume, isMuted) {
            const slider = document.querySelector('[data-a-target="player-volume-slider"]');
            const fill = document.querySelector('[data-test-selector="tw-range__fill-value-selector"]');
            const displayVolume = isMuted ? 0 : volume;

            if (fill) fill.style.width = `${displayVolume * 100}%`;
            if (slider) {
                slider.value = displayVolume;
            }
        }
    };

    // ============================================
    // 🎨 OVERLAY UI (Optimized with RAF)
    // ============================================
    const overlay = {
        create() {
            const el = document.createElement('div');
            el.id = 'twitch-mwv-overlay';
            el.innerHTML = `
                <div class="mwv-container">
                    <div class="mwv-icon-inner">
                        <span class="mwv-icon-wrapper">${ICONS.high}</span>
                    </div>
                    <div class="mwv-percentage" data-text="50%">50%</div>
                    <div class="mwv-bar-container">
                        <div class="mwv-bar-fill" style="width: 50%"></div>
                    </div>
                </div>
            `;
            return el;
        },

        getIcon(volume, isMuted) {
            if (isMuted || volume === 0) return ICONS.muted;
            if (volume < 0.33) return ICONS.low;
            if (volume < 0.66) return ICONS.medium;
            return ICONS.high;
        },

        getModeText(mode) {
            switch (mode) {
                case 'boost': return `Boost (${Math.round(CONFIG.boostVolumeStep * 100)}%)`;
                case 'fast': return `Fast (${Math.round(CONFIG.fastVolumeStep * 100)}%)`;
                case 'fine': return `Fine (${Math.round(CONFIG.fineVolumeStep * 100)}%)`;
                case 'default': return `Default (${Math.round(CONFIG.defaultWheelStep * 100)}%)`;
                default: return `Default (${Math.round(CONFIG.defaultWheelStep * 100)}%)`;
            }
        },

        ensureExists() {
            if (state.overlay && document.contains(state.overlay)) return state.overlay;

            // Get the player container
            const container = player.getContainer();
            if (!container) {
                log('No player container found');
                return null;
            }

            const existing = document.getElementById('twitch-mwv-overlay');
            if (existing) existing.remove();

            state.overlay = this.create();

            // Ensure container has positioning context
            const computedStyle = window.getComputedStyle(container);
            if (computedStyle.position === 'static') {
                container.style.position = 'relative';
                log('Set container to position: relative');
            }

            // Append to player container for absolute positioning
            container.appendChild(state.overlay);
            log('Overlay appended to player container');
            return state.overlay;
        },

        show(volume, isMuted, direction = null, mode = 'fine') {
            // Cancel any pending RAF
            if (state.pendingRAF) {
                cancelAnimationFrame(state.pendingRAF);
            }

            // Use RAF for smooth updates
            state.pendingRAF = requestAnimationFrame(() => {
                const el = this.ensureExists();
                if (!el) return;

                // Scale overlay to 10% of player height AND width
                const container = player.getContainer();
                if (container) {
                    const rect = container.getBoundingClientRect();
                    const playerWidth = rect.width;
                    const playerHeight = rect.height;

                    // Target: 10% of player dimensions
                    const targetWidth = playerWidth * 0.10;
                    const targetHeight = playerHeight * 0.10;

                    // Base overlay dimensions (approximate size of .mwv-container)
                    const baseWidth = 140;   // Base width in pixels
                    const baseHeight = 100;  // Base height in pixels

                    // Calculate scale factors for both dimensions
                    const scaleX = targetWidth / baseWidth;
                    const scaleY = targetHeight / baseHeight;

                    // Use the smaller scale to ensure overlay fits
                    let scaleFactor = Math.min(scaleX, scaleY);

                    // Clamp to reasonable limits
                    const minScale = 0.5;  // Don't go too small
                    const maxScale = 4.0;  // Don't go too large
                    scaleFactor = Math.max(minScale, Math.min(maxScale, scaleFactor));

                    // Apply scale transform
                    const mwvContainer = el.querySelector('.mwv-container');
                    if (mwvContainer) {
                        mwvContainer.style.transform = `scale(${scaleFactor})`;
                        mwvContainer.style.transformOrigin = 'center center';
                    }

                    log(`Player: ${Math.round(playerWidth)}x${Math.round(playerHeight)}, Target: 10%x10%, Scale: ${scaleFactor.toFixed(2)}x`);
                }

                const displayVolume = isMuted ? 0 : volume;
                const percentText = `${Math.round(displayVolume * 100)}%`;

                // Update icon
                const iconWrapper = el.querySelector('.mwv-icon-wrapper');
                if (iconWrapper) {
                    const newIcon = this.getIcon(volume, isMuted);
                    if (iconWrapper.innerHTML !== newIcon) {
                        iconWrapper.innerHTML = newIcon;
                    }
                }

                // Update percentage with glow effect
                const percentage = el.querySelector('.mwv-percentage');
                if (percentage) {
                    percentage.textContent = percentText;
                    percentage.setAttribute('data-text', percentText);
                    percentage.classList.toggle('muted', isMuted || displayVolume === 0);
                }

                // Update progress bar
                const barFill = el.querySelector('.mwv-bar-fill');
                if (barFill) {
                    barFill.style.width = `${displayVolume * 100}%`;
                    barFill.classList.toggle('muted', isMuted || displayVolume === 0);
                }

                el.classList.add('visible');
                clearTimeout(state.hideTimeout);
                state.hideTimeout = setTimeout(() => this.hide(), CONFIG.overlayTimeout);

                state.pendingRAF = null;
            });
        },

        hide() {
            if (!state.overlay) return;
            state.overlay.classList.remove('visible');
        }
    };

    // ============================================
    // 📢 TOAST
    // ============================================
    const toast = {
        show(message) {
            if (!state.toast) {
                state.toast = document.createElement('div');
                state.toast.className = 'mwv-toast';
                document.body.appendChild(state.toast);
            }
            state.toast.textContent = message;
            state.toast.classList.add('show');
            setTimeout(() => state.toast.classList.remove('show'), 1500);
        }
    };

    // ============================================
    // 🎚 VOLUME CONTROL (Optimized)
    // ============================================
    const volumeControl = {
        _saveTimeout: null,

        getStep(event) {
            // Smart step detection based on modifier keys
            // Default: Use configured defaultWheelStep (5%)
            // Shift: Fast mode (5%)
            // Ctrl/Cmd: Boost mode (10%)
            // No modifier: Use defaultWheelStep
            let step = CONFIG.defaultWheelStep;
            let mode = 'default';

            if (event.ctrlKey || event.metaKey) {
                step = CONFIG.boostVolumeStep;
                mode = 'boost';
            } else if (event.shiftKey) {
                step = CONFIG.fastVolumeStep;
                mode = 'fast';
            }

            state.currentMode = mode;
            return step;
        },

        clickUnmute() {
            const muteBtn = player.getMuteButton();
            if (!muteBtn) return false;
            const label = muteBtn.getAttribute('aria-label')?.toLowerCase() || '';
            if (label.includes('unmute')) {
                muteBtn.click();
                return true;
            }
            return false;
        },

        clickMute() {
            const muteBtn = player.getMuteButton();
            if (!muteBtn) return false;
            const label = muteBtn.getAttribute('aria-label')?.toLowerCase() || '';
            if (label.includes('mute') && !label.includes('unmute')) {
                muteBtn.click();
                return true;
            }
            return false;
        },

        toggle() {
            const video = player.getVideo();
            const wasMuted = player.isTwitchMuted();

            if (wasMuted) {
                // Unmuting with M key: restore to volumeBeforeMute if available
                this.clickUnmute();
                state.isMuted = false;

                if (video && state.volumeBeforeMute > 0) {
                    video.volume = state.volumeBeforeMute;
                    state.volume = state.volumeBeforeMute;
                    log(`🔊 Manual unmute: restored to ${Math.round(state.volumeBeforeMute * 100)}%`);
                }

                toast.show('🔊 Unmuted');
            } else {
                // Muting with M key: save current volume to volumeBeforeMute
                if (video && video.volume > 0) {
                    state.volumeBeforeMute = video.volume;
                    state.volume = video.volume;
                    log(`🔇 Manual mute: saved ${Math.round(video.volume * 100)}% to restore later`);
                }

                this.clickMute();
                state.isMuted = true;
                toast.show('🔇 Muted');
            }

            setTimeout(() => {
                state.isMuted = player.isTwitchMuted();
                overlay.show(state.volume, state.isMuted);
                storage.save();
            }, 100);
        },

        adjust(delta) {
            const video = player.getVideo();
            if (!video) return false;

            const direction = delta > 0 ? 'up' : 'down';
            const isMuted = state.isUnmuting ? false : player.isTwitchMuted();
            const currentVol = video.volume;

            // ============================================
            // 🎬 YOUTUBE ENHANCER STYLE - LINEAR CONTROL
            // ============================================
            // Simple, predictable behavior:
            // - Scroll up = increase by step (from CURRENT volume)
            // - Scroll down = decrease by step (from CURRENT volume)
            // - At 0% + scroll up = go to step value (not restore)
            // - At 0% = auto-mute (optional)
            // - volumeBeforeMute NEVER used in this function

            // ============================================
            // 🔊 VOLUME UP - LINEAR INCREMENT
            // ============================================
            if (delta > 0) {
                // CRITICAL: Save current volume BEFORE unmuting
                const savedVol = video.volume;
                log(`Current volume BEFORE: ${Math.round(savedVol * 100)}%`);

                // Calculate target volume FIRST
                const newVol = clamp(savedVol + delta, 0, 1);

                // If muted, unmute SILENTLY
                if (isMuted && CONFIG.autoUnmuteOnVolumeUp) {
                    log('📢 Unmuting...');
                    video.muted = false;
                    state.isMuted = false;
                }

                // Set the new volume multiple times to fight Twitch's async changes
                video.volume = newVol;

                // Force again after a tiny delay to override Twitch
                setTimeout(() => {
                    if (video.volume !== newVol) {
                        log(`⚠️ Twitch changed volume to ${Math.round(video.volume * 100)}%, forcing back to ${Math.round(newVol * 100)}%`);
                        video.volume = newVol;
                    }
                }, 10);

                setTimeout(() => {
                    if (video.volume !== newVol) {
                        log(`⚠️ Twitch changed volume again, forcing back to ${Math.round(newVol * 100)}%`);
                        video.volume = newVol;
                    }
                }, 50);

                state.volume = newVol;
                state.isMuted = false;

                log(`📈 Volume: ${Math.round(savedVol * 100)}% → ${Math.round(newVol * 100)}%`);

                player.syncUI(newVol, false);
                overlay.show(newVol, false, direction, state.currentMode);

                // Sync state.isMuted with actual video state
                state.isMuted = video.muted;

                // Debounced save
                clearTimeout(this._saveTimeout);
                this._saveTimeout = setTimeout(() => {
                    // Re-check mute state before saving
                    state.isMuted = video.muted;
                    storage.save();
                }, CONFIG.autoSaveInterval);

                return true;
            }

            // ============================================
            // 🔉 VOLUME DOWN - LINEAR DECREMENT
            // ============================================
            if (delta < 0) {
                // CRITICAL: Always use video.volume as the starting point
                const actualCurrentVol = video.volume;
                const newVol = clamp(actualCurrentVol + delta, 0, 1);

                video.volume = newVol;
                state.volume = newVol;

                log(`📉 Volume DOWN: ${Math.round(actualCurrentVol * 100)}% → ${Math.round(newVol * 100)}% (${Math.round(delta * 100)}%)`);

                // Auto-mute at exactly 0% if enabled
                if (newVol === 0 && CONFIG.autoMuteAtZero) {
                    log('🔇 Silent mute at 0% (no button click)');
                    video.muted = true; // Direct property set
                    state.isMuted = true;
                    player.syncUI(0, true);
                    overlay.show(0, true, direction, state.currentMode);

                    // Save immediately at 0% with correct mute state
                    setTimeout(() => {
                        state.isMuted = video.muted;
                        storage.save();
                    }, 150);
                } else {
                    state.isMuted = false;
                    player.syncUI(newVol, false);
                    overlay.show(newVol, false, direction, state.currentMode);

                    // Debounced save
                    clearTimeout(this._saveTimeout);
                    this._saveTimeout = setTimeout(() => {
                        // Re-check mute state before saving
                        state.isMuted = video.muted;
                        storage.save();
                    }, CONFIG.autoSaveInterval);
                }

                return true;
            }

            return false;
        },

        reset() {
            if (player.isTwitchMuted()) {
                this.clickUnmute();
            }

            setTimeout(() => {
                const video = player.getVideo();
                if (video) video.volume = CONFIG.defaultVolume;
                state.volume = CONFIG.defaultVolume;
                state.volumeBeforeMute = CONFIG.defaultVolume;
                state.isMuted = false;

                player.syncUI(CONFIG.defaultVolume, false);
                overlay.show(CONFIG.defaultVolume, false);
                toast.show(`🔊 Reset to ${CONFIG.defaultVolume * 100}%`);

                storage.save();
            }, 100);
        },

        restore() {
            // Load saved state from storage
            storage.load();

            const video = player.getVideo();
            if (!video) return false;

            // CRITICAL: Use state.volume as the authoritative source
            // volumeBeforeMute is ONLY for manual mute toggle (M key)
            const targetVolume = state.volume >= 0 ? state.volume : CONFIG.defaultVolume;

            // Set video volume to the saved volume
            video.volume = targetVolume;
            state.volume = targetVolume;

            // Initialize volumeBeforeMute if not set (for M key toggle)
            if (state.volumeBeforeMute <= 0 || state.volumeBeforeMute > 1) {
                state.volumeBeforeMute = targetVolume > 0 ? targetVolume : CONFIG.defaultVolume;
            }

            log(`🔄 Loaded from storage: volume=${Math.round(state.volume * 100)}%, muted=${state.isMuted}`);

            // Restore mute state with delayed force-back (fight Twitch's async changes)
            if (state.isMuted) {
                // User left it muted, restore as muted
                video.muted = true;
                log(`✅ Restoring: ${Math.round(targetVolume * 100)}% (MUTED)`);

                // Force mute state multiple times to fight Twitch
                setTimeout(() => {
                    if (!video.muted) {
                        log('⚠️ Twitch unmuted, forcing back to muted');
                        video.muted = true;
                    }
                }, 10);

                setTimeout(() => {
                    if (!video.muted) {
                        log('⚠️ Twitch unmuted again, forcing back to muted');
                        video.muted = true;
                    }
                }, 100);

                player.syncUI(targetVolume, true);
            } else {
                // User left it unmuted, restore as unmuted
                video.muted = false;
                log(`✅ Restoring: ${Math.round(targetVolume * 100)}% (UNMUTED)`);

                // Force unmute state multiple times to fight Twitch
                setTimeout(() => {
                    if (video.muted) {
                        log('⚠️ Twitch muted, forcing back to unmuted');
                        video.muted = false;
                    }
                }, 10);

                setTimeout(() => {
                    if (video.muted) {
                        log('⚠️ Twitch muted again, forcing back to unmuted');
                        video.muted = false;
                    }
                }, 100);

                player.syncUI(targetVolume, false);
            }

            return true;
        }
    };

    // ============================================
    // 🎯 EVENT HANDLERS (Throttled & Optimized)
    // ============================================
    const handlers = {
        // Inner throttled handler (actual volume logic)
        _wheelThrottled: throttle(function(step, direction, video, muteBtn) {
            // ============================================
            // 🎬 YOUTUBE ENHANCER STYLE - SAME AS ARROWS
            // ============================================
            // Just call adjust() - it handles everything including unmute!
            volumeControl.adjust(step * direction);
        }, CONFIG.wheelThrottleMs),

        // Outer wheel handler (ALWAYS prevents default to block scrolling)
        wheel(event) {
            // Check if we're on the player
            const isPlayer = player.isPlayerElement(event.target);

            // Debug: log target info
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement);
            if (isFullscreen) {
                log(`Wheel event in fullscreen - target: ${event.target.className}`);
            }

            if (!isPlayer) return;
            if (CONFIG.ignoreHorizontalScroll && Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            // ALWAYS prevent page scrolling when on video player
            event.preventDefault();
            event.stopPropagation();

            // Get parameters for throttled handler
            const step = volumeControl.getStep(event);
            const direction = event.deltaY < 0 ? 1 : -1;
            const video = player.getVideo();
            const muteBtn = player.getMuteButton();

            // Call throttled handler
            handlers._wheelThrottled(step, direction, video, muteBtn);
        },

        keydown(event) {
            const key = event.key;

            // Handle arrow keys GLOBALLY (always block page scroll, always adjust volume)
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                // Check if user is typing in an input field
                const activeEl = document.activeElement;
                const isTyping = activeEl && (
                    activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.isContentEditable
                );

                // Don't intercept if user is typing
                if (isTyping) return;

                // ALWAYS prevent default to block page scrolling
                event.preventDefault();
                event.stopPropagation();

                // Arrow keys = 5% steps (fast mode)
                state.currentMode = 'fast';
                const step = CONFIG.fastVolumeStep;

                if (key === 'ArrowUp') {
                    log('Arrow Up - Volume +5%');
                    volumeControl.adjust(step);
                } else {
                    log('Arrow Down - Volume -5%');
                    volumeControl.adjust(-step);
                }

                return;
            }

            // For other shortcuts (M, R), check if we're on the player
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement);

            // In fullscreen, always allow keyboard controls
            // In normal mode, check if player is focused
            if (!isFullscreen) {
                const isPlayerFocused = player.isPlayerElement(document.activeElement) ||
                                       player.isPlayerElement(event.target);
                if (!isPlayerFocused) return;
            }

            const keyLower = key.toLowerCase();

            if (keyLower === CONFIG.shortcuts.mute) {
                event.preventDefault();
                log('M key - Toggle mute');
                volumeControl.toggle();
                return;
            }

            if (keyLower === CONFIG.shortcuts.reset) {
                event.preventDefault();
                log('R key - Reset to 50%');
                volumeControl.reset();
                return;
            }
        },

        click(event) {
            // Track ANY click as user gesture (for unmute permissions)
            state.hasUserGesture = true;
            clearTimeout(state.userGestureTimeout);
            state.userGestureTimeout = setTimeout(() => {
                state.hasUserGesture = false;
            }, 5000); // User gesture valid for 5 seconds

            if (!player.isPlayerElement(event.target)) return;

            state.unmuteAttempts = 0;
            log('User clicked video - unmute ready');

            if (CONFIG.doubleClickToMute) {
                const now = Date.now();
                if (now - state.lastClickTime < 300) {
                    volumeControl.toggle();
                    state.lastClickTime = 0;
                } else {
                    state.lastClickTime = now;
                }
            }
        },

        auxclick(event) {
            if (event.button !== 1) return;
            if (!player.isPlayerElement(event.target)) return;

            state.unmuteAttempts = 0;

            if (CONFIG.middleClickReset) {
                event.preventDefault();
                volumeControl.reset();
            }
        },

        urlChange() {
            const newChannel = getCurrentChannel();
            if (newChannel !== state.currentChannel) {
                if (state.currentChannel) storage.save();
                state.currentChannel = newChannel;
                state.unmuteAttempts = 0;
                player.invalidateCache();
                log(`Channel: ${newChannel}`);
                setTimeout(() => volumeControl.restore(), 500);
            }
        },

        beforeUnload() {
            storage.save();
        }
    };

    // ============================================
    // 🚀 INIT (Optimized)
    // ============================================
    const init = () => {
        if (state.initialized) return;

        log('Initializing TwitchMWV v5.0 (Optimized)...');

        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = STYLES;
        document.head.appendChild(styleEl);

        // Load saved state
        storage.load();
        state.currentChannel = getCurrentChannel();

        // Global click listener to track user gestures (for unmute permission)
        document.addEventListener('click', () => {
            state.hasUserGesture = true;
            clearTimeout(state.userGestureTimeout);
            state.userGestureTimeout = setTimeout(() => {
                state.hasUserGesture = false;
                log('User gesture token expired');
            }, 5000);
            log('User gesture detected (click anywhere)');
        }, { capture: true, passive: true });

        // Fullscreen change listener - invalidate cache when entering/exiting fullscreen
        const fullscreenHandler = () => {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                                    document.mozFullScreenElement || document.msFullscreenElement);
            log(`Fullscreen ${isFullscreen ? 'entered' : 'exited'} - invalidating cache`);
            player.invalidateCache();

            // Remove overlay so it gets recreated in the new container
            if (state.overlay) {
                state.overlay.remove();
                state.overlay = null;
                log('Overlay removed for repositioning');
            }
        };
        document.addEventListener('fullscreenchange', fullscreenHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenHandler);
        document.addEventListener('mozfullscreenchange', fullscreenHandler);
        document.addEventListener('msfullscreenchange', fullscreenHandler);

        // Event listeners
        window.addEventListener('wheel', handlers.wheel, { passive: false, capture: true });
        window.addEventListener('keydown', handlers.keydown, { capture: true });
        window.addEventListener('click', handlers.click, { capture: true });
        window.addEventListener('auxclick', handlers.auxclick, { capture: true });
        window.addEventListener('beforeunload', handlers.beforeUnload);

        // URL change observer (optimized)
        let lastUrl = location.href;
        const urlObserver = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                handlers.urlChange();
            }
        });
        urlObserver.observe(document.body, { childList: true, subtree: true });

        // Helper: Auto-click to establish user gesture
        const autoClickForGesture = () => {
            const video = player.getVideo();
            const container = player.getContainer();

            if (video || container) {
                // Try multiple approaches to establish user gesture
                const targets = [container, video, document.body].filter(Boolean);

                for (const target of targets) {
                    try {
                        // Dispatch a trusted-looking click event
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: 0,
                            clientY: 0
                        });
                        target.dispatchEvent(clickEvent);
                        log(`Auto-clicked on ${target.tagName || 'container'} to establish gesture`);
                    } catch (e) {
                        log('Auto-click failed:', e.message);
                    }
                }

                // Set gesture flag
                state.hasUserGesture = true;
                clearTimeout(state.userGestureTimeout);
                state.userGestureTimeout = setTimeout(() => {
                    state.hasUserGesture = false;
                }, 10000); // 10 seconds validity

                log('✅ User gesture established via auto-click');
            }
        };

        // Video element observer (optimized)
        const videoObserver = new MutationObserver(() => {
            const video = player.getVideo();
            if (video && !video.dataset.mwvInit) {
                video.dataset.mwvInit = 'true';

                // Restore volume on metadata load
                video.addEventListener('loadedmetadata', () => {
                    volumeControl.restore();
                    // Auto-click after video loads to establish gesture
                    setTimeout(() => autoClickForGesture(), 500);
                }, { once: true });

                // Also restore immediately if already loaded
                if (video.readyState >= 1) {
                    volumeControl.restore();
                    setTimeout(() => autoClickForGesture(), 500);
                }

                log('Video initialized');
            }
        });
        videoObserver.observe(document.body, { childList: true, subtree: true });

        // Initial restore
        setTimeout(() => {
            volumeControl.restore();
            // Try auto-click on initial load
            autoClickForGesture();
        }, 1000);

        // Also try auto-click after a longer delay (for slower connections)
        setTimeout(() => autoClickForGesture(), 2500);

        state.initialized = true;
        log('✓ Ready!');
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
