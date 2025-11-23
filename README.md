🌌 NovaCore

Version: 1.6
Platform: Tampermonkey

Game Compatibility: miniblox.io

Author: (Can't reveal yet)

🧩 Overview

NovaCore is a custom Tampermonkey client script designed for miniblox.io, offering a polished and feature-rich user experience.
It includes a playtime tracker, interactive menu system, customizable keybinds, and utility overlays such as FPS, CPS, and Real-Time counters — all in a sleek cyber-themed interface.

✨ Features
🕹️ Interactive Menu

Toggle with a customizable keybind (default: \)

Neon-themed UI with animated transitions

Persistent header with client branding

⏱️ Playtime Tracker

Tracks total and session playtime automatically

Displays total duration in days, hours, minutes, and seconds

Earns a “gold theme” when reaching 10+ hours of total use

⚙️ Binding System

Rebind the menu toggle key directly from the UI

Saves preferences in localStorage (persistent between sessions)

📊 Utility Counters
Feature	Description
FPS Counter	Real-time framerate display; draggable UI element
CPS Counter	Tracks mouse clicks per second; draggable
Real Time Clock	Displays system time (with tooltip) for fullscreen sessions
Auto Fullscreen	Toggle fullscreen mode directly from the menu
💾 Installation

Install Tampermonkey (if not already):

Chrome Web Store

Firefox Add-ons

Edge Add-ons

Add the Script:

Open Tampermonkey → Create a new script

Paste the entire contents of NovaCore.user.js

Save (Ctrl + S)

Visit miniblox.io

The NovaCore intro animation will play

After that, press \ to open the NovaCore Menu

🧠 Usage Guide
Action	Description
\	Open/Close the NovaCore menu
“Menu Keybind” section	Change the key used to open the menu
“FPS Counter”	Show or hide FPS tracker
“CPS Counter”	Show or hide CPS tracker
“Real Time”	Toggle real-time clock
“Auto Fullscreen”	Toggle fullscreen mode
🗃️ Data Persistence

NovaCore stores user preferences and playtime data in localStorage:

novacore_playtime → total accumulated playtime

novacore_menuKey → custom menu toggle key

These persist across sessions unless manually cleared in browser storage.

🖌️ Visual Design

NovaCore uses:

Retro neon theming inspired by synthwave/cyberpunk

Google Fonts — Press Start 2P

Custom CSS animations for smooth transitions and intro effects

🧾 License

This project is shared for educational and personal use only.
Do not redistribute or claim ownership without permission from the author.
