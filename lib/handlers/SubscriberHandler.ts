import IOCommands from '../constants/IOCommands';
import type Handler from '../interfaces/Handler';
import type Subscriber from '../models/Subscriber';
import type SDK from '../SDK';
import ChunkArray from '../utilities/ChunkArray';

export default class SubscriberHandler implements Handler {
    sdk: SDK;
    private cache: Array<Subscriber> = [];

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {
        this.sdk.connection.on('disconnect', this.onDisconnect);
        this.sdk.connection.on('subscriber update', this.onSubscriberUpdate);
    }

    close = async () => {
        this.sdk.connection.off('disconnect', this.onDisconnect);
        this.sdk.connection.off('subscriber update', this.onSubscriberUpdate);
    }

    profile = async (id: number): Promise<Subscriber | undefined> => {
        // If we aren't caching just go straight to fetching
        if (!this.sdk.cacheEntities)
            return await this.fetch(id);

        // Check to see if the subsctiber is cached
        let subscriber = this.cache.find(t => t.id === id);

        // If no subscriber, fetch and cache
        if (subscriber === undefined) {
            subscriber = await this.fetch(id);

            if (subscriber !== undefined)
                this.cache.push(subscriber);
        }

        // Finally return the subscriber
        return subscriber;
    }

    profiles = async (idList: number[]): Promise<Subscriber[]> => {
        // If we aren't caching just go straight to fetching
        if (!this.sdk.cacheEntities)
            return await this.fetchMultiple(idList);

        // Find the cached subscribers (where the hashes match if defined) so we don't fetch them
        let subscribers = this.cache.filter(t => idList.includes(t.id));

        // Map the fetched ids and create an array of unfetched or nonmatching hash ids
        let subscribersIds = subscribers.map(t => t.id);
        let unfetched = idList.filter(t => !subscribersIds.includes(t));

        // We are trying to avoid suspensions from packet flooding the server, so will await each chunk
        let chunks = ChunkArray(unfetched, 50);
        for (let i = 0; i < chunks.length; i++) {
            let fetched = await this.fetchMultiple(chunks[i]);

            // Push to subscribers
            subscribers.push(...fetched);
            this.cache.push(...fetched);
        }

        // Sort the results array based on the idList requests
        return subscribers.sort((a, b) => idList.indexOf(a.id) - idList.indexOf(b.id));
    }

    private fetch = async (id: number): Promise<Subscriber | undefined> => {
        try {
            return <Subscriber>(await this.sdk.send(IOCommands.Subscriber.Profile, {
                headers: { version: 4 },
                body: {
                    id,
                    extended: true,
                    subscribe: this.sdk.cacheEntities
                }
            }));
        } catch (e) {
            return undefined;
        }
    }

    private fetchMultiple = async (idList: number[]): Promise<Subscriber[]> => {
        let res = <any>(await this.sdk.send(IOCommands.Subscriber.Profile, {
            headers: { version: 4 },
            body: {
                idList,
                extended: true,
                subscribe: this.sdk.cacheEntities
            }
        }));

        return <Subscriber[]>Object.values(res).filter((t: any) => t.code === 200).map((t: any) => t.body);
    }

    private onSubscriberUpdate = async (data: { code: number, body: { id: number, hash: string } }) => {
        let subscriber = <Subscriber>(await this.fetch(data.body.id));

        let index = this.cache.findIndex(t => t.id === data.body.id);
        this.cache[index] = subscriber;
    }

    private onDisconnect = () => {
        // Invalidate the cache on a disconnect
        // We don't/won't know how long we have been disconnected for
        // Treat everything as inalid
        this.cache = [];
    }
}