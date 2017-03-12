/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import express from 'express';
import graphQLHTTP from 'express-graphql';
import { graphqlSubscribe } from 'graphql-relay-subscription';
import { graphql } from 'graphql';
import {schema} from './data/schema';
import {addNotifier} from './data/database';

const GRAPHQL_PORT = 8080;

// Expose a GraphQL endpoint
const graphQLServer = express();
graphQLServer.use('/', graphQLHTTP({graphiql: true, schema, pretty: true}));
const httpServer = graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}`
));

const io = require('socket.io')(httpServer, {
  serveClient: false,
});

io.on('connection', socket => {
  console.log('Socket connection');
  const topics = Object.create(null);
  const unsubscribeMap = Object.create(null);

  const removeNotifier = addNotifier(({ topic, data }) => {
    const topicListeners = topics[topic];
    if (!topicListeners) return;
 
    topicListeners.forEach(({ id, query, variables }) => {
      graphql(
        schema,
        query,
        data,
        null,
        variables
      ).then((result) => {
        console.log('subscription update');
        console.log(JSON.stringify(result));
        socket.emit('subscription update', { id, ...result });
      });
    });
  });

  socket.on('subscribe', ({ id, query, variables }) => {
    console.log('Socket subscribe');
    function unsubscribe(topic, subscription) {
      const index = topics[topic].indexOf(subscription);
      if (index === -1) return;

      topics[topic].splice(index);

      console.log(
        'Removed subscription for topic %s. Total subscriptions for topic: %d',
        topic,
        topics[topic].length
      );
    }

    function subscribe(topic) {
      topics[topic] = topics[topic] || [];
      const subscription = { id, query, variables };

      topics[topic].push(subscription);

      unsubscribeMap[id] = () => {
        unsubscribe(topic, subscription);
      };

      console.log(
        'New subscription for topic %s. Total subscriptions for topic: %d',
        topic,
        topics[topic].length
      );
    }

    graphqlSubscribe({
      schema,
      query,
      variables,
      context: { subscribe },
    }).then((result) => {
      if (result.errors) {
        console.error('Subscribe failed', result.errors);
      }
    });
  });

  socket.on('unsubscribe', (id) => {
    console.log('Socket unsubscribe');
    const unsubscribe = unsubscribeMap[id];
    if (!unsubscribe) return;

    unsubscribe();
    delete unsubscribeMap[id];
    socket.emit('subscription closed', id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnect');
    removeNotifier();
  });
});
