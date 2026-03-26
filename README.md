# OpenWebRadio

Drop-in React audio player that plays anything — local files, internet radio, live streams. Stays at the bottom, survives page navigation, remembers where you left off.

**[Live Demo](https://gameowermedia.github.io/OpenWebRadio/)** | **[npm](https://www.npmjs.com/package/@gameowermedia/overplayer)**

```bash
npm install @gameowermedia/overplayer
```

```tsx
import { OverPlayer } from "@gameowermedia/overplayer";

<OverPlayer
  tracks={[
    { src: "/audio/track-01.mp3", title: "Opening Theme", artist: "Artist" },
    { src: "https://ice1.somafm.com/groovesalad-128-mp3", title: "Groove Salad", artist: "SomaFM", live: true },
  ]}
  theme="auto"
  brandLabel="OpenWebRadio"
/>
```

That's it. One component. Zero config. Works with Next.js, Vite, CRA, or any React setup.

---

## What it does

- **Plays live radio** — Icecast/Shoutcast streams with auto-detected LIVE badge
- **Persists across pages** — audio keeps playing through React remounts and navigation
- **Remembers state** — track, position, volume restored on reload
- **Keyboard-first** — Space, N/P, M, L, arrows for full control
- **Playlist drawer** — slide-up track list with click-to-jump
- **Dark, Light, Auto** — follows OS preference with live switching
- **Headless mode** — `useOverPlayer()` hook for fully custom UIs
- **Accessible** — ARIA labels, screen reader announcements, `prefers-reduced-motion`
- **Zero dependencies** — only React 18+ as peer dep
- **TypeScript** — fully typed API

---

## Live Streams

Point it at any Icecast/Shoutcast URL. The player auto-detects live sources, hides the seek bar, and shows a pulsing LIVE indicator.

```tsx
const tracks = [
  { src: "https://ice1.somafm.com/groovesalad-128-mp3", title: "Groove Salad", artist: "SomaFM", live: true },
  { src: "https://ice1.somafm.com/defcon-128-mp3", title: "DEF CON Radio", artist: "SomaFM", live: true },
  { src: "/audio/local-track.mp3", title: "Local Track", artist: "You" },
];
```

Mix live streams and local files in the same playlist. The player handles both seamlessly.

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tracks` | `Track[]` | **required** | Array of tracks to play |
| `theme` | `"dark" \| "light" \| "auto"` | `"dark"` | Color theme |
| `shuffle` | `boolean` | `true` | Shuffle on by default |
| `autoplay` | `boolean` | `true` | Attempt autoplay on load |
| `volume` | `number` | `0.3` | Initial volume (0-1) |
| `storageKey` | `string` | `"overplayer"` | Session storage key |
| `accentColor` | `string` | `"#00e5ff"` | Primary accent |
| `accentColorAlt` | `string` | `"#ff2d7b"` | Secondary accent |
| `brandLabel` | `string` | `"OverPlayer"` | Label shown in the bar |
| `subtitle` | `string` | - | Text next to track title |
| `className` | `string` | - | Additional CSS class |
| `footer` | `ReactNode` | - | Custom element below player |
| `keyboardShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `onTrackChange` | `(track, index) => void` | - | Track changed |
| `onPlay` | `() => void` | - | Playback started |
| `onPause` | `() => void` | - | Playback paused |
| `onEnd` | `() => void` | - | Track ended |

### Track

```ts
interface Track {
  src: string;      // URL or path to audio file
  title: string;    // Display title
  artist?: string;  // Artist name
  cover?: string;   // Cover art URL
  live?: boolean;   // Live stream hint (auto-detected if omitted)
}
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `N` | Next track |
| `P` | Previous track |
| `M` | Mute / Unmute |
| `L` | Toggle playlist |
| `Arrow Left/Right` | Seek +-5s |
| `Arrow Up/Down` | Volume |

---

## Headless Hook

Build your own UI. Get full state and controls, no rendering.

```tsx
import { useOverPlayer } from "@gameowermedia/overplayer";

function CustomPlayer() {
  const [state, controls, tracks] = useOverPlayer({
    tracks: myTracks,
    shuffle: true,
    volume: 0.5,
  });

  return (
    <div>
      <p>{state.currentTrack?.title} {state.isLive && "(LIVE)"}</p>
      <button onClick={controls.toggle}>
        {state.playing ? "Pause" : "Play"}
      </button>
      <button onClick={controls.next}>Next</button>
    </div>
  );
}
```

### Controls

`play()` `pause()` `toggle()` `next()` `prev()` `seek(time)` `setVolume(vol)` `toggleMute()` `toggleShuffle()` `toggleRepeat()` `jumpTo(index)`

### State

`playing` `currentTrack` `trackIndex` `currentTime` `duration` `volume` `muted` `shuffleOn` `repeatOne` `isLive`

---

## Examples

### Custom Colors

```tsx
<OverPlayer
  tracks={tracks}
  theme="light"
  accentColor="#6366f1"
  accentColorAlt="#ec4899"
  brandLabel="MyRadio"
/>
```

### Multiple Players

```tsx
<OverPlayer tracks={podcastTracks} storageKey="podcasts" brandLabel="Podcasts" />
<OverPlayer tracks={musicTracks} storageKey="music" brandLabel="Music" />
```

### Next.js App Router

```tsx
// app/layout.tsx
import { OverPlayer } from "@gameowermedia/overplayer";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <OverPlayer tracks={tracks} theme="auto" />
      </body>
    </html>
  );
}
```

---

## Development

```bash
git clone https://github.com/GameOwerMedia/OpenWebRadio.git
cd OpenWebRadio
npm install
npm run dev        # watch mode
npm run build      # production build
npm run typecheck  # type checking
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

[MIT](./LICENSE) - Copyright (c) 2026 OverJK / GameOwerMedia

Free to use in personal and commercial projects. Attribution appreciated but not required.
