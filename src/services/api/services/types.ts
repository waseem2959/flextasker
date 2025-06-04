export interface RateLimiterStatus {
    queueLength: number;
    degradationLevel: number;
    isLimited: boolean;
    timeUntilReset: number;
    reset: () => void;
}
