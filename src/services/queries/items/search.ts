import { client } from "$services/redis";
import { deserialize } from "./deserialize";
import { itemsIndexKey } from "$services/keys";

export const searchItems = async (term: string, size: number = 5) => {
  const cleaned = term
  .replaceAll(/[^a-zA-Z0-9 ]/g,'') // Find all characters which are not alphanumeric and spoce
  .trim() // remove extra space before and after the string
  .split(' ') // array of words
  .map((word) => word ? `%${word}%` : '')
  .join(' ') // and operator, join all words with space

  // Look at cleaned and make sure it is valid
  if(cleaned === ''){
    return []
  }

  
  const query = `(@name:(${cleaned}) => { $weight: 5.0 }) | (@description:(${cleaned}))` // weighing fields along with 'and-or' operation
  //use client to do actual search
  const results = await client.ft.search(
    itemsIndexKey(),
    query,{
      LIMIT: {
        from: 0,
        size
      }
    }
  )

  // deserialize and return results
  return results.documents.map(({id,value}) => deserialize(id,value as any))
};
