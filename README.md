# <img src="TwitchTV-MWV-icon.png" alt="" height="32" align="top"> TwitchTV-MWV

**Mouse-wheel volume for Twitch.** Scroll over the player to change the volume, and the script remembers it for each channel.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.1-9146FF.svg)](https://raw.githubusercontent.com/KuchiSofts/TwitchTV-MWV/master/TwitchTV-MWV.user.js)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-supported-00485B.svg)](https://www.tampermonkey.net/)
[![Violentmonkey](https://img.shields.io/badge/Violentmonkey-supported-1E88E5.svg)](https://violentmonkey.github.io/)

## Features

- **Wheel volume.** Scroll up or down over the player to change the volume in 5% steps (10% with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>).
- **On-screen display.** An overlay shows an icon, the percentage and a bar, scaled to the player size. It also works in fullscreen.
- **Per-channel memory.** Volume and mute state are saved in `localStorage` for each channel and restored when you come back.
- **Smart mute.** Scrolling down to 0% mutes the stream, and scrolling up from 0% unmutes it.
- **Mute and reset.** Middle-click the player to mute or unmute, <kbd>M</kbd> toggles mute and <kbd>R</kbd> resets to 50%.
- **Embeds.** It also works in `player.twitch.tv` embeds on other sites.
- **Stays out of your way.** The page scrolls normally when you're not over the player, and keys are never captured while you type in chat or search.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click **[Install TwitchTV-MWV](https://raw.githubusercontent.com/KuchiSofts/TwitchTV-MWV/master/TwitchTV-MWV.user.js)** and confirm.

Updates install automatically through your userscript manager.

## Usage

| Action | Where | Result |
| --- | --- | --- |
| Mouse wheel up / down | Over the player | Volume +5% / -5% |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + wheel | Over the player | Volume ±10% |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Mouse over the player, or player focused | Volume +5% / -5% |
| Middle-click | On the player | Mute / unmute |
| <kbd>M</kbd> | Player focused | Mute / unmute |
| <kbd>R</kbd> | Player focused | Reset to 50% |

## Settings

Open the script in your userscript manager and edit the `CONFIG` object at the top:

| Setting | Default | Description |
| --- | --- | --- |
| `defaultWheelStep` | `0.05` | Wheel step (5%) |
| `boostVolumeStep` | `0.10` | Step with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> held |
| `defaultVolume` | `0.5` | Volume for new channels and for <kbd>R</kbd> |
| `rememberPerChannel` | `true` | Save the volume per channel (`false` uses one global volume) |
| `autoMuteAtZero` | `true` | Mute when the volume reaches 0% |
| `middleClickToMute` | `true` | Middle-click on the player toggles mute |
| `overlayTimeout` | `1500` | How long the overlay stays visible, in ms |

Edits you make to the script are overwritten by updates. To keep them, turn off auto-update for this script in your manager.

## Compatibility

- Chrome, Edge, Brave, Opera and Firefox (desktop) with Tampermonkey or Violentmonkey
- `www.twitch.tv` (live streams and VODs) and `player.twitch.tv` embeds

## Troubleshooting

**The stream starts muted.** Browsers block autoplay with sound until you interact with the page. Click the player once, then scroll up or middle-click to unmute it.

**Nothing happens when I scroll.** Make sure the script is enabled, then reload the page. The wheel only controls the volume while the mouse is over the video.

**Volume isn't remembered in embeds.** Some browsers partition or block storage inside third-party iframes, so embeds on other sites may not keep the saved volume.

## Changelog

**2.1**
- Fixed mute toggling at random after a page or stream loaded.
- Middle-click now mutes, so double-click is free again for Twitch fullscreen. Reset stays on <kbd>R</kbd>.
- <kbd>↑</kbd> / <kbd>↓</kbd> only work when the mouse is over the player, and never while typing.
- The page no longer stops scrolling on pages without a player.
- Now works in `player.twitch.tv` embeds.
- Removes unused permissions (`@grant none`) and turns debug logging off.

**2.0**
- Rewrite with an overlay, per-channel memory and modifier steps.

## Contributing

Issues and pull requests are welcome. To report a bug, open an [issue](https://github.com/KuchiSofts/TwitchTV-MWV/issues) with your browser, userscript manager and the page URL. For pull requests, keep the existing code style and bump `@version` and `VERSION` in the script.

## License

[MIT](LICENSE) © KuchiSofts
