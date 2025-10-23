import { AppOverview, DisplayStatus } from '@decky/ui';

export interface AppOverviewExt extends AppOverview {
  appid: number; // base
  display_name: string; // base
  display_status: DisplayStatus; // base
  sort_as: string; // base
  icon_data: string; // base, base64 encoded image
  icon_data_format: string; // base, image type without "image/" (e.g.: jpg, png)
  icon_hash: string; // base, url hash to fetch the icon for steam games (e.g.: "/assets/" + appid + "_icon.jpg?v=" + icon_hash)
  img_logo_url: string;
  m_gameid: string; // base, id for non-steam games
  BIsModOrShortcut: () => boolean;
  BIsShortcut: () => boolean;
  gameid: string;
}

export interface Configuration {
  schema: string;
  profiles: Record<string, GameEntry>;
  settings: Settings;
}

export interface Profile {
  mode: Mode;
  cpu: CpuProfile;
  gpu: GpuProfile;
  display: Display;
  audio: Audio;
}

export interface Audio {
  devices: Record<string, AudioDevice>;
}

export interface AudioDevice {
  volume: number | undefined;
}

export interface Settings {
  profile_per_game: boolean;
  limit_battery: number;
  mcu_powersave?: boolean;
}

export interface GameEntry {
  name: string;
  battery: Profile;
  acpower: Profile;
}

export interface Display {
  brightness?: number;
}

export interface CpuProfile {
  boost: boolean;
  smt: boolean;
  tdp: TdpCpuProfile;
  governor: Governor;
}

export enum Mode {
  SILENT,
  PERFORMANCE,
  TURBO,
  CUSTOM
}

export enum Governor {
  POWERSAVE,
  PERFORMANCE
}

export interface GpuFreqProfile {
  min: number;
  max: number;
}

export interface GpuProfile {
  frequency: GpuFreqProfile;
}

export interface TdpCpuProfile {
  spl: number;
  sppl: number;
  fppl: number;
}

export interface SdtdpSettingsTdpProfile {
  tdp: number;
  cpuBoost: boolean;
  smt: boolean;
}

export interface SdtdpSettings {
  tdpProfiles: Record<string, SdtdpSettingsTdpProfile>;
}

export enum Acpi {
  LOW_POWER,
  BALANCED,
  PERFORMANCE
}

export interface SystemInfoSchema {
  biosVersion: string;
  isAlly: boolean;
  isAllyX: boolean;
  isXboxAlly: boolean;
  isXboxAllyX: boolean;
}
