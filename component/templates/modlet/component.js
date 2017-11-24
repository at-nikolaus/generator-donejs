import Component from 'can-component';
import ViewModel from './vm';
import './<%= name %>.less';
import view from './<%= name %>.stache';

export const component = {
  tag: '<%= tag %>',
  ViewModel,
  view
}

export default Component.extend(component);
