import { FC } from "react";
import { PerformanceProvider } from "../../contexts/performanceContext";
import { HeaderBlock } from "./headerBlock";
import { CpuBlock } from "./cpuBlock";
import { ModeBlock } from "./modeBlock";
import { GpuBlock } from "./gpuBlock";
import { PowerBlock } from "./powerBlock";

export const PerformanceBlock: FC = () => {
  return (
    <PerformanceProvider>
      <>
        <HeaderBlock />
        <ModeBlock />
        <CpuBlock />
        <PowerBlock />
        <GpuBlock />
      </>
    </PerformanceProvider>
  );
};
