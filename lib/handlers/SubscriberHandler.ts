import IOCommands from '../constants/IOCommands';
import type Handler from '../interfaces/Handler';
import type ProfileParams from '../models/ProfileParams';
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
    }

    close = async () => {
        this.sdk.connection.off('disconnect', this.onDisconnect);
    }

    profile = async (id: number, params: Partial<ProfileParams> = {}): Promise<Subscriber> => {
        // If we aren't caching just go straight to fetching
        if (!this.sdk.cacheEntities)
            return await this.fetch(id, params);

        // Check to see if the subsctiber is cached
        let subscriber = this.cache.find(t => t.id === id);

        // If no subscriber, fetch and cache
        if (subscriber === undefined) {
            subscriber = await this.fetch(id, params);
            this.cache.push(subscriber);
        }
        
        // If subscriber but hashes don't match, fetch and update
        if (params.hash !== undefined && subscriber.hash !== params.hash) {
            subscriber = await this.fetch(id, params);
            let index = this.cache.findIndex(t => t.id === id);
            this.cache[index] = subscriber;
        }

        // Finally return the subscriber
        return subscriber;
    }

    profiles = async (idList: number[], params: Partial<ProfileParams> = {}): Promise<Subscriber[]> => {
        // If we aren't caching just go straight to fetching
        if (!this.sdk.cacheEntities)
            return await this.fetchMultiple(idList, params);

        // Find the cached subscribers (where the hashes match if defined) so we don't fetch them
        let subscribers = this.cache.filter(t => {
            if (idList.includes(t.id) && params.hash === undefined) return t;
            if (idList.includes(t.id) && params.hash !== undefined && t.hash === params.hash) return t;
            return undefined;
        }).filter(t => t);

        // Map the fetched ids and create an array of unfetched or nonmatching hash ids
        let subscribersIds = subscribers.map(t => t.id);
        let unfetched = idList.filter(t => !subscribersIds.includes(t));

        // We are trying to avoid suspensions from packet flooding the server, so will await each chunk
        let chunks = ChunkArray(unfetched, 50);
        for (let i = 0; i < chunks.length; i++) {
            let fetched = await this.fetchMultiple(chunks[i], params);

            // Push to subscribers
            subscribers.push(...fetched);

            // Get the ids that are in cache from the chunk (we will have to update these)
            let existsInCache = this.cache.filter(t => chunks[i].includes(t.id)).map(t => t.id);
            
            existsInCache.forEach(id => {
                let index = this.cache.findIndex(t => t.id === id);
                this.cache[index] = <Subscriber>(fetched.find(t => t.id === id));
            });

            // Push non existent to cache
            let notExistsInCache = chunks[i].filter(t => !existsInCache.includes(t))
            this.cache.push(...fetched.filter(t => notExistsInCache.includes(t.id)));
        }

        // Sort the results array based on the idList requests
        return subscribers.sort((a, b) => idList.indexOf(a.id) - idList.indexOf(b.id));
    }

    private fetch = async (id: number, params: Partial<ProfileParams>): Promise<Subscriber> => {
        let body = { id };

        console.log(`Fetching`, id);

        if (params.hash) body['hash'] = params.hash;
        if (params.extended) body['extended'] = params.extended;
        if (params.subscribe) body['subscribe'] = params.subscribe;

        return <Subscriber>(await this.sdk.send(IOCommands.Subscriber.Profile, {
            headers: { version: 4 },
            body
        }));
    }

    private fetchMultiple = async (idList: number[], params: Partial<ProfileParams>): Promise<Subscriber[]> => {
        let body = { idList };

        if (params.hashList) body['hashList'] = params.hashList;
        if (params.extended) body['extended'] = params.extended;
        if (params.subscribe) body['subscribe'] = params.subscribe;

        let res = <any>(await this.sdk.send(IOCommands.Subscriber.Profile, {
            headers: { version: 4 },
            body
        }));

        return <Subscriber[]>Object.values(res).map((t: any) => t.body);
    }

    private onDisconnect = () => {
        // Invalidate the cache on a disconnect
        // We don't/won't know how long we have been disconnected for
        // Treat everything as inalid
        this.cache = [];
    }
}