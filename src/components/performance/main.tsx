import { FC, useContext, useEffect } from "react"

import { Logger } from "decky-plugin-framework";
import { Profiles } from "../../settings/profiles";
import { debounce } from 'lodash'
import { PerformanceContext, PerformanceProvider } from "../../contexts/performanceContext";
import { HeaderBlock } from "./headerBlock";
import { CpuBlock } from "./cpuBlock"

export const PerformanceBlock: FC = () => {
  const { id, name, setProfile } = useContext(PerformanceContext)

  const loadSettings = debounce((id, name) => {
    Logger.info("Loading profile " + id + " (" + name + ")")
    const profile = Profiles.getProfileForId(id);
    setProfile(profile)
  }, 100)

  useEffect(() => {
    loadSettings(id, name);
  }, [])

  useEffect(() => {
    loadSettings(id, name);
  }, [id])

  return (
    <PerformanceProvider>
      <>
        <HeaderBlock />
        <CpuBlock />
      </>
    </PerformanceProvider>
  );
};