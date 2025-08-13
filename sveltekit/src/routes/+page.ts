import type { PageLoad } from './$types';
import {userControllerGetMe} from '$lib/client/sdk.gen'

export const load: PageLoad = async ({  }) => {
    try {
        const resp = await userControllerGetMe({
            credentials: 'include'
        })
        
        console.log('Page load response:', resp)
        
        if (resp.data) {
            console.log('User data found:', resp.data)
            return {
                user: resp.data
            }
        } else {
            console.log('No user data found')
            return {
                user: null
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error)
        return {
            user: null
        }
    }
};