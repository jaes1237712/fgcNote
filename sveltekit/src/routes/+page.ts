import type { PageLoad } from './$types';
import {
	userControllerGetMe,
	characterControllerFindAll,
	canvasControllerGetAllStage
} from '$lib/client/sdk.gen';

export const load: PageLoad = async ({}) => {
	try {
		const userResp = await userControllerGetMe({});
		const allCharacters = await characterControllerFindAll();
		const allStageDtos = await canvasControllerGetAllStage();
		console.log('allCharacter', allCharacters);
		console.log('allStageDtos', allStageDtos);

		if (userResp.data) {
			return {
				user: userResp.data,
				allCharacters: allCharacters.data ?? [],
				allStageDtos: allStageDtos.data ?? []
			};
		} else {
			return {
				allCharacters: allCharacters.data ?? [],
				allStageDtos: allStageDtos.data ?? []
			};
		}
	} catch (error) {
		console.error('Error loading user data:', error);
		return {};
	}
};
