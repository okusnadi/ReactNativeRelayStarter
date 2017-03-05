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
'use strict';

import React, {Component} from 'react';
import Relay, { RootContainer } from 'react-relay'; 
import {
    Button,
} from 'react-native';

import TodoAppRoute from '../routes/TodoAppRoute';

class Home extends Component {
  static navigationOptions = {
    title: 'Home',
  }

  render() {
    return (
      <Button
        onPress={() => this.props.relay.route.navigation.navigate('TodoApp')}
        title={`TOTAL ${this.props.viewer.totalCount} TODOS`}
      />
    );
  }
}

const HomeContainer = Relay.createContainer(Home, {
  initialVariables: {
    status: 'any',
  },
  fragments: {
    viewer: variables => Relay.QL`
      fragment on User {
        totalCount
      }
    `,
  },
});

export default class HomeRelayRootContainer extends Component {
  constructor(props, context) {
    super(props, context);
    this.route = new TodoAppRoute({status: 'any'}, this.props.navigation);
  }
  render() {
    return (
      <RootContainer
        Component={HomeContainer}
        route={this.route}
      />
    );
  }
}