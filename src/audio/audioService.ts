import { AUDIO_MANIFEST } from "./audioManifest";
import type { BgmAudioKey, BgmTrackConfig, SfxAudioKey, SfxTrackConfig } from "./audioManifest";

function canUseBrowserAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function createAudioElement(config: SfxTrackConfig | BgmTrackConfig) {
  const audio = new Audio(config.src);
  audio.preload = "auto";
  audio.volume = config.volume;

  if ("loop" in config) {
    audio.loop = config.loop;
  }

  return audio;
}

class AudioService {
  private readonly sfxTemplates = new Map<SfxAudioKey, HTMLAudioElement>();

  private readonly bgmPlayers = new Map<BgmAudioKey, HTMLAudioElement>();

  private readonly activeSfxPlayers = new Set<HTMLAudioElement>();

  private readonly lastSfxPlayedAt = new Map<SfxAudioKey, number>();

  private activeBgmKey: BgmAudioKey | null = null;

  private unlockAttempted = false;

  private unlocked = false;

  private getSfxTemplate(key: SfxAudioKey) {
    const cachedAudio = this.sfxTemplates.get(key);

    if (cachedAudio) {
      return cachedAudio;
    }

    const audio = createAudioElement(AUDIO_MANIFEST.sfx[key]);
    this.sfxTemplates.set(key, audio);
    return audio;
  }

  private getBgmPlayer(key: BgmAudioKey) {
    const cachedAudio = this.bgmPlayers.get(key);

    if (cachedAudio) {
      return cachedAudio;
    }

    const audio = createAudioElement(AUDIO_MANIFEST.bgm[key]);
    this.bgmPlayers.set(key, audio);
    return audio;
  }

  async unlock() {
    if (!canUseBrowserAudio()) {
      return false;
    }

    if (this.unlocked) {
      return true;
    }

    if (this.unlockAttempted) {
      return this.unlocked;
    }

    this.unlockAttempted = true;
    const bgmPlayer = this.getBgmPlayer("gameplay");

    if (this.activeBgmKey === "gameplay" && !bgmPlayer.paused) {
      this.unlocked = true;
      this.unlockAttempted = false;
      return true;
    }

    const previousMuted = bgmPlayer.muted;
    const previousVolume = bgmPlayer.volume;

    bgmPlayer.muted = true;
    bgmPlayer.volume = 0;

    try {
      await bgmPlayer.play();
      bgmPlayer.pause();
      bgmPlayer.currentTime = 0;
      this.unlocked = true;
      return true;
    } catch {
      return false;
    } finally {
      bgmPlayer.pause();
      bgmPlayer.currentTime = 0;
      bgmPlayer.muted = previousMuted;
      bgmPlayer.volume = previousVolume;
      this.unlockAttempted = false;
    }
  }

  async playSfx(key: SfxAudioKey) {
    if (!canUseBrowserAudio()) {
      return false;
    }

    const config = AUDIO_MANIFEST.sfx[key];
    const now = performance.now();
    const lastPlayedAt = this.lastSfxPlayedAt.get(key) ?? -Infinity;

    if (now - lastPlayedAt < config.minIntervalMs) {
      return false;
    }

    this.lastSfxPlayedAt.set(key, now);

    const template = this.getSfxTemplate(key);
    const audio = template.cloneNode(true) as HTMLAudioElement;
    audio.currentTime = 0;
    audio.volume = config.volume;
    audio.preload = "auto";

    const cleanup = () => {
      this.activeSfxPlayers.delete(audio);
      audio.onended = null;
      audio.onerror = null;
      audio.src = "";
    };

    audio.onended = cleanup;
    audio.onerror = cleanup;
    this.activeSfxPlayers.add(audio);

    try {
      await audio.play();
      return true;
    } catch {
      cleanup();
      return false;
    }
  }

  async playBgm(key: BgmAudioKey) {
    if (!canUseBrowserAudio()) {
      return false;
    }

    if (this.activeBgmKey && this.activeBgmKey !== key) {
      this.stopBgm();
    }

    const player = this.getBgmPlayer(key);
    const config = AUDIO_MANIFEST.bgm[key];
    player.loop = config.loop;
    player.volume = config.volume;

    if (this.activeBgmKey === key && !player.paused) {
      return true;
    }

    try {
      await player.play();
      this.activeBgmKey = key;
      return true;
    } catch {
      return false;
    }
  }

  stopBgm(key?: BgmAudioKey) {
    if (!canUseBrowserAudio()) {
      return;
    }

    const targetKey = key ?? this.activeBgmKey;

    if (!targetKey) {
      return;
    }

    const player = this.bgmPlayers.get(targetKey);

    if (!player) {
      if (this.activeBgmKey === targetKey) {
        this.activeBgmKey = null;
      }

      return;
    }

    player.pause();
    player.currentTime = 0;

    if (this.activeBgmKey === targetKey) {
      this.activeBgmKey = null;
    }
  }

  stopAll() {
    this.stopBgm();

    this.activeSfxPlayers.forEach((player) => {
      player.pause();
      player.currentTime = 0;
      player.src = "";
    });

    this.activeSfxPlayers.clear();
  }
}

export const audioService = new AudioService();
