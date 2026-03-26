import { client } from "$services/redis";
import {
  itemsKey,
  itemsByViewsKey,
  itemsViewsKey
} from '$services/keys'

export const incrementView = async (itemId: string, userId: string) => {
  
  // const inserted = await client.pfAdd(itemsViewsKey(itemId),userId) // Hyperloglog

  // if(inserted){
  // return Promise.all([
  //   client.hIncrBy(itemsKey(itemId),'views',1),
  //   client.zIncrBy(itemsByViewsKey(), 1, itemId) // increase score by one
  // ])
  // }
  return client.incrementView(itemId,userId)
};

// lua script needs:

//keys need to access
// 1) itemsViewsKey
// 2) itemsKey
// 3) itemsByViewsKey

// Arguments I need to accept
// userId
// itemId