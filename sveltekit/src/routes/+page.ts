import type { PageLoad } from './$types';
import {userControllerGetMe, characterControllerFindAll} from '$lib/client/sdk.gen'

export const load: PageLoad = async ({  }) => {
    try {
        const resp = await userControllerGetMe({
            credentials: 'include'
        })
        const characters = await characterControllerFindAll()
        console.log('Page load response:', resp)
        
        const data = {
            user: resp.data ? resp.data : null,
            characters: characters.data ? characters.data: []
        }
        return data
    } catch (error) {
        console.error('Error loading user data:', error)
        return {
            user: null
        }
    }
};