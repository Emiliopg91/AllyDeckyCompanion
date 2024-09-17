import { AppOverview, DisplayStatus } from "decky-frontend-lib"

export interface AppOverviewExt extends AppOverview {
    appid: string; // base
    display_name: string; // base
    display_status: DisplayStatus; // base
    sort_as: string; // base
    icon_data: string; // base, base64 encoded image
    icon_data_format: string; // base, image type without "image/" (e.g.: jpg, png)
    icon_hash: string; // base, url hash to fetch the icon for steam games (e.g.: "/assets/" + appid + "_icon.jpg?v=" + icon_hash)
    m_gameid: string; // base, id for non-steam games
}


export interface Profile {
    mode: number
    spl: number
    sppl: number
    fppl: number
    cpuBoost: boolean
    smtEnabled: boolean
}

export interface SdtdpSettingsTdpProfile {
    tdp: number
    cpuBoost: boolean
    smt: boolean
}

export interface SdtdpSettings {
    tdpProfiles: Record<string, SdtdpSettingsTdpProfile>
}