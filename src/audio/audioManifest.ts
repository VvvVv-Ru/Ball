export interface AudioTrackConfig {
  src: string;
  volume: number;
}

export interface SfxTrackConfig extends AudioTrackConfig {
  minIntervalMs: number;
}

export interface BgmTrackConfig extends AudioTrackConfig {
  loop: boolean;
}

export const AUDIO_MANIFEST = {
  sfx: {
    startClick: {
      src: "/audio/sfx/start-click.wav",
      volume: 0.72,
      minIntervalMs: 120,
    },
    match: {
      src: "/audio/sfx/match.wav",
      volume: 0.62,
      minIntervalMs: 48,
    },
    mismatch: {
      src: "/audio/sfx/mismatch.wav",
      volume: 0.68,
      minIntervalMs: 72,
    },
  },
  bgm: {
    gameplay: {
      src: "/audio/bgm/gameplay-bgm.mp3",
      volume: 0.34,
      loop: true,
    },
  },
} as const satisfies {
  sfx: Record<string, SfxTrackConfig>;
  bgm: Record<string, BgmTrackConfig>;
};

export type SfxAudioKey = keyof typeof AUDIO_MANIFEST.sfx;
export type BgmAudioKey = keyof typeof AUDIO_MANIFEST.bgm;
