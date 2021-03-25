import IOCommands from '../constants/IOCommands';
import type Handler from '../interfaces/Handler';
import type Group from '../models/Group';
import type SDK from '../SDK';
import ChunkArray from '../utilities/ChunkArray';

export default class GroupHandler implements Handler {
    sdk: SDK;
    private cache: Array<Group> = [];

    constructor(sdk: SDK) {
        this.sdk = sdk;
    }

    init = async () => {
        this.sdk.connection.on('disconnect', this.onDisconnect);
        this.sdk.connection.on('group update', this.onGroupUpdate);
    }

    close = async () => {
        this.sdk.connection.off('disconnect', this.onDisconnect);
        this.sdk.connection.off('group update', this.onGroupUpdate);
    }

    profile = async (id: number): Promise<Group | undefined> => {
        if (!this.sdk.cacheEntities)
            return await this.fetch(id, ['base', 'extended', 'audioConfig', 'audioCounts']);

        let group = this.cache.find(t => t.base?.id === id);

        if (group === undefined) {
            group = await this.fetch(id, ['base', 'extended', 'audioConfig', 'audioCounts']);

            if (group !== undefined)
                this.cache.push(group);
        }

        return group;
    }

    profiles = async (idList: number[]): Promise<Group[]> => {
        if (!this.sdk.cacheEntities)
            return await this.fetchMultiple(idList, ['base', 'extended', 'audioConfig', 'audioCounts']);
        
        let groups = this.cache.filter(t => idList.includes(t.base.id));

        let groupsIds = groups.map(t => t.base.id);
        let unfetched = idList.filter((t => !groupsIds.includes(t)));

        let chunks = ChunkArray(unfetched, 50);
        for (let i = 0; i < chunks.length; i++) {
            let fetched = await this.fetchMultiple(chunks[i], ['base', 'extended', 'audioConfig', 'audioCounts']);

            groups.push(...fetched);
            this.cache.push(...fetched);
        }

        return groups.sort((a, b) => idList.indexOf(a.base.id) - idList.indexOf(b.base.id));
    }

    private fetch = async (id: number, entities: string[]): Promise<Group | undefined> => {
        try {
            return <Group>(await this.sdk.send(IOCommands.Group.Profile, {
                headers: { version: 4 },
                body: {
                    id,
                    entities,
                    subscribe: this.sdk.cacheEntities
                }
            }));
        } catch (e) {
            return undefined;
        }
    }

    private fetchMultiple = async (idList: number[], entities: string[]): Promise<Group[]> => {
        let res = <any>(await this.sdk.send(IOCommands.Group.Profile, {
            headers: { version: 4 },
            body: {
                idList,
                entities,
                subscribe: this.sdk.cacheEntities
            }
        }));

        return <Group[]>Object.values(res).filter((t: any) => t.code === 200).map((t: any) => t.body);
    }

    private onGroupUpdate = async (data: { code: number, body: { id: number, hash: string }}) => {
        let group = <Group>(await this.fetch(data.body.id, ['base', 'extended', 'audioConfig', 'audioCounts']));

        let index = this.cache.findIndex(t => t.base.id === data.body.id);
        this.cache[index] = group;
    }

    private onDisconnect = () => {
        // Invalidate the cache on a disconnect
        // We don't/won't know how long we have been disconnected for
        // Treat everything as inalid
        this.cache = [];
    }
}