import { StoreScope } from '@activepieces/pieces-framework';
import { Lock } from './lock';

const mockStore = {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
};

afterEach(() => {
    jest.clearAllMocks();
})

describe('getLock', () => { 
    it('should get store element', async () => {
        const
            key = 'testKey',
            lock = new Lock({ key, store: mockStore, lockId: 'lock-id' }),
            date = new Date();

        mockStore.get.mockResolvedValueOnce(date.toISOString());
        const lockTime = await lock.getLockTime();
        expect(lockTime).toBe(date.getTime());
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    });

    it('should return null if store element is null', async () => { 
        const
            key = 'testKey',
            lock = new Lock({ key, store: mockStore, lockId: 'lock-id' });

        mockStore.get.mockResolvedValueOnce(null);
        const lockTime = await lock.getLockTime();
        expect(lockTime).toBeNull();
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })

    it('should throw error if store element is not a date string', async () => { 
        const
            key = 'testKey',
            lock = new Lock({ key, store: mockStore, lockId: 'lock-id' });

        mockStore.get.mockResolvedValueOnce('not a date string');
        await expect(lock.getLockTime()).rejects.toThrow();
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })
})

describe('lockExpired', () => { 
    it('should return true if lock expired', async () => { 
        const now = Date.now();
        const lock = new Lock({
            lockTtl: 1000, key: 'testKey', store: mockStore, lockId: 'lock-id'
        });

        // Lock in past older than ttl is expired
        const expired = lock.lockExpired(now - 2000, now);
        expect(expired).toBe(true);
    })

    it('should return false if lock not expired', async () => {  
        const now = Date.now();
        const lock = new Lock({
            lockTtl: 1000, key: 'testKey', store: mockStore, lockId: 'lock-id', 
        });

        // Lock in future is not expired
        const expired = lock.lockExpired(now + 2000, now);
        expect(expired).toBe(false);
    })

    it('should return false for exact match', async () => { 
        const now = Date.now();
        const lock = new Lock({
            lockTtl: 1000, key: 'testKey', store: mockStore, lockId: 'lock-id', 
        });

        expect(lock.lockExpired(now - 1000, now)).toBe(false);
        expect(lock.lockExpired(now - 1001, now)).toBe(true);
    })
})

describe('acquireLock', () => { 
    it('should acquire lock when lock is missing', async () => { 
        const 
            key = 'testKey',
            lock = new Lock({
                key, store: mockStore, lockId: 'lock-id',
            });

        mockStore.get.mockResolvedValueOnce(null);

        await lock.acquireLock();

        expect(mockStore.put).toHaveBeenCalledTimes(1);
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })

    it('should acquire lock when lock is expired', async () => { 
        const now = Date.now();

        const 
            key = 'testKey',
            lock = new Lock({
                lockTtl: 1000, key, store: mockStore, lockId: 'lock-id', 
            });

        mockStore.get.mockResolvedValueOnce(new Date(now - 2000).toISOString());

        await lock.acquireLock();

        expect(mockStore.put).toHaveBeenCalledTimes(1);
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })

    it('should throw error when cannot acquire lock for too long', async () => { 
        const now = Date.now();

        const 
            key = 'testKey',
            lock = new Lock({
                lockTtl: 5000, key, waitToAcquireLockMs: 10,
                store: mockStore, lockId: 'lock-id'
            });

        mockStore.get.mockResolvedValueOnce(new Date(now + 20000).toISOString());

        await expect(lock.acquireLock()).rejects.toThrow();

        expect(mockStore.put).toHaveBeenCalledTimes(0);
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })

    it('should acquire lock after few attempts', async () => {
        const now = Date.now();

        const 
            key = 'testKey',
            lock = new Lock({
                lockTtl: 100, key, waitToAcquireLockMs: 1000, retryAfterMs: 10,
                store: mockStore, lockId: 'lock-id'
            });

        mockStore.get.mockResolvedValue(new Date(now).toISOString());

        await lock.acquireLock();

        expect(mockStore.put).toHaveBeenCalledTimes(1);
        expect(mockStore.get).toHaveBeenCalledWith(key, StoreScope.PROJECT);
    })
})