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

import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  offsetToCursor,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
  toGlobalId,
} from 'graphql-relay';

import { subscriptionWithClientId } from 'graphql-relay-subscription';

import {
  addTodo,
  changeTodoStatus,
  getTodo,
  getTodos,
  getUser,
  getViewer,
  markAllTodos,
  removeCompletedTodos,
  removeTodo,
  renameTodo,
} from './database';

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    const {type, id} = fromGlobalId(globalId);
    if (type === 'Todo') {
      return getTodo(id);
    } else if (type === 'User') {
      return getUser(id);
    }
    return null;
  },
  (obj) => {
    return obj.text ? GraphQLTodo : GraphQLUser;
  }
);

const GraphQLTodo = new GraphQLObjectType({
  name: 'Todo',
  fields: {
    id: globalIdField('Todo'),
    text: {
      type: GraphQLString,
      resolve: (obj) => obj.text,
    },
    complete: {
      type: GraphQLBoolean,
      resolve: (obj) => obj.complete,
    },
  },
  interfaces: [nodeInterface],
});

const {
  connectionType: TodosConnection,
  edgeType: GraphQLTodoEdge,
} = connectionDefinitions({
  name: 'Todo',
  nodeType: GraphQLTodo,
});

const GraphQLUser = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: globalIdField('User'),
    todos: {
      type: TodosConnection,
      args: {
        status: {
          type: GraphQLString,
          defaultValue: 'any',
        },
        ...connectionArgs,
      },
      resolve: (obj, {status, ...args}) =>
        connectionFromPromisedArray(getTodos(status), args),
    },
    totalCount: {
      type: GraphQLInt,
      resolve: () => {
        return new Promise((resolve, reject) => {
          getTodos().then(todos => {
            resolve(todos.length);
          });
        });
      },
    },
    completedCount: {
      type: GraphQLInt,
      resolve: () => {
        return new Promise((resolve, reject) => {
          getTodos('completed').then(todos => {
            resolve(todos.length);
          });
        });
      }
    },
  },
  interfaces: [nodeInterface],
});

const Root = new GraphQLObjectType({
  name: 'Root',
  fields: {
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
    node: nodeField,
  },
});

const GraphQLAddTodoMutation = mutationWithClientMutationId({
  name: 'AddTodo',
  inputFields: {
    text: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    todoEdge: {
      type: GraphQLTodoEdge,
      resolve: (todo) => {
        return new Promise((resolve, reject) => {
          getTodos().then(todos => {
            resolve({
              cursor: offsetToCursor(todos.length - 1),
              node: todo,
            });
          });   
        });
      },
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({text}) => addTodo(text),
});

const GraphQLChangeTodoStatusMutation = mutationWithClientMutationId({
  name: 'ChangeTodoStatus',
  inputFields: {
    complete: { type: new GraphQLNonNull(GraphQLBoolean) },
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    todo: {
      type: GraphQLTodo,
      resolve: todo => todo,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({id, complete}) => {
    const localTodoId = fromGlobalId(id).id;
    return changeTodoStatus(localTodoId, complete);
  },
});

const GraphQLMarkAllTodosMutation = mutationWithClientMutationId({
  name: 'MarkAllTodos',
  inputFields: {
    complete: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
  outputFields: {
    changedTodos: {
      type: new GraphQLList(GraphQLTodo),
      resolve: (changedTodoLocalIds) => changedTodoLocalIds.map(getTodo),
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({complete}) => {
    return markAllTodos(complete);
  },
});

// TODO: Support plural deletes
const GraphQLRemoveCompletedTodosMutation = mutationWithClientMutationId({
  name: 'RemoveCompletedTodos',
  outputFields: {
    deletedTodoIds: {
      type: new GraphQLList(GraphQLString),
      resolve: ({deletedTodoIds}) => deletedTodoIds,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: () => {
    return new Promise((resolve, reject) => {
      removeCompletedTodos().then(deletedTodoLocalIds => {
        const deletedTodoIds = deletedTodoLocalIds.map(toGlobalId.bind(null, 'Todo'));
        resolve({deletedTodoIds});
      });
    });
  },
});

const GraphQLRemoveTodoMutation = mutationWithClientMutationId({
  name: 'RemoveTodo',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    deletedTodoId: {
      type: GraphQLID,
      resolve: ({id}) => id,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  mutateAndGetPayload: ({id}) => {
    const localTodoId = fromGlobalId(id).id;
    removeTodo(localTodoId);
    return {id};
  },
});

const GraphQLRenameTodoMutation = mutationWithClientMutationId({
  name: 'RenameTodo',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    text: { type: new GraphQLNonNull(GraphQLString) },
  },
  outputFields: {
    todo: {
      type: GraphQLTodo,
      resolve: todo => todo,
    },
  },
  mutateAndGetPayload: ({id, text}) => {
    const localTodoId = fromGlobalId(id).id;
    return renameTodo(localTodoId, text);
  },
});

const GraphQLAddTodoSubscription = subscriptionWithClientId({
  name: 'AddTodoSubscription',
  outputFields: {
    todoEdge: {
      type: GraphQLTodoEdge,
      resolve: obj => {
        return new Promise((resolve, reject) => {
          getTodos().then(todos => {
            resolve({
              cursor: offsetToCursor(todos.length - 1),
              node: obj,
            });
          });
        });
      },
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  subscribe: (input, context) => {
    context.subscribe('add_todo');
  },
});


const GraphQLRemoveTodoSubscription = subscriptionWithClientId({
  name: 'RemoveTodoSubscription',
  outputFields: {
    deletedTodoId: {
      type: GraphQLID,
      resolve: ({ id }) => toGlobalId('Todo', id),
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  subscribe: (input, context) => {
    context.subscribe('delete_todo');
  },
});

const GraphQLUpdateTodoSubscription = subscriptionWithClientId({
  name: 'UpdateTodoSubscription',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    todo: {
      type: GraphQLTodo,
      resolve: obj => obj,
    },
    viewer: {
      type: GraphQLUser,
      resolve: () => getViewer(),
    },
  },
  subscribe: ({ id }, context) => {
    context.subscribe(`update_todo_${fromGlobalId(id).id}`);
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addTodo: GraphQLAddTodoMutation,
    changeTodoStatus: GraphQLChangeTodoStatusMutation,
    markAllTodos: GraphQLMarkAllTodosMutation,
    removeCompletedTodos: GraphQLRemoveCompletedTodosMutation,
    removeTodo: GraphQLRemoveTodoMutation,
    renameTodo: GraphQLRenameTodoMutation,
  },
});

const Subscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    addTodoSubscription: GraphQLAddTodoSubscription,
    removeTodoSubscription: GraphQLRemoveTodoSubscription,
    updateTodoSubscription: GraphQLUpdateTodoSubscription,
  },
});

export const schema = new GraphQLSchema({
  query: Root,
  mutation: Mutation,
  subscription: Subscription,
});
