import { nameAtInstance } from '$lib/nav-utils';
import { profile } from '$lib/profiles/profiles';
import type { Community, GetCommunityResponse } from 'lemmy-js-client';
import { getContext, setContext } from 'svelte';
import { get, derived, type Writable, type Readable, writable } from 'svelte/store';

const COMMUNITY_CONTEXT_KEY = '__COMMUNITY_CONTEXT__';

export interface CommunityContext {
	// a Map of community names to their views
	communities: Writable<Map<string, GetCommunityResponse>>;
	// get the community view in a derived store, loads if it hasn't been loaded
	getCommunity: (name: string) => Readable<null | GetCommunityResponse>;
	getFullCommunity: (community: Community) => Readable<null | GetCommunityResponse>;
	// gets the community if we've loaded it, but don't load if we haven't already.
	// useful for comments, as they can check if the commenter is a mod, but
	// prevents loading every community when viewing a big list of comments.
	weaklyGetCommunity: (name: string) => Readable<null | GetCommunityResponse>;
	updateCommunity: (res: GetCommunityResponse) => void;
}

export const getCommunityContext = () => {
	return getContext<CommunityContext>(COMMUNITY_CONTEXT_KEY);
};

export const createCommunityContext = () => {
	const communities = writable(new Map<string, GetCommunityResponse>()),
		// make sure we don't initiate loading a community if a request is already in flight
		loading = new Set<string>();

	async function loadCommunity(name: string) {
		loading.add(name);
		const { client, jwt } = get(profile);

		const res = await client.getCommunity({
			auth: jwt,
			name
		});

		communities.update((coms) => {
			coms.set(name, res);
			return coms;
		});
		loading.delete(name);
	}

	const communityContext: CommunityContext = {
		communities,
		// get the community if it's been loaded, don't bother otherwise
		weaklyGetCommunity: (name: string) => {
			return derived(communities, (communities) => {
				return communities.get(name) ?? null;
			});
		},
		getCommunity: (name: string) => {
			// if this is the first time this community has been asked for, request it
			if (!loading.has(name) && !get(communities).has(name)) {
				loadCommunity(name);
			}

			return derived(communities, (communities) => {
				return communities.get(name) ?? null;
			});
		},
		getFullCommunity: (community) => {
			return communityContext.getCommunity(nameAtInstance(community));
		},
		updateCommunity: (res) => {
			communities.update((coms) => {
				coms.set(nameAtInstance(res.community_view.community), res);
				return coms;
			});
		}
	};

	setContext(COMMUNITY_CONTEXT_KEY, communityContext);

	return communityContext;
};
