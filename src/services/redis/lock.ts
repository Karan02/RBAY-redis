import { client } from './client';
import { randomBytes } from 'crypto';

// 🧩 Full Flow (Step-by-Step)
// Generate unique token
// Try acquiring lock in Redis
// If failed → retry
// If success:
// Start expiration timer
// Wrap Redis client in proxy
// Execute callback
// Release lock safely

export const withLock = async (key: string,
	 cb: (redisClient: Client, signal: any) => any) => { //cb -> function to execute only when lock is acquired

	// Initialize a few variables to control retry behavior
	const retryDelayMs = 100;
	const timeoutMs = 2000;
	let retries = 20;

	// Generate a random value to store at the lock key
	const token = randomBytes(6).toString('hex');
	// Create the lock key
	const lockKey = `lock:${key}`; // this is "lock key" for the "key"

	// Set up a while loop to implement the retry behavior
	while (retries >= 0) {
		retries--;
		// Try to do a SET NX operation
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: timeoutMs
		});

		if (!acquired) {
			// ELSE brief pause (retryDelayMs) and then retry
			await pause(retryDelayMs);
			continue;
		}

		// IF the set is successful, then run the callback
		try {
			const signal = { expired: false }; // signal.expired becomes true after lock timeout, lets your code know if lock is expired
			setTimeout(() => {
				signal.expired = true;
			}, timeoutMs);

			const proxiedClient = buildClientProxy(timeoutMs); // wrapper around redis client
			const result = await cb(proxiedClient, signal);//executes your logic, passes safe redis client,expiration signal
			return result;
		} finally {
			await client.unlock(lockKey, token); // always release lock
		}
	}
};

type Client = typeof client;
// what proxy does, if lock time is exceeded, any redis call -> throws error, without this your code still runs
// even if lock expired, another process might already have the lock, so prevents race conditions
const buildClientProxy = (timeoutMs: number) => {
	const startTime = Date.now();

	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeoutMs) {
				throw new Error('Lock has expired.');
			}

			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	return new Proxy(client, handler) as Client; // intercepts redis calls, checks lock expired, if yes throws error
};


// simple delay utility
const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};


// ⚠️ Why This Pattern is Used

// This solves problems like:

// ❌ Duplicate job execution
// ❌ Multiple workers updating same record
// ❌ Race conditions in distributed systems
