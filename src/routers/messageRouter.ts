import { Hono } from "hono";
import { cors } from "hono/cors";
import axios from "axios";
import { result, results } from "@permaweb/aoconnect";
const messageRouter = new Hono();
messageRouter.use(cors());
messageRouter.get('/getOwner/:msgId', async (c) => {
    const msgId = c.req.param('msgId');
    console.log(msgId);
    try {
        const response = await axios.post(
            'https://arweave-search.goldsky.com/graphql',
            {
                query: `query ($id: ID!) {
          transactions(ids: [$id]) {
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
        }
        `,
                variables: {
                    id: msgId
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
        const edges = response.data?.data?.transactions?.edges;
        if (edges && edges.length > 0 && edges[0]?.node?.owner?.address) {
            return c.json(edges[0].node.owner.address);
        } else {
            return c.json({ error: "Owner address not found" });
        }
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error" });
    }
})
messageRouter.get('/getResult/:msgId/:processId', async (c) => {
    const msgId = c.req.param('msgId');
    const processId = c.req.param('processId');
    try {
        let { Messages, Spawns, Output, Error } = await result({
            message: msgId,
            process: processId
        })
        return c.json({ Messages, Spawns, Output, Error });
    } catch (error) {
        return c.json({ error: "Error" });
    }
})
messageRouter.post('/getResults', async (c) => {
    const { msgIds, processId } = await c.req.json();
    if (!Array.isArray(msgIds)) {
        return c.json({ error: "msgIds should be an array" });
    }

    try {
        const results = await Promise.all(msgIds.map(async (msgId) => {
            try {
                let { Messages, Spawns, Output, Error } = await result({
                    message: msgId,
                    process: processId
                });
                return { Output };
            } catch (error) {
                return { msgId, error: "Error processing message" };
            }
        }));

        return c.json(results);
    } catch (error) {
        console.error(error);
        return c.json({ error: "Error" });
    }
});
export default messageRouter;