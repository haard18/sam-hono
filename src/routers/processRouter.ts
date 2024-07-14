import { Hono } from "hono";
import { cors } from "hono/cors";
import axios from "axios";
import gql from "graphql-tag";
import { print } from "graphql";
const processRouter = new Hono();
processRouter.use(cors());
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
processRouter.get('/getMessages/:entity',async(c)=>{
  const entity=c.req.param('entity');
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
    return c.json(response.data);
  } catch (error) {
    return c.json({ error: "Internal server error" });
  }
})

    
export default processRouter;