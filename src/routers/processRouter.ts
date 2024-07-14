import { Hono } from "hono";
import { cors } from "hono/cors";
import axios from "axios";
import gql from "graphql-tag";
import { print } from "graphql";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const processRouter = new Hono();
processRouter.use(cors());
const prisma = new PrismaClient();
processRouter.post('/getProcesses', async (c) => {
  const { walletadress } = await c.req.json();
  const query = gql`
    query {
      transactions(
        owners: "${walletadress}", 
        tags: [{ name: "Data-Protocol", values: ["ao"] }, { name: "Type", values: ["Process"] }],
        first: 999
      ) {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: print(query),
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    return c.json(response.data);
  }
  catch (error) {
    console.log(error)
    return c.json({ error: "Internal server error" });
  }
});
processRouter.get('/getMessages/:entity', async (c) => {
  const entity = c.req.param('entity');
  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: `query ($entityId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) {
                          transactions(
                            sort: $sortOrder
                            first: $limit
                            after: $cursor
                            recipients: [$entityId]
                          ) {
                            count
                            ...MessageFields
                            __typename
                          }
                        }
                        fragment MessageFields on TransactionConnection {
                          edges {
                            cursor
                            node {
                              id
                              recipient
                              block {
                                timestamp
                                height
                                __typename
                              }
                              ingested_at
                              tags {
                                name
                                value
                                __typename
                              }
                              data {
                                size
                                __typename
                              }
                              owner {
                                address
                                __typename
                              }
                              __typename
                            }
                            __typename
                          }
                          __typename
                        }`,
        variables: {
          cursor: "",
          entityId: entity,
          limit: 25,
          sortOrder: "HEIGHT_DESC"
        }
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    const data= response.data
    return c.json({ data });
  } catch (error) {
    return c.json({ error: "Internal server error" });
  }
})
// Define your task function
async function fetchDataAfterInterval(interval: number, entity: string) {
  try {
    const response = await axios.post(
      'https://arweave-search.goldsky.com/graphql',
      {
        query: `
          query ($entityId: String!, $limit: Int!, $sortOrder: SortOrder!, $cursor: String) {
            transactions(
              sort: $sortOrder
              first: $limit
              after: $cursor
              recipients: [$entityId]
            ) {
              count
              ...MessageFields
            }
          }
          
          fragment MessageFields on TransactionConnection {
            edges {
              cursor
              node {
                id
                recipient
                block {
                  timestamp
                  height
                }
                ingested_at
                tags {
                  name
                  value
                }
                data {
                  size
                }
                owner {
                  address
                }
              }
            }
          }
        `,
        variables: {
          cursor: "",
          entityId: entity,
          limit: 25,
          sortOrder: "HEIGHT_DESC"
        }
      },
      {
        headers: {
          'accept': 'application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed',
          'accept-language': 'en-US,en;q=0.9',
          'content-type': 'application/json',
          'origin': 'https://www.ao.link',
          'priority': 'u=1, i',
          'referer': 'https://www.ao.link/',
          'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'cross-site',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
        }
      }
    );
    
    const ids = response.data.data.transactions.edges.map((edge: any) => edge.node.id);
    
    // Store fetched data IDs in database
    await prisma.message.createMany({
      data: ids.map((id: any) => ({ id, entity }))
    });

    // Schedule the next fetch after the interval
    setTimeout(() => {
      fetchDataAfterInterval(interval, entity);
    }, interval);

    return { ids };
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Rethrow the error to be caught by the caller
  }
}
// Endpoint to fetch cat data after the specified interval
processRouter.get('/getmessageId/:interval/:entity', async (c) => {
  try {
    const interval = parseInt(c.req.param('interval')) * 1000; // Convert seconds to milliseconds
    const entity = c.req.param('entity');

    // Start fetching data immediately
    const initial = await fetchDataAfterInterval(interval, entity);

    return c.json({ message: `Fetching cat data every ${interval / 1000} seconds.`, data: initial });
  } catch (error) {
    console.error('Error in getCatData endpoint:', error);
    return c.json({ error: 'Failed to fetch cat data.' });
  }
});
export default processRouter;