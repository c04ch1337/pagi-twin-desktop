// Type definitions for global Sola app API
declare global {
  interface Window {
    solaApp: {
      setAccessPornCapability: (enabled: boolean) => void;
      getGpuUsage: () => Promise<{
        gpu: number;
        vram: number;
        temperature: number;
      }>;
    };
  }
}

export {};