// Module-level storage for the local video blob URL.
// Survives Next.js client-side navigation within the same tab.
let blobUrl: string | null = null

export function setLocalVideoUrl(url: string): void { blobUrl = url }
export function getLocalVideoUrl(): string | null    { return blobUrl }
