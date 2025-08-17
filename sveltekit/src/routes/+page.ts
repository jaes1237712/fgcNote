import type { PageLoad } from './$types';
import { userControllerGetMe, characterControllerFindAll } from '$lib/client/sdk.gen';

export const load: PageLoad = async ({}) => {
	try {
		const resp = await userControllerGetMe({
			credentials: 'include'
		});
		const allCharacters = await characterControllerFindAll();
		console.log('Page load response:', resp);
		if(resp.data){
			return {
				user: resp.data,
				allCharacters: allCharacters.data ?? []
			};
		}
		else{return {allCharacters:allCharacters.data}}
	} catch (error) {
		console.error('Error loading user data:', error);
		return {
		};
	}
};
