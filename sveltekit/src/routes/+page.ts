import type { PageLoad } from './$types';
import {userGetMe} from '$lib/client/sdk.gen'
import type {UserPublic} from '$lib/client/types.gen'

export const load: PageLoad = async ({  }) => {
    try {
        const resp = await userGetMe({
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