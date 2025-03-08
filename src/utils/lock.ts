import { Store, StoreScope } from "@activepieces/pieces-framework";

export class Lock {
    private readonly key: string;
    private readonly store: Store;
    private readonly lockId: string;
    private readonly waitToAcquireLockMs: number;
    private readonly retryAfterMs: number;
    private readonly lockTtl: number;
    private readonly debug: boolean = false;

    constructor(args: {
        key: string,
        store: Store,
        lockId: string
        lockTtl?: number
        waitToAcquireLockMs?: number,
        retryAfterMs?: number
        debug?: true 
    }) { 
        this.key = args.key;
        this.store = args.store;
        this.lockId = args.lockId;
        this.waitToAcquireLockMs = args.waitToAcquireLockMs || 60000;
        this.retryAfterMs = args.retryAfterMs || 1000;
        this.lockTtl = args.lockTtl || 5000;
        this.debug = args.debug || false;
    }

    async acquireLock(): Promise<void> { 
        const startTime = Date.now();
        let lockTime: number | null = null;

        do {
            if (startTime + this.waitToAcquireLockMs < Date.now()) {
                throw new Error("Timeout waiting for lock to acquire");
            }

            lockTime = await this.getLockTime();

            if (lockTime && !this.lockExpired(lockTime)) {
                // wait for lock to expire
                await new Promise((resolve) => setTimeout(resolve, this.retryAfterMs));
                this.debug && console.log(`[${this.lockId}] Waiting for lock to expire...`);
            } else {
                // acquire lock
                lockTime = null;
                const dateString = new Date().toISOString();
                await this.store.put(this.key, dateString, StoreScope.PROJECT);
                this.debug && console.log(`[${this.lockId}] Acquired lock`);
            }
        } while (lockTime);
    }


    lockExpired(lockTime: number, now?: number): boolean {
        return lockTime + this.lockTtl < (now || Date.now());
    }

    async getLockTime(): Promise<number | null> {
        const lock = await this.store.get(this.key, StoreScope.PROJECT);

        if (lock === null) {
            return null
        } else if (typeof lock === 'string') {
            const date = Date.parse(lock);
            if (typeof date === 'number' && !isNaN(date)) {
                return new Date(lock).getTime();
            }
        } 

        throw new Error(
            `[${this.lockId}] Invalid lock! Expected lock to be date string or null`
        );
    }
}